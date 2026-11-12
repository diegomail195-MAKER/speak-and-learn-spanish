import { NextResponse } from "next/server";
import { z } from "zod";
import { handle } from "@/lib/api";
import { HttpError, requireTeacher } from "@/lib/auth/guards";
import { imageSearchEnabled, searchImages } from "@/lib/images/search";
import { rateLimit } from "@/lib/rate-limit";

// GET /api/images/search?q=manzana&kind=photo → child-safe image results (teachers only).
export const GET = handle(async (req: Request) => {
  const { user } = await requireTeacher();
  const sp = new URL(req.url).searchParams;
  if (sp.get("status") === "1") return NextResponse.json({ enabled: imageSearchEnabled() });
  const q = z.string().trim().min(1).max(100).parse(sp.get("q") ?? "");
  const kind = z.enum(["photo", "illustration", "all"]).catch("all").parse(sp.get("kind"));
  if (!(await rateLimit(`image-search:${user.id}`, 60, 10 * 60_000))) throw new HttpError(429, "Demasiadas búsquedas. Espera unos minutos.");
  return NextResponse.json({ results: await searchImages(q, kind) });
});
