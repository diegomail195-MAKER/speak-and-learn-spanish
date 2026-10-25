"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { hashSecret, verifySecret } from "@/lib/auth/password";
import { createSession, destroySession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { DEFAULT_CATEGORIES } from "@/lib/games/templates";
import { rateLimit } from "@/lib/rate-limit";

export type FormState = { error?: string } | undefined;

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
  const ip = (await headers()).get("x-forwarded-for") ?? "local";
  if (!rateLimit(`login:${ip}:${parsed.data.email}`, 8, 10 * 60_000)) return { error: "Demasiados intentos. Espera unos minutos." };
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
  const student = await db.student.findFirst({ where: { id: studentId, active: true, classroom: { code } } });
  if (!student) return { error: "No encontramos esa cuenta." };
  if (student.lockedUntil && student.lockedUntil > new Date()) {
    return { error: "Demasiados intentos. Pide ayuda a tu maestra o maestro." };
  }
  if (!(await verifySecret(pin, student.pinHash))) {
    const failed = student.failedLogins + 1;
    await db.student.update({
      where: { id: student.id },
      data: { failedLogins: failed, lockedUntil: failed >= 5 ? new Date(Date.now() + 5 * 60_000) : null },
    });
    return { error: "Ese PIN no es correcto. Inténtalo otra vez." };
  }
  await db.student.update({ where: { id: student.id }, data: { failedLogins: 0, lockedUntil: null } });
  await createSession(student.userId, "STUDENT", (await headers()).get("user-agent"));
  redirect("/learn");
}

export async function signOut() {
  await destroySession();
  redirect("/");
}
