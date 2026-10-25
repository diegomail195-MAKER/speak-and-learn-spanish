import { NextResponse } from "next/server";
import { handle } from "@/lib/api";
import { audit } from "@/lib/audit";
import { HttpError, requireTeacher } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { videoData, videoInput } from "@/lib/videos";

type Ctx = { params: Promise<{ id: string }> };

export const PUT = handle(async (req: Request, ctx: Ctx) => {
  const { user } = await requireTeacher();
  const { id } = await ctx.params;
  const existing = await db.video.findFirst({ where: { id, schoolId: user.schoolId } });
  if (!existing) throw new HttpError(404, "Video not found");
  const data = await videoData(user.schoolId, videoInput.parse(await req.json()));
  await db.video.update({ where: { id }, data });
  await audit(user.schoolId, user.id, "video.update", "Video", id, { status: data.status });
  return NextResponse.json({ ok: true });
});
