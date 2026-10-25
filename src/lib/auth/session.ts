import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { cache } from "react";
import { db } from "@/lib/db";

const COOKIE = "sls_session";
const TEACHER_TTL_MS = 1000 * 60 * 60 * 24 * 14;
const STUDENT_TTL_MS = 1000 * 60 * 60 * 10; // a school day

const hashToken = (t: string) => createHash("sha256").update(t).digest("hex");

export async function createSession(userId: string, role: "ADMIN" | "TEACHER" | "STUDENT", userAgent?: string | null) {
  const token = randomBytes(32).toString("base64url");
  const ttl = role === "STUDENT" ? STUDENT_TTL_MS : TEACHER_TTL_MS;
  const expiresAt = new Date(Date.now() + ttl);
  await db.session.create({ data: { id: hashToken(token), userId, expiresAt, userAgent: userAgent?.slice(0, 200) } });
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) await db.session.deleteMany({ where: { id: hashToken(token) } });
  jar.delete(COOKIE);
}

export type SessionUser = NonNullable<Awaited<ReturnType<typeof getSessionUser>>>;

export const getSessionUser = cache(async () => {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  const session = await db.session.findUnique({
    where: { id: hashToken(token) },
    include: { user: { include: { teacher: true, student: true } } },
  });
  if (!session || session.expiresAt < new Date()) return null;
  if (session.user.student && !session.user.student.active) return null;
  return session.user;
});
