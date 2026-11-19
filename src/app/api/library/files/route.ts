import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { handle } from "@/lib/api";
import { HttpError, requireAdmin } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { LIBRARY_MAX_BYTES } from "@/lib/library/files";
import { storage } from "@/lib/storage";

// Starts a library upload (administrators only).
//   POST { name, size } → { id, uploadUrl, direct }
// With remote storage the browser PUTs straight to a one-time signed URL (big videos never pass
// through the server); with local storage it PUTs to /api/library/files/[id]/content.
// Then POST /api/library/files/[id]/complete checks the bytes and marks the file ready.
const start = z.object({ name: z.string().trim().min(1).max(200), size: z.number().int().positive() });

export const POST = handle(async (req: Request) => {
  const { user } = await requireAdmin();
  const { name, size } = start.parse(await req.json());
  if (size > LIBRARY_MAX_BYTES) throw new HttpError(413, `Files must be ${Math.round(LIBRARY_MAX_BYTES / 1048576)} MB or smaller.`);
  const store = storage();
  const key = `library/${randomUUID()}`;
  const file = await db.libraryFile.create({ data: { storageKey: key, mimeType: "application/octet-stream", sizeBytes: 0, originalName: name, uploadedById: user.id } });
  if (store.signedUploadUrl) return NextResponse.json({ id: file.id, uploadUrl: await store.signedUploadUrl(key), direct: true });
  return NextResponse.json({ id: file.id, uploadUrl: `/api/library/files/${file.id}/content`, direct: false });
});
