import { handle } from "@/lib/api";
import { HttpError, requireUser } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { storage } from "@/lib/storage";

// Streams a private media file to signed-in users of the same school.
export const GET = handle(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const user = await requireUser();
  const { id } = await ctx.params;
  const asset = await db.mediaAsset.findFirst({ where: { id, schoolId: user.schoolId } });
  if (!asset) throw new HttpError(404, "Not found");
  const data = await storage().get(asset.storageKey);
  const headers: Record<string, string> = {
    "Content-Type": asset.mimeType,
    "Cache-Control": "private, max-age=86400, immutable",
    "X-Content-Type-Options": "nosniff",
    "Accept-Ranges": "bytes",
    "Content-Disposition": "inline",
  };
  const range = req.headers.get("range")?.match(/bytes=(\d*)-(\d*)/);
  if (range) {
    const start = range[1] ? Number(range[1]) : 0;
    const end = range[2] ? Math.min(Number(range[2]), data.length - 1) : data.length - 1;
    if (start > end || start >= data.length) return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${data.length}` } });
    return new Response(new Uint8Array(data.subarray(start, end + 1)), {
      status: 206,
      headers: { ...headers, "Content-Range": `bytes ${start}-${end}/${data.length}`, "Content-Length": String(end - start + 1) },
    });
  }
  return new Response(new Uint8Array(data), { headers: { ...headers, "Content-Length": String(data.length) } });
});
