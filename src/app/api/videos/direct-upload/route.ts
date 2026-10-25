import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { handle } from "@/lib/api";
import { audit } from "@/lib/audit";
import { HttpError, requireTeacher } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { mediaUrl } from "@/lib/media/save";
import { VIDEO_MAX_BYTES, sniffVideo } from "@/lib/media/validate";
import { storage } from "@/lib/storage";

// Large videos with remote storage: the browser uploads straight to a one-time signed URL
// (serverless functions can't receive hundreds of MB), then the server checks the file.
//   POST { name, size }            → { mode: "direct", uploadUrl, key } | { mode: "server" }
//   POST { key, name } (complete)  → MediaAsset
const start = z.object({ name: z.string().max(200), size: z.number().int().positive() });
const done = z.object({ key: z.string().max(300), name: z.string().max(200) });

export const POST = handle(async (req: Request) => {
  const { user } = await requireTeacher();
  const store = storage();
  const body = await req.json();

  if (!("key" in body)) {
    const { size } = start.parse(body);
    if (!store.signedUploadUrl) return NextResponse.json({ mode: "server" });
    if (size > VIDEO_MAX_BYTES) throw new HttpError(413, `Videos must be ${Math.round(VIDEO_MAX_BYTES / 1048576)} MB or smaller`);
    const key = `${user.schoolId}/video/${randomUUID()}`;
    return NextResponse.json({ mode: "direct", key, uploadUrl: await store.signedUploadUrl(key) });
  }

  const { key, name } = done.parse(body);
  // Only keys issued to this school's upload area are accepted.
  if (!new RegExp(`^${user.schoolId}/video/[0-9a-f-]{36}$`).test(key) || !store.head) throw new HttpError(400, "Unknown upload");
  const info = await store.head(key, 64);
  if (!info) throw new HttpError(400, "The upload didn't finish. Try again.");
  const mime = sniffVideo(info.head);
  if (!mime || info.size > VIDEO_MAX_BYTES) {
    await store.remove(key);
    throw new HttpError(415, info.size > VIDEO_MAX_BYTES ? "Video too large" : "Only MP4 or WebM videos are allowed");
  }
  if (await db.mediaAsset.findFirst({ where: { storageKey: key } })) throw new HttpError(409, "Already saved");
  const asset = await db.mediaAsset.create({
    data: { schoolId: user.schoolId, ownerUserId: user.id, kind: "VIDEO", storageKey: key, mimeType: mime, sizeBytes: info.size, originalName: name, sha256: "" }, // not hashed: hashing would mean downloading the whole video,
  });
  await audit(user.schoolId, user.id, "media.upload_video", "MediaAsset", asset.id, { bytes: info.size, direct: true });
  return NextResponse.json({ id: asset.id, url: mediaUrl(asset.id), name });
});
