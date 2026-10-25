import "server-only";
import { db } from "@/lib/db";
import { saveMedia } from "@/lib/media/save";
import { plainText, speechSegments } from "@/lib/text/segments";
import { synthesize, ttsCacheKey, ttsProvider, voicesFor } from "./index";
import type { AppLanguage } from "./voices";

export type VoiceChoice = Partial<Record<AppLanguage, string>>;

/**
 * Returns a cached AudioAsset for this text, generating it once if needed. The text may switch
 * language ("¿Cómo se dice en español, [en]love[/en]?"); each run is read by a voice of its own
 * language — never a Spanish voice reading English.
 */
export async function ensureAudio(opts: { schoolId: string; userId: string | null; text: string; language: AppLanguage; voiceId?: string; voices?: VoiceChoice; rate: number; style?: string | null; regenerate?: boolean }) {
  const provider = ttsProvider();
  if (!provider) return null;
  const text = opts.text.trim();
  if (!plainText(text).trim()) return null;
  const all = voicesFor(provider);
  const choice: VoiceChoice = { ...opts.voices, ...(opts.voiceId ? { [opts.language]: opts.voiceId } : {}) };
  const voiceFor = (lang: AppLanguage) => all.find((v) => v.language === lang && v.id === choice[lang]) ?? all.find((v) => v.language === lang);
  const parts = speechSegments(text, opts.language).map((s) => ({ text: s.text, voice: voiceFor(s.language) }));
  if (!parts.length || parts.some((p) => !p.voice)) return null;
  const req = { parts: parts as Array<{ text: string; voice: NonNullable<(typeof parts)[number]["voice"]> }>, rate: opts.rate, style: opts.style ?? null };
  const cacheKey = ttsCacheKey(provider, req);
  const cached = await db.audioAsset.findUnique({ where: { schoolId_cacheKey: { schoolId: opts.schoolId, cacheKey } } });
  if (cached && !opts.regenerate) return { asset: cached, cached: true };
  const audio = await synthesize(provider, req);
  const ext = audio.mime === "audio/wav" ? "wav" : "mp3";
  const media = await saveMedia({ schoolId: opts.schoolId, ownerUserId: opts.userId, kind: "AUDIO", data: audio.data, mimeType: audio.mime, originalName: `${plainText(text).slice(0, 60)}.${ext}` });
  const voiceLabel = req.parts.map((p) => p.voice.id).filter((v, i, a) => a.indexOf(v) === i).join("+");
  const asset = cached
    ? await db.audioAsset.update({ where: { id: cached.id }, data: { mediaAssetId: media.id } })
    : await db.audioAsset.create({ data: { schoolId: opts.schoolId, mediaAssetId: media.id, text, language: opts.language, voice: voiceLabel, rate: opts.rate, style: req.style, provider, cacheKey } });
  return { asset, cached: false };
}
