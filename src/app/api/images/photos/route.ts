import { NextResponse } from "next/server";
import { z } from "zod";
import { handle } from "@/lib/api";
import { HttpError, requireTeacher } from "@/lib/auth/guards";
import { searchCommons } from "@/lib/images/commons";
import { googleMissing, googleProvider, searchGoogle } from "@/lib/images/google";
import { rateLimit } from "@/lib/rate-limit";

// GET /api/images/photos?q=turkey animal → up to six photos for the flashcard photo form (teachers
// only): Google Images when a provider is configured, otherwise Wikimedia Commons plus `missing`,
// which says exactly what to configure to turn Google Images on.
export const GET = handle(async (req: Request) => {
  const { user } = await requireTeacher();
  const q = z.string().trim().min(1).max(100).parse(new URL(req.url).searchParams.get("q") ?? "");
  if (!(await rateLimit(`photo-suggest:${user.id}`, 120, 10 * 60_000))) throw new HttpError(429, "Demasiadas búsquedas. Espera unos minutos.");
  if (googleProvider()) return NextResponse.json({ provider: "google", results: await searchGoogle(q, 6) });
  return NextResponse.json({ provider: "commons", missing: googleMissing(), results: await searchCommons(q, 6) });
});
