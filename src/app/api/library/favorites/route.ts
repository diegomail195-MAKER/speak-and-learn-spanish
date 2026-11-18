import { NextResponse } from "next/server";
import { z } from "zod";
import { handle } from "@/lib/api";
import { HttpError, requireTeacher } from "@/lib/auth/guards";
import { db } from "@/lib/db";

// POST { topicId, favorite } → marks or unmarks a published Library topic as one of the
// teacher's favorites ("My favorites").
const body = z.object({ topicId: z.string().min(1).max(60), favorite: z.boolean() });

export const POST = handle(async (req: Request) => {
  const { teacher } = await requireTeacher();
  const { topicId, favorite } = body.parse(await req.json());
  const topic = await db.topic.findFirst({ where: { id: topicId, status: "PUBLISHED" }, select: { id: true } });
  if (!topic) throw new HttpError(404, "Topic not found");
  const key = { teacherId_topicId: { teacherId: teacher.id, topicId } };
  if (favorite) await db.topicFavorite.upsert({ where: key, create: { teacherId: teacher.id, topicId }, update: {} });
  else await db.topicFavorite.deleteMany({ where: { teacherId: teacher.id, topicId } });
  return NextResponse.json({ favorite });
});
