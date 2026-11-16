import { NextResponse } from "next/server";
import { z } from "zod";
import { handle } from "@/lib/api";
import { HttpError, requireTeacher } from "@/lib/auth/guards";
import { mediaUrl } from "@/lib/media/save";
import { rateLimit } from "@/lib/rate-limit";
import { ttsProvider, voicesFor } from "@/lib/tts";
import { ensureAudio } from "@/lib/tts/generate";
import { AUDIO_LANGUAGE_CODES } from "@/lib/tts/voices";

export const GET = handle(async () => {
  await requireTeacher();
  const provider = ttsProvider();
  const voices = voicesFor(provider).map((v) => ({ id: v.id, label: v.label, language: v.language, styles: v.styles, recommended: !!v.recommended, description: v.description ?? "" }));
  // Only languages the service really has a voice for (the three main ones are always listed).
  const languages = AUDIO_LANGUAGE_CODES.filter((l) => l === "es-419" || l === "en-US" || l === "fr-FR" || voices.some((v) => v.language === l));
  return NextResponse.json({ provider, languages, voices });
});

const schema = z.object({
  text: z.string().trim().min(1).max(600),
  language: z.enum(AUDIO_LANGUAGE_CODES),
  voice: z.string().max(80).optional(),
  voices: z.record(z.enum(AUDIO_LANGUAGE_CODES), z.string().max(80)).optional(),
  rate: z.number().min(0.5).max(1.5).default(0.95),
  style: z.string().max(30).nullish(),
  regenerate: z.boolean().optional(),
});

// Generates (or reuses from cache) spoken audio for a piece of text.
export const POST = handle(async (req: Request) => {
  const { user } = await requireTeacher();
  const body = schema.parse(await req.json());
  if (!ttsProvider()) return NextResponse.json({ error: "tts_not_configured" }, { status: 503 });
  if (!(await rateLimit(`tts:${user.schoolId}`, 400, 60 * 60_000))) throw new HttpError(429, "Audio generation limit reached, try again later");
  try {
    const r = await ensureAudio({ schoolId: user.schoolId, userId: user.id, text: body.text, language: body.language, voiceId: body.voice, voices: body.voices, rate: body.rate, style: body.style, regenerate: body.regenerate });
    if (!r) throw new HttpError(400, "No voice available for that language");
    return NextResponse.json({ audioId: r.asset.id, mediaId: r.asset.mediaAssetId, url: mediaUrl(r.asset.mediaAssetId), cached: r.cached, voice: r.asset.voice, text: r.asset.text, rate: r.asset.rate });
  } catch (e) {
    if (e instanceof HttpError) throw e;
    console.error(e);
    return NextResponse.json({ error: "tts_failed", message: "El servicio de voz no pudo crear este audio. Inténtalo de nuevo en unos segundos. · The voice service could not create this audio. Please try again." }, { status: 502 });
  }
});
