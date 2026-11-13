import { NextResponse } from "next/server";
import { handle } from "@/lib/api";
import { HttpError, requireAdmin } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { LIBRARY_MAX_BYTES } from "@/lib/library/files";
import { bodyToTempFile, storage } from "@/lib/storage";

// Local storage only: receives the file body (streamed to disk with a size limit).
export const PUT = handle(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  await requireAdmin();
  const { id } = await ctx.params;
  const store = storage();
  if (store.signedUploadUrl) throw new HttpError(400, "Upload to the signed URL instead.");
  const file = await db.libraryFile.findUnique({ where: { id } });
  if (!file || file.ready) throw new HttpError(404, "Unknown upload");
  if (!req.body) throw new HttpError(400, "Empty file");
  let tmp: { tmp: string; size: number };
  try {
    tmp = await bodyToTempFile(req.body, LIBRARY_MAX_BYTES);
  } catch (e) {
    if ((e as Error).message === "too_large") throw new HttpError(413, "File too large");
    throw e;
  }
  await store.putFile(file.storageKey, tmp.tmp);
  return NextResponse.json({ ok: true });
});
