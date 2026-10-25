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

export type StudentFormState = { error?: string; created?: { name: string; pin: string } } | undefined;

const studentSchema = z.object({
  classroomId: z.string(),
  firstName: z.string().trim().min(1, "Escribe el nombre.").max(40),
  lastInitial: z.string().trim().max(1).optional().default(""),
  spellingName: z.string().trim().max(80).optional().default(""),
  groupId: z.string().optional(),
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
  const pin = String(randomInt(0, 10000)).padStart(4, "0");
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
        pinHash: await hashSecret(pin),
        avatar: AVATARS[count % AVATARS.length],
        memberships: group ? { create: { groupId: group.id } } : undefined,
      },
    });
  });
  await audit(user.schoolId, user.id, "student.create", "Student", student.id);
  revalidatePath(`/teacher/classes/${classroom.id}`);
  return { created: { name: d.firstName, pin } };
}

export async function resetStudentPin(_: StudentFormState, form: FormData): Promise<StudentFormState> {
  const { user, teacher } = await requireTeacher();
  const s = await ownedStudent(teacher.id, String(form.get("studentId")));
  const pin = String(randomInt(0, 10000)).padStart(4, "0");
  await db.student.update({ where: { id: s.id }, data: { pinHash: await hashSecret(pin), failedLogins: 0, lockedUntil: null } });
  await audit(user.schoolId, user.id, "student.reset_pin", "Student", s.id);
  return { created: { name: s.firstName, pin } };
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
