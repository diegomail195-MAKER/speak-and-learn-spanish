import "server-only";
import { notFound } from "next/navigation";
import { requireTeacherPage } from "@/lib/auth/guards";
import { classroomAccessWhere } from "@/lib/access";
import { db } from "@/lib/db";

/** A class the teacher owns or co-teaches (404 for anyone else's). */
export async function teacherClass(id: string) {
  const { teacher } = await requireTeacherPage();
  const c = await db.classroom.findFirst({ where: { id, ...classroomAccessWhere(teacher.id) } });
  if (!c) notFound();
  return { classroom: c, teacher };
}
