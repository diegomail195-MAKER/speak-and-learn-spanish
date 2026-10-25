import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { unlink } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { handle } from "@/lib/api";
import { audit } from "@/lib/audit";
import { HttpError, requireTeacher } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { mediaUrl } from "@/lib/media/save";
import { VIDEO_MAX_BYTES, extFor, sniffVideo } from "@/lib/media/validate";
import { bodyToTempFile, storage } from "@/lib/storage";

export const maxDuration = 300;

async function sha256File(p: string) {
  const h = createHash("sha256");
  for await (const chunk of createReadStream(p)) h.update(chunk as Buffer);
  return h.digest("hex");
}

// Raw-body upload (not multipart) so large videos stream to disk instead of memory.
export const POST = handle(async (req: Request) => {
  const { user } = await requireTeacher();
  if (!req.body) throw new HttpError(400, "No file");
  const declared = Number(req.headers.get("content-length") ?? 0);
  if (declared > VIDEO_MAX_BYTES) throw new HttpError(413, `Videos must be ${Math.round(VIDEO_MAX_BYTES / 1048576)} MB or smaller`);
  const name = decodeURIComponent(req.headers.get("x-file-name") ?? "video").slice(0, 200);

  let file: Awaited<ReturnType<typeof bodyToTempFile>>;
  try {
    file = await bodyToTempFile(req.body, VIDEO_MAX_BYTES);
  } catch (e) {
    if ((e as Error).message === "too_large") throw new HttpError(413, `Videos must be ${Math.round(VIDEO_MAX_BYTES / 1048576)} MB or smaller`);
    throw e;
  }
  const mime = sniffVideo(file.head);
  if (!mime) {
    await unlink(file.tmp).catch(() => undefined);
    throw new HttpError(415, "Only MP4 or WebM videos are allowed");
  }
  const sha256 = await sha256File(file.tmp);
  const existing = await db.mediaAsset.findFirst({ where: { schoolId: user.schoolId, sha256, kind: "VIDEO" } });
  if (existing) {
    await unlink(file.tmp).catch(() => undefined);
    return NextResponse.json({ id: existing.id, url: mediaUrl(existing.id), name: existing.originalName, reused: true });
  }
  const key = `${user.schoolId}/video/${randomUUID()}.${extFor[mime]}`;
  await storage().putFile(key, file.tmp);
  const asset = await db.mediaAsset.create({
    data: { schoolId: user.schoolId, ownerUserId: user.id, kind: "VIDEO", storageKey: key, mimeType: mime, sizeBytes: file.size, originalName: name, sha256 },
  });
  await audit(user.schoolId, user.id, "media.upload_video", "MediaAsset", asset.id, { bytes: file.size });
  return NextResponse.json({ id: asset.id, url: mediaUrl(asset.id), name });
});
