import "server-only";
import { redirect } from "next/navigation";
import { getSessionUser } from "./session";

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

/** For pages: redirects to the right login when the role does not match. */
export async function requireTeacherPage() {
  const user = await getSessionUser();
  if (!user || !user.teacher || (user.role !== "TEACHER" && user.role !== "ADMIN")) redirect("/login");
  return { user, teacher: user.teacher };
}

export async function requireStudentPage() {
  const user = await getSessionUser();
  if (!user || user.role !== "STUDENT" || !user.student) redirect("/student");
  return { user, student: user.student };
}

/** For API routes / server actions: throws HttpError instead of redirecting. */
export async function requireTeacher() {
  const user = await getSessionUser();
  if (!user || !user.teacher || (user.role !== "TEACHER" && user.role !== "ADMIN")) throw new HttpError(401, "Teacher sign-in required");
  return { user, teacher: user.teacher };
}

export async function requireStudent() {
  const user = await getSessionUser();
  if (!user || user.role !== "STUDENT" || !user.student) throw new HttpError(401, "Student sign-in required");
  return { user, student: user.student };
}

export async function requireUser() {
  const user = await getSessionUser();
  if (!user) throw new HttpError(401, "Sign-in required");
  return user;
}
