import { NextResponse } from "next/server";
import { handle } from "@/lib/api";
import { audit } from "@/lib/audit";
import { requireTeacher } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { videoData, videoInput } from "@/lib/videos";

export const POST = handle(async (req: Request) => {
  const { user, teacher } = await requireTeacher();
  const data = await videoData(user.schoolId, videoInput.parse(await req.json()));
  const v = await db.video.create({ data: { ...data, schoolId: user.schoolId, teacherId: teacher.id } });
  await audit(user.schoolId, user.id, "video.create", "Video", v.id, { source: v.source });
  return NextResponse.json({ id: v.id });
});
