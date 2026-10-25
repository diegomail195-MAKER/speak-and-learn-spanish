import { NextResponse } from "next/server";
import { z } from "zod";
import { assignmentForStudent } from "@/lib/access";
import { handle } from "@/lib/api";
import { HttpError, requireStudent } from "@/lib/auth/guards";
import { db } from "@/lib/db";

// Starts (or continues) the student's attempt at an assignment.
export const POST = handle(async (req: Request) => {
  const { student } = await requireStudent();
  const { assignmentId } = z.object({ assignmentId: z.string() }).parse(await req.json());
  const a = await assignmentForStudent(student, assignmentId);
  if (!a.gameId) throw new HttpError(400, "Not a game assignment");
  const open = await db.studentAttempt.findFirst({ where: { studentId: student.id, assignmentId: a.id, completedAt: null }, orderBy: { startedAt: "desc" } });
  if (open) return NextResponse.json({ attemptId: open.id, resumed: true });
  const done = await db.studentAttempt.count({ where: { studentId: student.id, assignmentId: a.id, completedAt: { not: null } } });
  if (a.maxAttempts && done >= a.maxAttempts) throw new HttpError(409, "No attempts left");
  if (a.dueAt && a.dueAt < new Date()) throw new HttpError(409, "Past due date");
  const attempt = await db.studentAttempt.create({ data: { studentId: student.id, gameId: a.gameId, assignmentId: a.id } });
  return NextResponse.json({ attemptId: attempt.id, resumed: false });
});
