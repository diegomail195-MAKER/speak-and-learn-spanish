import { handle } from "@/lib/api";
import { HttpError, requireUser } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { storage } from "@/lib/storage";

// Streams a private media file to signed-in users of the same school, with byte ranges so
// videos and audio can seek without downloading the whole file.
export const GET = handle(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const user = await requireUser();
  const { id } = await ctx.params;
  const asset = await db.mediaAsset.findFirst({ where: { id, schoolId: user.schoolId } });
  if (!asset) throw new HttpError(404, "Not found");
  const size = asset.sizeBytes;
  const headers: Record<string, string> = {
    "Content-Type": asset.mimeType === "text/vtt" ? "text/vtt; charset=utf-8" : asset.mimeType,
    "Cache-Control": "private, max-age=86400, immutable",
    "X-Content-Type-Options": "nosniff",
    "Accept-Ranges": "bytes",
    "Content-Disposition": "inline",
  };
  const range = req.headers.get("range")?.match(/bytes=(\d*)-(\d*)/);
  if (range && (range[1] || range[2])) {
    let start: number;
    let end: number;
    if (!range[1]) {
      // suffix range: last N bytes
      start = Math.max(0, size - Number(range[2]));
      end = size - 1;
    } else {
      start = Number(range[1]);
      end = range[2] ? Math.min(Number(range[2]), size - 1) : size - 1;
    }
    if (start > end || start >= size) return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
    return new Response(storage().stream(asset.storageKey, start, end), {
      status: 206,
      headers: { ...headers, "Content-Range": `bytes ${start}-${end}/${size}`, "Content-Length": String(end - start + 1) },
    });
  }
  return new Response(storage().stream(asset.storageKey, 0, Math.max(0, size - 1)), { headers: { ...headers, "Content-Length": String(size) } });
});
