import { handle } from "@/lib/api";
import { HttpError, requireUser } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { canReadLibraryFile } from "@/lib/library/service";
import { storage } from "@/lib/storage";

// Serves a library file after the access check (admin; teachers for published content;
// students only for files in a task assigned to them). Byte ranges for audio/video seeking.
export const GET = handle(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const user = await requireUser();
  const { id } = await ctx.params;
  const file = await db.libraryFile.findUnique({ where: { id } });
  if (!file || !file.ready || !(await canReadLibraryFile(user, id))) throw new HttpError(404, "Not found");
  const store = storage();
  if (store.signedUrl) {
    const url = await store.signedUrl(file.storageKey, 3600);
    return new Response(null, { status: 302, headers: { Location: url, "Cache-Control": "private, max-age=3000" } });
  }
  const size = file.sizeBytes;
  const headers: Record<string, string> = {
    "Content-Type": file.mimeType,
    "Cache-Control": "private, max-age=86400, immutable",
    "X-Content-Type-Options": "nosniff",
    "Accept-Ranges": "bytes",
    "Content-Disposition": `${file.mimeType.startsWith("application/vnd.") ? "attachment" : "inline"}; filename="${file.originalName.replace(/[^\w.-]/g, "_")}"`,
  };
  const range = req.headers.get("range")?.match(/bytes=(\d*)-(\d*)/);
  if (range && (range[1] || range[2])) {
    const start = range[1] ? Number(range[1]) : Math.max(0, size - Number(range[2]));
    const end = range[1] && range[2] ? Math.min(Number(range[2]), size - 1) : size - 1;
    if (start > end || start >= size) return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
    return new Response(store.stream(file.storageKey, start, end), { status: 206, headers: { ...headers, "Content-Range": `bytes ${start}-${end}/${size}`, "Content-Length": String(end - start + 1) } });
  }
  return new Response(store.stream(file.storageKey, 0, Math.max(0, size - 1)), { headers: { ...headers, "Content-Length": String(size) } });
});
