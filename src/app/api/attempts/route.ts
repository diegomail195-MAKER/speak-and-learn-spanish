import { NextResponse } from "next/server";
import { z } from "zod";
import { handle } from "@/lib/api";
import { HttpError, requireStudent } from "@/lib/auth/guards";
import { practiceTarget } from "@/lib/videos";
import { db } from "@/lib/db";

// Starts (or continues) the student's attempt at an assignment.
export const POST = handle(async (req: Request) => {
  const { student } = await requireStudent();
  const { assignmentId, videoId } = z.object({ assignmentId: z.string(), videoId: z.string().nullish() }).parse(await req.json());
  // For a video assignment the game is the video's practice activity.
  const { assignment: a, gameId } = await practiceTarget(student, assignmentId, videoId);
  const open = await db.studentAttempt.findFirst({ where: { studentId: student.id, assignmentId: a.id, gameId, completedAt: null }, orderBy: { startedAt: "desc" } });
  if (open) return NextResponse.json({ attemptId: open.id, resumed: true });
  const done = await db.studentAttempt.count({ where: { studentId: student.id, assignmentId: a.id, gameId, completedAt: { not: null } } });
  if (a.maxAttempts && done >= a.maxAttempts) throw new HttpError(409, "No attempts left");
  if (a.dueAt && a.dueAt < new Date()) throw new HttpError(409, "Past due date");
  const attempt = await db.studentAttempt.create({ data: { studentId: student.id, gameId, assignmentId: a.id } });
  return NextResponse.json({ attemptId: attempt.id, resumed: false });
});
