"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { grantAdmin } from "@/lib/admin-grant";
import { audit } from "@/lib/audit";
import { adminEmails } from "@/lib/auth/admin";
import { requireAdmin } from "@/lib/auth/guards";
import { db } from "@/lib/db";

// Platform Admin › Users & Schools. Every action checks requireAdmin() on the server and records
// the change in the audit log (author, date, action). Administrator access is only given through
// the project's server process (grantAdmin in src/lib/admin-grant.ts): verified accounts are
// promoted, unverified ones get the verification email first, and unknown emails an invitation.

export type AdminState = { error?: string; message?: string } | undefined;

const GRANT_MESSAGE = {
  promoted: "is now an administrator.",
  already: "is already an administrator.",
  verification_sent: "hasn't verified the email yet: we sent the verification link. The role is given once it's verified.",
  invited: "has no account yet: we sent an administrator invitation.",
} as const;

export async function inviteAdmin(_: AdminState, form: FormData): Promise<AdminState> {
  const { user } = await requireAdmin();
  const email = z.string().trim().toLowerCase().email("Write a valid email.").safeParse(form.get("email"));
  if (!email.success) return { error: email.error.issues[0].message };
  const target = await db.user.findUnique({ where: { email: email.data }, select: { id: true, role: true } });
  if (target?.role === "STUDENT") return { error: "Student accounts can't be administrators." };
  const result = await grantAdmin(email.data);
  await audit(user.schoolId, user.id, result === "promoted" ? "user.promote_admin" : "user.invite_admin", "User", target?.id ?? null, { email: email.data, result });
  revalidatePath("/admin/users");
  return { message: `${email.data} ${GRANT_MESSAGE[result]}` };
}

export async function revokeAdmin(_: AdminState, form: FormData): Promise<AdminState> {
  const { user } = await requireAdmin();
  const id = String(form.get("userId"));
  if (id === user.id) return { error: "You can't remove your own administrator role." };
  const target = await db.user.findUnique({ where: { id } });
  if (!target || target.role !== "ADMIN") return { error: "That account isn't an administrator." };
  if (target.email && adminEmails().includes(target.email.toLowerCase())) return { error: "This email is listed in ADMIN_EMAILS: remove it there first, or the role comes back at the next sign-in." };
  if ((await db.user.count({ where: { role: "ADMIN" } })) <= 1) return { error: "The platform needs at least one administrator." };
  await db.user.update({ where: { id }, data: { role: "TEACHER" } });
  // Open sessions keep working as a teacher; the admin pages check the role on every request.
  await audit(user.schoolId, user.id, "user.revoke_admin", "User", id, { email: target.email });
  revalidatePath("/admin/users");
  return { message: `${target.displayName} is now a teacher.` };
}

/** Signs an account out of every device (e.g. a lost laptop). */
export async function endSessions(_: AdminState, form: FormData): Promise<AdminState> {
  const { user } = await requireAdmin();
  const id = String(form.get("userId"));
  if (id === user.id) return { error: "Use Sign out for your own account." };
  const target = await db.user.findUnique({ where: { id }, select: { displayName: true } });
  if (!target) return { error: "Account not found." };
  const { count } = await db.session.deleteMany({ where: { userId: id } });
  await audit(user.schoolId, user.id, "user.end_sessions", "User", id, { sessions: count });
  revalidatePath("/admin/users");
  return { message: `${target.displayName} was signed out of ${count} session${count === 1 ? "" : "s"}.` };
}

const schoolName = z.string().trim().min(2, "Write the school name.").max(120);

export async function createSchool(_: AdminState, form: FormData): Promise<AdminState> {
  const { user } = await requireAdmin();
  const name = schoolName.safeParse(form.get("name"));
  if (!name.success) return { error: name.error.issues[0].message };
  if (await db.school.findFirst({ where: { name: { equals: name.data, mode: "insensitive" } } })) return { error: "A school with that name already exists." };
  const s = await db.school.create({ data: { name: name.data } });
  await audit(s.id, user.id, "school.create", "School", s.id, { name: s.name });
  revalidatePath("/admin/users");
  return { message: `${s.name} was added.` };
}

export async function renameSchool(_: AdminState, form: FormData): Promise<AdminState> {
  const { user } = await requireAdmin();
  const id = String(form.get("schoolId"));
  const name = schoolName.safeParse(form.get("name"));
  if (!name.success) return { error: name.error.issues[0].message };
  const s = await db.school.findUnique({ where: { id } });
  if (!s) return { error: "School not found." };
  await db.school.update({ where: { id }, data: { name: name.data } });
  await audit(id, user.id, "school.rename", "School", id, { from: s.name, to: name.data });
  revalidatePath("/admin/users");
  return { message: "Saved." };
}

/**
 * Moves a teacher (or admin) to another school, together with the classes they own, those
 * classes' students and the teacher's assignments. Co-teaching links across the two schools are
 * removed (co-teachers must share a school). Teachers who own activities or videos (which use
 * their school's media) are moved by merging the schools instead.
 */
export async function moveUser(_: AdminState, form: FormData): Promise<AdminState> {
  const { user } = await requireAdmin();
  const d = z.object({ userId: z.string().min(1), schoolId: z.string().min(1) }).safeParse({ userId: form.get("userId"), schoolId: form.get("schoolId") });
  if (!d.success) return { error: "Choose a school." };
  const [target, school] = await Promise.all([
    db.user.findUnique({ where: { id: d.data.userId }, select: { id: true, role: true, displayName: true, schoolId: true, school: { select: { name: true } }, teacher: { select: { id: true, _count: { select: { games: true, videos: true } } } } } }),
    db.school.findUnique({ where: { id: d.data.schoolId }, select: { id: true, name: true } }),
  ]);
  if (!target) return { error: "Account not found." };
  if (!school) return { error: "School not found." };
  if (target.schoolId === school.id) return { error: `${target.displayName} is already in ${school.name}.` };
  if (target.role === "STUDENT") return { error: "Students move with their class: move their teacher, or merge the schools." };
  const t = target.teacher;
  if (t && (t._count.games || t._count.videos)) {
    return { error: `${target.displayName} owns ${t._count.games} activit${t._count.games === 1 ? "y" : "ies"} and ${t._count.videos} video${t._count.videos === 1 ? "" : "s"}, which use their school's media. Merge ${target.school.name} into ${school.name} instead.` };
  }
  const moved = await db.$transaction(async (tx) => {
    await tx.user.update({ where: { id: target.id }, data: { schoolId: school.id } });
    if (!t) return { classes: 0, students: 0 };
    await tx.teacher.update({ where: { id: t.id }, data: { schoolId: school.id } });
    const classes = await tx.classroom.findMany({ where: { teacherId: t.id }, select: { id: true } });
    const classIds = classes.map((c) => c.id);
    const students = await tx.student.findMany({ where: { classroomId: { in: classIds } }, select: { id: true, userId: true } });
    await tx.classroom.updateMany({ where: { id: { in: classIds } }, data: { schoolId: school.id } });
    await tx.student.updateMany({ where: { id: { in: students.map((s) => s.id) } }, data: { schoolId: school.id } });
    await tx.user.updateMany({ where: { id: { in: students.map((s) => s.userId) } }, data: { schoolId: school.id } });
    await tx.assignment.updateMany({ where: { teacherId: t.id }, data: { schoolId: school.id } });
    // Co-teaching only within one school: drop links to classes left behind, and other teachers' links to the moved classes.
    await tx.classroomTeacher.deleteMany({ where: { OR: [{ teacherId: t.id, classroom: { schoolId: { not: school.id } } }, { classroomId: { in: classIds }, teacher: { schoolId: { not: school.id } } }] } });
    return { classes: classIds.length, students: students.length };
  });
  await audit(school.id, user.id, "user.move_school", "User", target.id, { from: target.school.name, to: school.name, ...moved });
  revalidatePath("/admin/users");
  const extra = moved.classes ? ` with ${moved.classes} class${moved.classes === 1 ? "" : "es"} and ${moved.students} student${moved.students === 1 ? "" : "s"}` : "";
  return { message: `${target.displayName} moved to ${school.name}${extra}.` };
}

/**
 * Merges one school into another: every person, class, activity, video, assignment and file of
 * the first school moves to the second, then the first school is deleted. Typical use: a teacher
 * who signed up alone joins their real school.
 */
export async function mergeSchool(_: AdminState, form: FormData): Promise<AdminState> {
  const { user } = await requireAdmin();
  const fromId = String(form.get("schoolId") ?? "");
  const intoId = String(form.get("intoId") ?? "");
  if (!intoId) return { error: "Choose the school to merge into." };
  if (fromId === intoId) return { error: "Choose a different school." };
  const [from, into] = await Promise.all([db.school.findUnique({ where: { id: fromId }, select: { id: true, name: true } }), db.school.findUnique({ where: { id: intoId }, select: { id: true, name: true } })]);
  if (!from || !into) return { error: "School not found." };
  const counts = await db.$transaction(
    async (tx) => {
      const where = { schoolId: from.id };
      const data = { schoolId: into.id };
      // Unique per school: keep the destination's copy of a word list entry; cached audio keeps working under a new key.
      const words = await tx.keepWord.findMany({ where: { schoolId: into.id }, select: { word: true } });
      await tx.keepWord.deleteMany({ where: { schoolId: from.id, word: { in: words.map((w) => w.word) } } });
      const keys = await tx.audioAsset.findMany({ where: { schoolId: into.id }, select: { cacheKey: true } });
      const clash = await tx.audioAsset.findMany({ where: { schoolId: from.id, cacheKey: { in: keys.map((k) => k.cacheKey).filter((k): k is string => !!k) } }, select: { id: true, cacheKey: true } });
      for (const a of clash) await tx.audioAsset.update({ where: { id: a.id }, data: { cacheKey: `${a.cacheKey}:merged:${a.id}` } });
      const users = await tx.user.updateMany({ where, data });
      await tx.teacher.updateMany({ where, data });
      const students = await tx.student.updateMany({ where, data });
      const classes = await tx.classroom.updateMany({ where, data });
      await Promise.all([
        tx.category.updateMany({ where, data }),
        tx.mediaAsset.updateMany({ where, data }),
        tx.audioAsset.updateMany({ where, data }),
        tx.video.updateMany({ where, data }),
        tx.game.updateMany({ where, data }),
        tx.assignment.updateMany({ where, data }),
        tx.collection.updateMany({ where, data }),
        tx.keepWord.updateMany({ where, data }),
        tx.auditLog.updateMany({ where, data }),
      ]);
      await tx.school.delete({ where: { id: from.id } });
      return { users: users.count, students: students.count, classes: classes.count };
    },
    { timeout: 30_000 },
  );
  await audit(into.id, user.id, "school.merge", "School", into.id, { from: from.name, into: into.name, ...counts });
  revalidatePath("/admin/users");
  return { message: `${from.name} was merged into ${into.name} (${counts.users} accounts, ${counts.classes} classes).` };
}
