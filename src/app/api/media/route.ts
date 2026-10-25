import { NextResponse } from "next/server";
import { handle } from "@/lib/api";
import { HttpError, requireTeacher } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { mediaUrl, saveMedia } from "@/lib/media/save";
import { IMAGE_MAX_BYTES, sniffImage } from "@/lib/media/validate";

export const POST = handle(async (req: Request) => {
  const { user } = await requireTeacher();
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) throw new HttpError(400, "No file");
  if (file.size > IMAGE_MAX_BYTES) throw new HttpError(413, "Images must be 4 MB or smaller");
  const data = Buffer.from(await file.arrayBuffer());
  const mime = sniffImage(data);
  if (!mime) throw new HttpError(415, "Only PNG, JPEG, GIF or WebP images are allowed");
  const asset = await saveMedia({ schoolId: user.schoolId, ownerUserId: user.id, kind: "IMAGE", data, mimeType: mime, originalName: file.name });
  return NextResponse.json({ id: asset.id, url: mediaUrl(asset.id), name: asset.originalName });
});

// Reusable media library: list this school's images.
export const GET = handle(async () => {
  const { user } = await requireTeacher();
  const assets = await db.mediaAsset.findMany({ where: { schoolId: user.schoolId, kind: "IMAGE" }, orderBy: { createdAt: "desc" }, take: 200 });
  return NextResponse.json({ assets: assets.map((a) => ({ id: a.id, url: mediaUrl(a.id), name: a.originalName })) });
});
