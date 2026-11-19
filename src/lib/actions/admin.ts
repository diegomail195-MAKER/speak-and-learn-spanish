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
