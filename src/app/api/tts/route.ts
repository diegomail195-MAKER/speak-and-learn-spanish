import { NextResponse } from "next/server";
import { z } from "zod";
import { handle } from "@/lib/api";
import { HttpError, requireTeacher } from "@/lib/auth/guards";
import { mediaUrl } from "@/lib/media/save";
import { rateLimit } from "@/lib/rate-limit";
import { ttsProvider, voicesFor } from "@/lib/tts";
import { ensureAudio } from "@/lib/tts/generate";
import { LANGUAGES } from "@/lib/tts/voices";

export const GET = handle(async () => {
  await requireTeacher();
  const provider = ttsProvider();
  return NextResponse.json({ provider, languages: LANGUAGES, voices: voicesFor(provider) });
});

const schema = z.object({
  text: z.string().trim().min(1).max(600),
  language: z.enum(["es-419", "en-US", "fr-FR"]),
  voice: z.string().optional(),
  rate: z.number().min(0.5).max(1.5).default(0.95),
  style: z.string().max(30).nullish(),
  regenerate: z.boolean().optional(),
});

// Generates (or reuses from cache) spoken audio for a piece of text.
export const POST = handle(async (req: Request) => {
  const { user } = await requireTeacher();
  const body = schema.parse(await req.json());
  if (!ttsProvider()) return NextResponse.json({ error: "tts_not_configured" }, { status: 503 });
  if (!rateLimit(`tts:${user.schoolId}`, 400, 60 * 60_000)) throw new HttpError(429, "Audio generation limit reached, try again later");
  try {
    const r = await ensureAudio({ schoolId: user.schoolId, userId: user.id, text: body.text, language: body.language, voiceId: body.voice, rate: body.rate, style: body.style, regenerate: body.regenerate });
    if (!r) throw new HttpError(400, "No voice available for that language");
    return NextResponse.json({ audioId: r.asset.id, url: mediaUrl(r.asset.mediaAssetId), cached: r.cached, voice: r.asset.voice, text: r.asset.text });
  } catch (e) {
    if (e instanceof HttpError) throw e;
    console.error(e);
    return NextResponse.json({ error: "tts_failed", message: (e as Error).message.slice(0, 200) }, { status: 502 });
  }
});
