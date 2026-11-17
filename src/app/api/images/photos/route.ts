import { NextResponse } from "next/server";
import { z } from "zod";
import { handle } from "@/lib/api";
import { HttpError, requireTeacher } from "@/lib/auth/guards";
import { searchCommons } from "@/lib/images/commons";
import { rateLimit } from "@/lib/rate-limit";

// GET /api/images/photos?q=turkey animal → up to six Wikimedia Commons photographs (teachers only),
// for the flashcard editor's automatic suggestions.
export const GET = handle(async (req: Request) => {
  const { user } = await requireTeacher();
  const q = z.string().trim().min(1).max(100).parse(new URL(req.url).searchParams.get("q") ?? "");
  if (!(await rateLimit(`photo-suggest:${user.id}`, 120, 10 * 60_000))) throw new HttpError(429, "Demasiadas búsquedas. Espera unos minutos.");
  return NextResponse.json({ results: await searchCommons(q, 6) });
});
