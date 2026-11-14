"use server";

import { randomInt } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ownedClassroom, ownedGroup, ownedLevel, ownedStudent } from "@/lib/access";
import { audit } from "@/lib/audit";
import { requireTeacher } from "@/lib/auth/guards";
import { hashSecret } from "@/lib/auth/password";
import { db } from "@/lib/db";
import { AVATARS } from "@/components/ui/Avatar";
import { checkRows, fourDigitPin, friendlyPassword, suggestUsername, uniqueUsername } from "@/lib/roster";
import { HttpError } from "@/lib/auth/guards";

type LoginKind = "PIN" | "PASSWORD";
const rand = (n: number) => randomInt(n);
/** New secret for a login type: the plain value is returned once, only its hash is stored. */
function newSecret(type: LoginKind) {
  return type === "PASSWORD" ? friendlyPassword(rand) : fourDigitPin(rand);
}

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O, 1/I

function newCode() {
  return Array.from({ length: 6 }, () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]).join("");
}

const name = z.string().trim().min(1).max(60);

export async function createClassroom(form: FormData) {
  const { user, teacher } = await requireTeacher();
  const n = name.parse(form.get("name"));
  let code = newCode();
  while (await db.classroom.findUnique({ where: { code } })) code = newCode();
  const c = await db.classroom.create({ data: { name: n, code, schoolId: user.schoolId, teacherId: teacher.id } });
  await audit(user.schoolId, user.id, "classroom.create", "Classroom", c.id);
  revalidatePath("/teacher/classes");
}

export async function createLevel(form: FormData) {
  const { teacher } = await requireTeacher();
  const classroomId = String(form.get("classroomId"));
  await ownedClassroom(teacher.id, classroomId);
  const n = name.parse(form.get("name"));
  const count = await db.level.count({ where: { classroomId } });
  await db.level.upsert({ where: { classroomId_name: { classroomId, name: n } }, create: { classroomId, name: n, sortOrder: count }, update: {} });
  revalidatePath(`/teacher/classes/${classroomId}`);
}

export async function createGroup(form: FormData) {
  const { teacher } = await requireTeacher();
  const level = await ownedLevel(teacher.id, String(form.get("levelId")));
  const n = name.parse(form.get("name"));
  await db.group.upsert({ where: { levelId_name: { levelId: level.id, name: n } }, create: { levelId: level.id, name: n }, update: {} });
  revalidatePath(`/teacher/classes/${level.classroomId}`);
}

export async function deleteGroup(form: FormData) {
  const { user, teacher } = await requireTeacher();
  const g = await ownedGroup(teacher.id, String(form.get("groupId")));
  await db.group.delete({ where: { id: g.id } });
  await audit(user.schoolId, user.id, "group.delete", "Group", g.id, { name: g.name });
  revalidatePath(`/teacher/classes/${g.level.classroomId}`);
}

export type StudentFormState = { error?: string; created?: { name: string; pin: string; username?: string; loginType?: LoginKind } } | undefined;

const studentSchema = z.object({
  classroomId: z.string(),
  firstName: z.string().trim().min(1, "Escribe el nombre.").max(40),
  lastInitial: z.string().trim().max(1).optional().default(""),
  spellingName: z.string().trim().max(80).optional().default(""),
  groupId: z.string().optional(),
  loginType: z.enum(["PIN", "PASSWORD"]).optional().default("PIN"),
});

function slug(s: string) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

export async function createStudent(_: StudentFormState, form: FormData): Promise<StudentFormState> {
  const { user, teacher } = await requireTeacher();
  const parsed = studentSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;
  const classroom = await ownedClassroom(teacher.id, d.classroomId);
  const group = d.groupId ? await ownedGroup(teacher.id, d.groupId) : null;
  if (group && group.level.classroomId !== classroom.id) return { error: "Ese grupo pertenece a otra clase." };

  const base = slug(d.firstName + d.lastInitial) || "student";
  let username = base;
  for (let i = 2; await db.student.findUnique({ where: { classroomId_username: { classroomId: classroom.id, username } } }); i++) username = `${base}${i}`;
  const pin = newSecret(d.loginType);
  const count = await db.student.count({ where: { classroomId: classroom.id } });

  const student = await db.$transaction(async (tx) => {
    const u = await tx.user.create({ data: { schoolId: user.schoolId, role: "STUDENT", displayName: `${d.firstName} ${d.lastInitial}`.trim() } });
    return tx.student.create({
      data: {
        userId: u.id,
        schoolId: user.schoolId,
        classroomId: classroom.id,
        firstName: d.firstName,
        lastInitial: d.lastInitial.toUpperCase(),
        spellingName: d.spellingName,
        username,
        loginType: d.loginType,
        pinHash: await hashSecret(pin),
        avatar: AVATARS[count % AVATARS.length],
        memberships: group ? { create: { groupId: group.id } } : undefined,
      },
    });
  });
  await audit(user.schoolId, user.id, "student.create", "Student", student.id);
  revalidatePath(`/teacher/classes/${classroom.id}`);
  return { created: { name: d.firstName, pin, username, loginType: d.loginType } };
}

export async function resetStudentPin(_: StudentFormState, form: FormData): Promise<StudentFormState> {
  const { user, teacher } = await requireTeacher();
  const s = await ownedStudent(teacher.id, String(form.get("studentId")));
  const pin = newSecret(s.loginType);
  await db.student.update({ where: { id: s.id }, data: { pinHash: await hashSecret(pin), failedLogins: 0, lockedUntil: null } });
  await audit(user.schoolId, user.id, s.loginType === "PASSWORD" ? "student.reset_password" : "student.reset_pin", "Student", s.id);
  return { created: { name: s.firstName, pin, username: s.username, loginType: s.loginType } };
}

export async function setStudentGroups(form: FormData) {
  const { user, teacher } = await requireTeacher();
  const s = await ownedStudent(teacher.id, String(form.get("studentId")));
  const groupIds = form.getAll("groupId").map(String);
  for (const g of groupIds) {
    const owned = await ownedGroup(teacher.id, g);
    if (owned.level.classroomId !== s.classroomId) throw new Error("Group from another class");
  }
  await db.$transaction([
    db.groupMembership.deleteMany({ where: { studentId: s.id } }),
    db.groupMembership.createMany({ data: groupIds.map((groupId) => ({ groupId, studentId: s.id })) }),
  ]);
  await audit(user.schoolId, user.id, "student.set_groups", "Student", s.id, { groupIds });
  revalidatePath(`/teacher/classes/${s.classroomId}`);
}

export async function updateStudent(form: FormData) {
  const { user, teacher } = await requireTeacher();
  const s = await ownedStudent(teacher.id, String(form.get("studentId")));
  const data = z
    .object({ firstName: z.string().trim().min(1).max(40), lastInitial: z.string().trim().max(1), spellingName: z.string().trim().max(80), active: z.enum(["on"]).optional() })
    .parse(Object.fromEntries(form));
  await db.student.update({
    where: { id: s.id },
    data: { firstName: data.firstName, lastInitial: data.lastInitial.toUpperCase(), spellingName: data.spellingName, active: data.active === "on" },
  });
  await db.user.update({ where: { id: s.userId }, data: { displayName: `${data.firstName} ${data.lastInitial}`.trim() } });
  await audit(user.schoolId, user.id, "student.update", "Student", s.id);
  revalidatePath(`/teacher/classes/${s.classroomId}`);
}

// ---------------- LextroSpeak roster ----------------

const rosterEdit = z.object({
  studentId: z.string(),
  firstName: z.string().trim().min(1, "Write the first name.").max(40),
  lastInitial: z.string().trim().max(1).default(""),
  username: z.string().trim().toLowerCase().regex(/^[a-z0-9]{2,30}$/, "Username: 2–30 lowercase letters or numbers."),
  loginType: z.enum(["PIN", "PASSWORD"]),
  active: z.enum(["on"]).optional(),
});

export type RosterState = { error?: string; ok?: boolean; created?: { name: string; pin: string; username: string; loginType: LoginKind } } | undefined;

/** Edits a roster row. A new login type gets a new secret, shown once; the current one is never shown. */
export async function updateRosterStudent(_: RosterState, form: FormData): Promise<RosterState> {
  const { user, teacher } = await requireTeacher();
  const parsed = rosterEdit.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;
  const s = await ownedStudent(teacher.id, d.studentId);
  const clash = await db.student.findFirst({ where: { classroomId: s.classroomId, username: d.username, NOT: { id: s.id } } });
  if (clash) return { error: "That username is already used in this class." };
  const typeChanged = d.loginType !== s.loginType;
  const secret = typeChanged ? newSecret(d.loginType) : null;
  await db.$transaction([
    db.student.update({
      where: { id: s.id },
      data: {
        firstName: d.firstName,
        lastInitial: d.lastInitial.toUpperCase(),
        username: d.username,
        loginType: d.loginType,
        active: d.active === "on",
        ...(secret ? { pinHash: await hashSecret(secret), failedLogins: 0, lockedUntil: null } : {}),
      },
    }),
    db.user.update({ where: { id: s.userId }, data: { displayName: `${d.firstName} ${d.lastInitial.toUpperCase()}`.trim() } }),
  ]);
  await audit(user.schoolId, user.id, "student.roster_edit", "Student", s.id, { loginTypeChanged: typeChanged });
  revalidatePath(`/teacher/classes/${s.classroomId}/roster`);
  return secret ? { ok: true, created: { name: d.firstName, pin: secret, username: d.username, loginType: d.loginType } } : { ok: true };
}

const listSchema = z.object({
  classroomId: z.string(),
  loginType: z.enum(["PIN", "PASSWORD"]).default("PIN"),
  groupId: z.string().optional(),
  rows: z
    .array(z.object({ firstName: z.string().trim().min(1).max(40), lastInitial: z.string().trim().max(1).default(""), username: z.string().trim().toLowerCase().max(30).default("") }))
    .min(1, "Paste at least one student.")
    .max(60, "Up to 60 students at a time."),
});

export type ListResult = { error?: string; problems?: Array<{ row: number; problems: string[] }>; created?: Array<{ name: string; username: string; secret: string }>; loginType?: LoginKind };

/** "Add List": saves the corrected preview. Duplicates are re-checked here; nothing is saved if any remain. */
export async function addStudentList(input: unknown): Promise<ListResult> {
  const { user, teacher } = await requireTeacher();
  const parsed = listSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;
  const classroom = await ownedClassroom(teacher.id, d.classroomId);
  const group = d.groupId ? await ownedGroup(teacher.id, d.groupId) : null;
  if (group && group.level.classroomId !== classroom.id) return { error: "That group belongs to another class." };
  const roster = await db.student.findMany({ where: { classroomId: classroom.id }, select: { firstName: true, lastInitial: true, username: true } });
  const rows = d.rows.map((r) => ({ ...r, lastInitial: r.lastInitial.toUpperCase(), username: r.username || suggestUsername(r.firstName, r.lastInitial) }));
  const checked = checkRows(rows, roster);
  const problems = checked.map((r, i) => ({ row: i + 1, problems: r.problems })).filter((p) => p.problems.length);
  if (problems.length) return { error: "Fix the highlighted rows first.", problems };

  let count = await db.student.count({ where: { classroomId: classroom.id } });
  const taken = new Set(roster.map((r) => r.username));
  const created: Array<{ name: string; username: string; secret: string }> = [];
  const hashed = await Promise.all(
    rows.map(async (r) => {
      const secret = newSecret(d.loginType);
      return { r, secret, hash: await hashSecret(secret) };
    }),
  );
  await db.$transaction(async (tx) => {
    for (const { r, secret, hash } of hashed) {
      const username = uniqueUsername(r.username, taken);
      taken.add(username);
      const u = await tx.user.create({ data: { schoolId: user.schoolId, role: "STUDENT", displayName: `${r.firstName} ${r.lastInitial}`.trim() } });
      await tx.student.create({
        data: {
          userId: u.id,
          schoolId: user.schoolId,
          classroomId: classroom.id,
          firstName: r.firstName,
          lastInitial: r.lastInitial,
          username,
          loginType: d.loginType,
          pinHash: hash,
          avatar: AVATARS[count++ % AVATARS.length],
          memberships: group ? { create: { groupId: group.id } } : undefined,
        },
      });
      created.push({ name: `${r.firstName} ${r.lastInitial}`.trim(), username, secret });
    }
  });
  await audit(user.schoolId, user.id, "student.add_list", "Classroom", classroom.id, { count: created.length });
  revalidatePath(`/teacher/classes/${classroom.id}`);
  revalidatePath(`/teacher/classes/${classroom.id}/roster`);
  return { created, loginType: d.loginType };
}

const groupSchema = z.object({
  name: z.string().trim().min(1, "Give the group a name.").max(60),
  studentIds: z.array(z.string()).max(200).default([]),
});

/** Level used for groups made from "Create Group" when the class has no levels yet. */
async function defaultLevel(classroomId: string) {
  const first = await db.level.findFirst({ where: { classroomId }, orderBy: { sortOrder: "asc" } });
  if (first) return first;
  return db.level.create({ data: { classroomId, name: "Groups", sortOrder: 0 } });
}

async function checkMembers(teacherId: string, classroomId: string, ids: string[]) {
  const unique = [...new Set(ids)];
  const found = await db.student.count({ where: { id: { in: unique }, classroomId, classroom: { teacherId } } });
  if (found !== unique.length) throw new HttpError(400, "Some students aren't in this class.");
  return unique;
}

export type GroupResult = { error?: string; groupId?: string };

export async function createGroupWithMembers(input: unknown): Promise<GroupResult> {
  const { user, teacher } = await requireTeacher();
  const raw = input as { classroomId?: string; levelId?: string };
  const parsed = groupSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const classroom = await ownedClassroom(teacher.id, String(raw.classroomId));
  const level = raw.levelId ? await ownedLevel(teacher.id, raw.levelId) : await defaultLevel(classroom.id);
  if (level.classroomId !== classroom.id) return { error: "That level belongs to another class." };
  if (await db.group.findUnique({ where: { levelId_name: { levelId: level.id, name: parsed.data.name } } })) return { error: "A group with that name already exists." };
  const members = await checkMembers(teacher.id, classroom.id, parsed.data.studentIds);
  const g = await db.group.create({ data: { levelId: level.id, name: parsed.data.name, memberships: { create: members.map((studentId) => ({ studentId })) } } });
  await audit(user.schoolId, user.id, "group.create", "Group", g.id, { members: members.length });
  revalidatePath(`/teacher/classes/${classroom.id}`);
  return { groupId: g.id };
}

export async function updateGroupWithMembers(input: unknown): Promise<GroupResult> {
  const { user, teacher } = await requireTeacher();
  const raw = input as { groupId?: string };
  const parsed = groupSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const g = await ownedGroup(teacher.id, String(raw.groupId));
  const clash = await db.group.findFirst({ where: { levelId: g.levelId, name: parsed.data.name, NOT: { id: g.id } } });
  if (clash) return { error: "A group with that name already exists." };
  const members = await checkMembers(teacher.id, g.level.classroomId, parsed.data.studentIds);
  await db.$transaction([
    db.group.update({ where: { id: g.id }, data: { name: parsed.data.name } }),
    db.groupMembership.deleteMany({ where: { groupId: g.id } }),
    db.groupMembership.createMany({ data: members.map((studentId) => ({ groupId: g.id, studentId })) }),
  ]);
  await audit(user.schoolId, user.id, "group.update", "Group", g.id, { members: members.length });
  revalidatePath(`/teacher/classes/${g.level.classroomId}`);
  return { groupId: g.id };
}
