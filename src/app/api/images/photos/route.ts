import { NextResponse } from "next/server";
import { z } from "zod";
import { handle } from "@/lib/api";
import { HttpError, requireTeacher } from "@/lib/auth/guards";
import { searchCommons, searchCommonsDetailed } from "@/lib/images/commons";
import { googleProvider, searchGoogle } from "@/lib/images/google";
import { rateLimit } from "@/lib/rate-limit";

// GET /api/images/photos?q=turkey animal → up to six photos for the flashcard photo form (teachers
// only). Wikimedia Commons' public API by default (no keys); Google Images only if a provider key
// was configured on the server.
const PROBES = ["capybara", "turkey animal", "gato", "cat"];

export const GET = handle(async (req: Request) => {
  const sp = new URL(req.url).searchParams;
  // Preview-only health check with fixed words (no user data), to confirm Commons answers from Vercel.
  const probe = sp.get("probe");
  if (probe !== null && process.env.VERCEL_ENV !== "production") {
    if (!PROBES.includes(probe)) throw new HttpError(400, "Unknown probe");
    if (!(await rateLimit("photo-probe", 30, 10 * 60_000))) throw new HttpError(429, "Too many probes");
    try {
      const { photos, stats } = await searchCommonsDetailed(probe, 6);
      return NextResponse.json({ ok: true, stats, photos: photos.map((p) => ({ title: p.title, thumb: p.thumb })) });
    } catch (e) {
      return NextResponse.json({ ok: false, error: (e as Error).message });
    }
  }
  const { user } = await requireTeacher();
  const q = z.string().trim().min(1).max(100).parse(sp.get("q") ?? "");
  if (!(await rateLimit(`photo-suggest:${user.id}`, 120, 10 * 60_000))) throw new HttpError(429, "Demasiadas búsquedas. Espera unos minutos.");
  if (googleProvider()) return NextResponse.json({ provider: "google", results: await searchGoogle(q, 6) });
  return NextResponse.json({ provider: "commons", results: await searchCommons(q, 6) });
});
