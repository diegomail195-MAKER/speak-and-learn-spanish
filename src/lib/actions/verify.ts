"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { promoteVerified, syncAdminRole } from "@/lib/auth/admin-role";
import { requireTeacher } from "@/lib/auth/guards";
import { hashSecret } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { sendWelcomeIfDue } from "@/lib/emails/automatic";
import { DEFAULT_CATEGORIES } from "@/lib/games/templates";
import { hashToken, sendVerificationLink, tokenRe } from "@/lib/admin-grant";
import { clientIp, rateLimit } from "@/lib/rate-limit";


export type VerifyState = { error?: string; ok?: boolean } | undefined;

export async function resendVerification(): Promise<VerifyState> {
  const { user } = await requireTeacher();
  if (user.emailVerifiedAt) return { ok: true };
  if (!(await rateLimit(`verify-resend:${user.id}`, 5, 60 * 60_000))) return { error: "Too many emails. Try again later." };
  const ok = await sendVerificationLink(user.id);
  return ok ? { ok: true } : { error: "Email isn't set up yet on this site. Contact the administrator." };
}

/** Confirms the email (a button on /verify-email/[token], so link scanners can't do it). */
export async function confirmEmail(_: VerifyState, form: FormData): Promise<VerifyState> {
  const token = String(form.get("token") ?? "");
  if (!tokenRe.test(token)) return { error: "This link isn't valid." };
  if (!(await rateLimit(`verify:${await clientIp()}`, 30, 60 * 60_000))) return { error: "Too many attempts. Wait a few minutes." };
  const row = await db.emailVerificationToken.findUnique({ where: { id: hashToken(token) }, include: { user: true } });
  if (!row || row.expiresAt < new Date()) return { error: "This link expired or was already used. Sign in and ask for a new one." };
  await db.$transaction([
    db.user.update({ where: { id: row.userId }, data: { emailVerifiedAt: new Date() } }),
    db.emailVerificationToken.deleteMany({ where: { userId: row.userId } }),
  ]);
  await audit(row.user.schoolId, row.userId, "user.email_verified", "User", row.userId);
  // A pending admin invite for this email, or ADMIN_EMAILS, gives the role now that it's verified.
  const invite = row.user.email ? await db.adminInvite.findFirst({ where: { email: row.user.email, acceptedAt: null, expiresAt: { gt: new Date() } } }) : null;
  if (invite) {
    await promoteVerified(row.userId, "invite");
    await db.adminInvite.update({ where: { id: invite.id }, data: { acceptedAt: new Date() } });
  } else {
    await syncAdminRole(row.userId);
  }
  await sendWelcomeIfDue(row.userId);
  return { ok: true };
}

export async function inviteValid(token: string) {
  if (!tokenRe.test(token)) return null;
  const inv = await db.adminInvite.findUnique({ where: { id: hashToken(token) } });
  if (!inv || inv.acceptedAt || inv.expiresAt < new Date()) return null;
  if (await db.user.findUnique({ where: { email: inv.email } })) return null;
  return { email: inv.email };
}

const acceptSchema = z
  .object({
    token: z.string().regex(tokenRe),
    displayName: z.string().trim().min(2, "Write your name.").max(80),
    schoolName: z.string().trim().min(2, "Write your school or organization.").max(120),
    password: z.string().min(10, "The password needs at least 10 characters.").max(200),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, { message: "The passwords don't match." });

export async function acceptAdminInvite(_: VerifyState, form: FormData): Promise<VerifyState> {
  const parsed = acceptSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  if (!(await rateLimit(`invite:${await clientIp()}`, 20, 60 * 60_000))) return { error: "Too many attempts. Wait a few minutes." };
  const d = parsed.data;
  const inv = await db.adminInvite.findUnique({ where: { id: hashToken(d.token) } });
  if (!inv || inv.acceptedAt || inv.expiresAt < new Date()) return { error: "This invitation expired or was already used." };
  if (await db.user.findUnique({ where: { email: inv.email } })) return { error: "An account with this email already exists. Sign in instead." };
  const passwordHash = await hashSecret(d.password);
  const user = await db.$transaction(async (tx) => {
    const school = await tx.school.create({ data: { name: d.schoolName } });
    // Opening the emailed link proves the address: the account starts verified, as ADMIN.
    const u = await tx.user.create({ data: { schoolId: school.id, role: "ADMIN", email: inv.email, passwordHash, displayName: d.displayName, emailVerifiedAt: new Date() } });
    await tx.teacher.create({ data: { userId: u.id, schoolId: school.id } });
    await tx.category.createMany({ data: DEFAULT_CATEGORIES.map(([nameEn, nameEs], i) => ({ schoolId: school.id, nameEn, nameEs, sortOrder: i })) });
    await tx.adminInvite.update({ where: { id: inv.id }, data: { acceptedAt: new Date() } });
    return u;
  });
  await audit(user.schoolId, user.id, "user.promote_admin", "User", user.id, { via: "invite" });
  await sendWelcomeIfDue(user.id);
  await createSession(user.id, "ADMIN", (await headers()).get("user-agent"));
  redirect("/admin");
}
