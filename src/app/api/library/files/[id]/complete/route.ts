import { NextResponse } from "next/server";
import { handle } from "@/lib/api";
import { audit } from "@/lib/audit";
import { HttpError, requireAdmin } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { EXT, LIBRARY_MAX_BYTES, sniffLibraryFile } from "@/lib/library/files";
import { libraryFileUrl } from "@/lib/library/types";
import { storage } from "@/lib/storage";

// Verifies an upload by its bytes and size, then marks it ready to be used in content.
export const POST = handle(async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const { user } = await requireAdmin();
  const { id } = await ctx.params;
  const file = await db.libraryFile.findUnique({ where: { id } });
  if (!file) throw new HttpError(404, "Unknown upload");
  if (file.ready) return NextResponse.json({ id: file.id, url: libraryFileUrl(file.id), mime: file.mimeType, name: file.originalName });
  const store = storage();
  let size: number;
  let head: Uint8Array;
  if (store.head) {
    const info = await store.head(file.storageKey, 64);
    if (!info) throw new HttpError(400, "The upload didn't finish. Try again.");
    size = info.size;
    head = info.head;
  } else {
    try {
      size = await store.size(file.storageKey);
    } catch {
      throw new HttpError(400, "The upload didn't finish. Try again.");
    }
    head = (await store.get(file.storageKey)).subarray(0, 64);
  }
  const kind = sniffLibraryFile(head, file.originalName);
  if (!kind || size > LIBRARY_MAX_BYTES) {
    await store.remove(file.storageKey);
    await db.libraryFile.delete({ where: { id } });
    throw new HttpError(415, size > LIBRARY_MAX_BYTES ? "File too large" : "Use MP4/WebM video, MP3/M4A/WAV/OGG audio, PDF or DOCX documents, or PNG/JPG/GIF/WebP images.");
  }
  const name = file.originalName.replace(/\.[^.]*$/, "") + "." + (EXT[kind.mime] ?? "bin");
  await db.libraryFile.update({ where: { id }, data: { ready: true, mimeType: kind.mime, sizeBytes: size, originalName: name } });
  await audit(user.schoolId, user.id, "library.upload", "LibraryFile", id, { mime: kind.mime, bytes: size });
  return NextResponse.json({ id, url: libraryFileUrl(id), mime: kind.mime, name, group: kind.group });
});
