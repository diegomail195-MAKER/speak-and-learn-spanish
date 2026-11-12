import { NextResponse } from "next/server";
import { z } from "zod";
import { handle } from "@/lib/api";
import { audit } from "@/lib/audit";
import { HttpError, requireTeacher } from "@/lib/auth/guards";
import { fetchSafeImage } from "@/lib/images/search";
import { mediaUrl, saveMedia } from "@/lib/media/save";
import { rateLimit } from "@/lib/rate-limit";

// POST { id } → copies a checked internet image into the school's private media library.
export const POST = handle(async (req: Request) => {
  const { user } = await requireTeacher();
  const { id } = z.object({ id: z.string().max(20) }).parse(await req.json());
  if (!(await rateLimit(`image-import:${user.id}`, 60, 10 * 60_000))) throw new HttpError(429, "Demasiadas imágenes seguidas. Espera unos minutos.");
  const img = await fetchSafeImage(id);
  const asset = await saveMedia({ schoolId: user.schoolId, ownerUserId: user.id, kind: "IMAGE", data: img.data, mimeType: img.mime, originalName: img.name });
  await audit(user.schoolId, user.id, "media.import_web_image", "MediaAsset", asset.id, { provider: "pixabay", sourceId: id });
  return NextResponse.json({ id: asset.id, url: mediaUrl(asset.id), name: asset.originalName });
});
