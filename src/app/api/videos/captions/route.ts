import { NextResponse } from "next/server";
import { handle } from "@/lib/api";
import { HttpError, requireTeacher } from "@/lib/auth/guards";
import { mediaUrl, saveMedia } from "@/lib/media/save";
import { isWebVtt } from "@/lib/media/validate";

// WebVTT subtitle upload, validated as text and stored as private media.
export const POST = handle(async (req: Request) => {
  const { user } = await requireTeacher();
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) throw new HttpError(400, "No file");
  if (file.size > 512 * 1024) throw new HttpError(413, "Subtitle files must be 512 KB or smaller");
  const text = await file.text();
  if (!isWebVtt(text)) throw new HttpError(415, "Subtitles must be a WebVTT (.vtt) file");
  const asset = await saveMedia({ schoolId: user.schoolId, ownerUserId: user.id, kind: "VIDEO", data: Buffer.from(text, "utf8"), mimeType: "text/vtt", originalName: file.name });
  return NextResponse.json({ id: asset.id, url: mediaUrl(asset.id), name: asset.originalName });
});
