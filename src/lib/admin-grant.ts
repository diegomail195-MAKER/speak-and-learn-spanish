import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { z } from "zod";
import { promoteVerified } from "@/lib/auth/admin-role";
import { db } from "@/lib/db";
import { appUrl, sendEmail } from "@/lib/email";
import { adminInviteEmail, firstNameOf, verifyEmail } from "@/lib/emails/templates";

// Email verification links and administrator invitations (no Next.js request APIs here, so the
// admin:grant script can run it from the command line).

const VERIFY_TTL_MS = 24 * 60 * 60_000;
const INVITE_TTL_MS = 7 * 24 * 60 * 60_000;
export const hashToken = (t: string) => createHash("sha256").update(t).digest("hex");
export const tokenRe = /^[A-Za-z0-9_-]{20,100}$/;

/** Emails a fresh verification link (only the newest one works). Server-side only. */
export async function sendVerificationLink(userId: string) {
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user?.email || user.emailVerifiedAt) return false;
  const token = randomBytes(32).toString("base64url");
  await db.$transaction([
    db.emailVerificationToken.deleteMany({ where: { userId } }),
    db.emailVerificationToken.create({ data: { id: hashToken(token), userId, expiresAt: new Date(Date.now() + VERIFY_TTL_MS) } }),
  ]);
  const msg = verifyEmail({ firstName: firstNameOf(user.displayName), link: `${appUrl()}/verify-email/${token}`, appUrl: appUrl() });
  return sendEmail({ to: user.email, ...msg });
}

// ---- Administrator invitations ----

/**
 * Server process behind `npm run admin:grant -- <email>` (scripts/grant-admin.ts):
 *  - verified account → ADMIN role now;
 *  - account not verified yet → invite recorded + verification email; role given on verification;
 *  - no account → invite email with a link to create the admin account.
 */
export async function grantAdmin(emailRaw: string): Promise<"promoted" | "already" | "verification_sent" | "invited"> {
  const email = z.string().trim().toLowerCase().email().parse(emailRaw);
  const user = await db.user.findUnique({ where: { email }, include: { teacher: true } });
  if (user?.role === "ADMIN") return "already";
  if (user && user.emailVerifiedAt && user.teacher) {
    await promoteVerified(user.id, "grant");
    return "promoted";
  }
  const token = randomBytes(32).toString("base64url");
  await db.adminInvite.deleteMany({ where: { email, acceptedAt: null } });
  await db.adminInvite.create({ data: { id: hashToken(token), email, expiresAt: new Date(Date.now() + INVITE_TTL_MS) } });
  if (user) {
    await sendVerificationLink(user.id);
    return "verification_sent";
  }
  await sendEmail({ to: email, ...adminInviteEmail({ link: `${appUrl()}/admin-invite/${token}`, appUrl: appUrl() }) });
  return "invited";
}

