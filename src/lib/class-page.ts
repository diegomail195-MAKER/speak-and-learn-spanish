import "server-only";
import { notFound } from "next/navigation";
import { requireTeacherPage } from "@/lib/auth/guards";
import { db } from "@/lib/db";

/** The teacher's own class (404 for anyone else's). */
export async function teacherClass(id: string) {
  const { teacher } = await requireTeacherPage();
  const c = await db.classroom.findFirst({ where: { id, teacherId: teacher.id } });
  if (!c) notFound();
  return { classroom: c, teacher };
}
