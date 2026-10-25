import { NextResponse } from "next/server";
import { z } from "zod";
import { handle } from "@/lib/api";
import { requireTeacher } from "@/lib/auth/guards";
import { db } from "@/lib/db";

export const POST = handle(async (req: Request) => {
  const { user } = await requireTeacher();
  const { word } = z.object({ word: z.string().trim().min(1).max(60) }).parse(await req.json());
  await db.keepWord.upsert({
    where: { schoolId_word: { schoolId: user.schoolId, word: word.toLowerCase() } },
    create: { schoolId: user.schoolId, word: word.toLowerCase() },
    update: {},
  });
  return NextResponse.json({ ok: true });
});
