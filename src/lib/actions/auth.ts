"use server";

import { createHash, randomBytes } from "node:crypto";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { hashSecret, verifySecret } from "@/lib/auth/password";
import { createSession, destroySession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { appUrl, canSendEmail, sendEmail } from "@/lib/email";
import { DEFAULT_CATEGORIES } from "@/lib/games/templates";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export type FormState = { error?: string; ok?: boolean } | undefined;

const signupSchema = z.object({
  schoolName: z.string().trim().min(2, "Escribe el nombre de tu escuela.").max(120),
  displayName: z.string().trim().min(2, "Escribe tu nombre.").max(80),
  email: z.string().trim().toLowerCase().email("Correo no válido."),
  password: z.string().min(10, "La contraseña debe tener al menos 10 caracteres.").max(200),
});

export async function signUpTeacher(_: FormState, form: FormData): Promise<FormState> {
  const parsed = signupSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { schoolName, displayName, email, password } = parsed.data;
  if (!(await rateLimit(`signup:${await clientIp()}`, 10, 60 * 60_000))) return { error: "Demasiados intentos. Espera unos minutos." };
  if (await db.user.findUnique({ where: { email } })) return { error: "Ya existe una cuenta con ese correo." };

  const passwordHash = await hashSecret(password);
  const user = await db.$transaction(async (tx) => {
    const school = await tx.school.create({ data: { name: schoolName } });
    const u = await tx.user.create({ data: { schoolId: school.id, role: "TEACHER", email, passwordHash, displayName } });
    await tx.teacher.create({ data: { userId: u.id, schoolId: school.id } });
    await tx.category.createMany({
      data: DEFAULT_CATEGORIES.map(([nameEn, nameEs], i) => ({ schoolId: school.id, nameEn, nameEs, sortOrder: i })),
    });
    return u;
  });
  await audit(user.schoolId, user.id, "teacher.signup", "User", user.id);
  await createSession(user.id, "TEACHER", (await headers()).get("user-agent"));
  redirect("/teacher");
}

const loginSchema = z.object({ email: z.string().trim().toLowerCase().email("Correo no válido."), password: z.string().min(1) });

export async function signInTeacher(_: FormState, form: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  // Per IP + email (typing mistakes), and per email from any IP (slow distributed guessing).
  const ip = await clientIp();
  const okIp = await rateLimit(`login:${ip}:${parsed.data.email}`, 8, 10 * 60_000);
  const okEmail = await rateLimit(`login-email:${parsed.data.email}`, 30, 60 * 60_000);
  if (!okIp || !okEmail) return { error: "Demasiados intentos. Espera unos minutos." };
  const user = await db.user.findUnique({ where: { email: parsed.data.email }, include: { teacher: true } });
  const ok = user?.passwordHash && user.teacher ? await verifySecret(parsed.data.password, user.passwordHash) : false;
  if (!user || !ok) return { error: "Correo o contraseña incorrectos." };
  await createSession(user.id, user.role, (await headers()).get("user-agent"));
  redirect("/teacher");
}

const studentSchema = z.object({
  code: z.string().trim().toUpperCase().min(4).max(12),
  studentId: z.string().min(1),
  pin: z.string().regex(/^\d{4}$/, "El PIN tiene 4 números."),
});

export async function signInStudent(_: FormState, form: FormData): Promise<FormState> {
  const parsed = studentSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { code, studentId, pin } = parsed.data;
  // A whole class signs in from one school IP, so this per-IP limit is generous.
  if (!(await rateLimit(`student-login:${await clientIp()}`, 300, 10 * 60_000))) return { error: "Demasiados intentos. Pide ayuda a tu maestra o maestro." };
  const student = await db.student.findFirst({ where: { id: studentId, active: true, classroom: { code } } });
  if (!student) return { error: "No encontramos esa cuenta." };
  if (student.lockedUntil && student.lockedUntil > new Date()) {
    return { error: "Demasiados intentos. Pide ayuda a tu maestra o maestro." };
  }
  if (!(await verifySecret(pin, student.pinHash))) {
    const failed = student.failedLogins + 1;
    const lockMinutes = studentLockMinutes(failed);
    await db.student.update({
      where: { id: student.id },
      data: { failedLogins: failed, lockedUntil: lockMinutes ? new Date(Date.now() + lockMinutes * 60_000) : null },
    });
    return { error: "Ese PIN no es correcto. Inténtalo otra vez." };
  }
  await db.student.update({ where: { id: student.id }, data: { failedLogins: 0, lockedUntil: null } });
  await createSession(student.userId, "STUDENT", (await headers()).get("user-agent"));
  redirect("/learn");
}

/**
 * Lock after wrong PINs, growing so a 4-digit PIN can't be guessed by patient retrying:
 * 5 wrong → 5 min, 10 → 30 min, 15 or more → 2 h. A correct PIN or a teacher's PIN reset clears it.
 */
function studentLockMinutes(failed: number): number {
  if (failed >= 15) return 120;
  if (failed >= 10) return 30;
  if (failed >= 5) return 5;
  return 0;
}

// ---- Forgot password (teachers) ----

const RESET_TTL_MS = 30 * 60_000;
const hashToken = (t: string) => createHash("sha256").update(t).digest("hex");

const forgotSchema = z.object({ email: z.string().trim().toLowerCase().email("Correo no válido.") });

/** Emails a one-time reset link. Always answers the same way, so it never reveals which emails have accounts. */
export async function requestPasswordReset(_: FormState, form: FormData): Promise<FormState> {
  const parsed = forgotSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  if (!canSendEmail()) return { error: "El restablecimiento por correo todavía no está activado. Contacta al administrador del sitio." };
  const { email } = parsed.data;
  const okIp = await rateLimit(`reset-ip:${await clientIp()}`, 10, 60 * 60_000);
  const okEmail = await rateLimit(`reset-email:${email}`, 3, 60 * 60_000);
  if (!okIp || !okEmail) return { error: "Demasiadas solicitudes. Espera unos minutos." };

  // The lookup and the email run after the response is sent, so the answer takes the same time
  // whether or not the account exists.
  after(() => sendResetLink(email));
  return { ok: true };
}

async function sendResetLink(email: string) {
  const user = await db.user.findUnique({ where: { email }, include: { teacher: true } });
  if (user?.teacher && user.passwordHash) {
    const token = randomBytes(32).toString("base64url");
    await db.$transaction([
      db.passwordResetToken.deleteMany({ where: { userId: user.id } }), // only the newest link works
      db.passwordResetToken.create({ data: { id: hashToken(token), userId: user.id, expiresAt: new Date(Date.now() + RESET_TTL_MS) } }),
    ]);
    const link = `${appUrl()}/reset-password/${token}`;
    // Each email gets its own short code in the subject so Gmail shows it as a new message
    // (identical subjects get grouped and the link can end up hidden as "trimmed content").
    const code = randomBytes(3).toString("hex").toUpperCase();
    const name = escapeHtml(user.displayName);
    await sendEmail({
      to: email,
      subject: `Tu enlace para cambiar la contraseña (${code}) · Speak & Learn Spanish`,
      text: `Hola ${user.displayName}:\n\nPara crear una contraseña nueva, abre este enlace. Vence en 30 minutos y solo funciona una vez:\n\n${link}\n\nSi no lo pediste, ignora este correo; tu contraseña no cambia.\n\n---\nTo choose a new password, open the link above (valid for 30 minutes, one use). If you didn't ask for this, ignore this email.\n\nCódigo / code: ${code}`,
      html: `<div style="font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.5;color:#1e2340">
<p>Hola ${name}:</p>
<p>Para crear una contraseña nueva, pulsa el botón. Vence en 30 minutos y solo funciona una vez.</p>
<p style="margin:24px 0"><a href="${link}" style="background:#e4553c;color:#ffffff;text-decoration:none;font-weight:bold;padding:12px 22px;border-radius:999px;display:inline-block">Crear una contraseña nueva</a></p>
<p style="font-size:14px;color:#3b4060">Si el botón no funciona, copia este enlace en tu navegador:<br><a href="${link}" style="color:#1e2340;word-break:break-all">${link}</a></p>
<p style="font-size:14px;color:#3b4060">Si no lo pediste, ignora este correo; tu contraseña no cambia.</p>
<hr style="border:none;border-top:1px solid #e6dfd0">
<p style="font-size:13px;color:#6c6f82">To choose a new password, use the button above (valid for 30 minutes, one use). If you didn't ask for this, ignore this email. · Código / code: ${code}</p>
</div>`,
    });
    await audit(user.schoolId, user.id, "teacher.password_reset_requested", "User", user.id);
  }
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

/** True when the link is still valid (used by the page to show the form or an "expired" message). */
export async function resetTokenValid(token: string): Promise<boolean> {
  if (!/^[A-Za-z0-9_-]{20,100}$/.test(token)) return false;
  const row = await db.passwordResetToken.findUnique({ where: { id: hashToken(token) } });
  return !!row && row.expiresAt > new Date();
}

const resetSchema = z
  .object({
    token: z.string().regex(/^[A-Za-z0-9_-]{20,100}$/),
    password: z.string().min(10, "La contraseña debe tener al menos 10 caracteres.").max(200),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, { message: "Las contraseñas no coinciden." });

export async function resetPassword(_: FormState, form: FormData): Promise<FormState> {
  const parsed = resetSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  if (!(await rateLimit(`reset-submit:${await clientIp()}`, 20, 60 * 60_000))) return { error: "Demasiados intentos. Espera unos minutos." };
  const id = hashToken(parsed.data.token);
  const row = await db.passwordResetToken.findUnique({ where: { id }, include: { user: true } });
  if (!row || row.expiresAt < new Date()) return { error: "Este enlace venció o ya se usó. Pide uno nuevo." };
  const passwordHash = await hashSecret(parsed.data.password);
  // New password, every reset link gone, and every existing session signed out.
  await db.$transaction([
    db.user.update({ where: { id: row.userId }, data: { passwordHash } }),
    db.passwordResetToken.deleteMany({ where: { userId: row.userId } }),
    db.session.deleteMany({ where: { userId: row.userId } }),
  ]);
  await audit(row.user.schoolId, row.userId, "teacher.password_reset", "User", row.userId);
  return { ok: true };
}

export async function signOut() {
  await destroySession();
  redirect("/");
}
