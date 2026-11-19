import "server-only";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { appUrl, sendEmail } from "@/lib/email";
import { firstNameOf, welcomeEmail, type Rendered } from "./templates";

// Sends an automatic email at most once per key. The key row is inserted first (a unique
// primary key), so two webhook retries or two parallel requests can never both send. If the
// provider fails, the row is removed so a later retry of the same event can try again.
export async function sendOnce(key: string, to: string, userId: string | null, kind: string, msg: Rendered): Promise<"sent" | "duplicate" | "failed"> {
  try {
    await db.emailLog.create({ data: { key, to, userId, kind, subject: msg.subject } });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") return "duplicate";
    throw e;
  }
  const ok = await sendEmail({ to, subject: msg.subject, text: msg.text, html: msg.html });
  if (!ok) {
    await db.emailLog.delete({ where: { key } }).catch(() => undefined);
    return "failed";
  }
  return "sent";
}

/** Reserves extra keys covered by an email already sent (e.g. a combined purchase email). */
export async function claimKeys(keys: string[], to: string, userId: string | null, kind: string, subject: string) {
  for (const key of keys) {
    await db.emailLog.create({ data: { key, to, userId, kind, subject } }).catch(() => undefined);
  }
}

export async function alreadySent(key: string) {
  return !!(await db.emailLog.findUnique({ where: { key } }));
}

/** Welcome email, once per account, only for a verified email. Later sign-ins never resend it. */
export async function sendWelcomeIfDue(userId: string) {
  const user = await db.user.findUnique({ where: { id: userId }, include: { teacher: true } });
  if (!user?.email || !user.emailVerifiedAt || user.welcomeSentAt) return "skipped";
  const msg = welcomeEmail({ firstName: firstNameOf(user.displayName), dashboardUrl: `${appUrl()}/teacher`, isTeacher: !!user.teacher, appUrl: appUrl() });
  const res = await sendOnce(`welcome:${user.id}`, user.email, user.id, "welcome", msg);
  if (res === "sent") await db.user.update({ where: { id: user.id }, data: { welcomeSentAt: new Date() } });
  return res;
}
