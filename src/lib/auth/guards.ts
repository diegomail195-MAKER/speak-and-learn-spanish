import "server-only";
import { redirect } from "next/navigation";
import { isPlatformAdmin } from "./admin";
import { getSessionUser } from "./session";

import { HttpError } from "@/lib/http-error";

export { HttpError };

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

/** Videos can only be uploaded, edited or deleted by the platform administrator. */
export async function requireVideoAdmin() {
  const res = await requireTeacher();
  if (!isPlatformAdmin(res.user)) throw new HttpError(403, "Solo el administrador puede subir o editar videos.");
  return res;
}

export async function requireVideoAdminPage() {
  const res = await requireTeacherPage();
  if (!isPlatformAdmin(res.user)) redirect("/teacher/videos?admin=only");
  return res;
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

/**
 * LextroSpeak administrators: accounts with the ADMIN role, given by a server process
 * (src/lib/auth/admin-role.ts) only after the email is verified. Guards every admin page,
 * server action and API route; teachers and students get 403 / a redirect.
 */
export async function requireAdmin() {
  const res = await requireTeacher();
  if (res.user.role !== "ADMIN") throw new HttpError(403, "Administrators only");
  return res;
}

export async function requireAdminPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN" || !user.teacher) redirect(user.role === "STUDENT" ? "/learn" : "/teacher?admin=only");
  return { user, teacher: user.teacher };
}
