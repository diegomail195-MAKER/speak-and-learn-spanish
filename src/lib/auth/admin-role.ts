import "server-only";
import { db } from "@/lib/db";
import { adminEmails } from "./admin";

// Server process that gives the ADMIN role. Only verified emails are promoted: either the email
// is listed in ADMIN_EMAILS (checked at sign-in and when the email is verified), or the person
// accepted an admin invitation (src/lib/actions/verify.ts, scripts/grant-admin.ts).

export function shouldPromote(user: { role: string; email: string | null; emailVerifiedAt: Date | null }, raw?: string): boolean {
  if (user.role === "ADMIN" || user.role === "STUDENT") return false;
  if (!user.email || !user.emailVerifiedAt) return false;
  return adminEmails(raw).includes(user.email.toLowerCase());
}

export async function syncAdminRole(userId: string): Promise<boolean> {
  const user = await db.user.findUnique({ where: { id: userId }, include: { teacher: true } });
  if (!user || !user.teacher || !shouldPromote(user)) return false;
  await db.user.update({ where: { id: user.id }, data: { role: "ADMIN" } });
  await db.auditLog.create({ data: { schoolId: user.schoolId, actorId: null, action: "user.promote_admin", entityType: "User", entityId: user.id, meta: { via: "ADMIN_EMAILS" } } });
  return true;
}

/** Accepting an invite (the email was just proven by opening the link). */
export async function promoteVerified(userId: string, via: string) {
  const user = await db.user.update({ where: { id: userId }, data: { role: "ADMIN", emailVerifiedAt: new Date() } });
  await db.auditLog.create({ data: { schoolId: user.schoolId, actorId: null, action: "user.promote_admin", entityType: "User", entityId: user.id, meta: { via } } });
}
