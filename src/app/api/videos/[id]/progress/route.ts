import { NextResponse } from "next/server";
import { z } from "zod";
import { handle } from "@/lib/api";
import { HttpError, requireStudent } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { completedFrom, studentCanWatch } from "@/lib/videos";

const schema = z.object({
  positionSec: z.number().min(0).max(60 * 60 * 6),
  durationSec: z.number().min(0).max(60 * 60 * 6).nullable(),
  watchedDeltaSec: z.number().min(0).max(120), // playback time since the last report
});

// Saves where the student is in the video and how much they actually watched.
export const POST = handle(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const { student } = await requireStudent();
  const { id } = await ctx.params;
  if (!(await studentCanWatch(student, id))) throw new HttpError(404, "Video not found");
  const body = schema.parse(JSON.parse(await req.text())); // sendBeacon posts text/plain
  // Increment atomically: the pause, end and page-hide reports can arrive at the same time.
  let row = await db.videoProgress.upsert({
    where: { studentId_videoId: { studentId: student.id, videoId: id } },
    create: { studentId: student.id, videoId: id, positionSec: body.positionSec, watchedSec: body.watchedDeltaSec, durationSec: body.durationSec },
    update: { positionSec: body.positionSec, watchedSec: { increment: body.watchedDeltaSec }, ...(body.durationSec ? { durationSec: body.durationSec } : {}) },
  });
  const duration = row.durationSec;
  const watched = duration ? Math.min(row.watchedSec, duration) : row.watchedSec;
  const completed = row.completed || completedFrom(watched, duration);
  if (watched !== row.watchedSec || completed !== row.completed) {
    row = await db.videoProgress.update({ where: { studentId_videoId: { studentId: student.id, videoId: id } }, data: { watchedSec: watched, completed } });
  }
  return NextResponse.json({ completed: row.completed, watchedSec: row.watchedSec });
});
