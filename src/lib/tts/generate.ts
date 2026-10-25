import "server-only";
import { db } from "@/lib/db";
import { saveMedia } from "@/lib/media/save";
import { synthesize, ttsCacheKey, ttsProvider, voicesFor } from "./index";
import type { AppLanguage } from "./voices";

/** Returns a cached AudioAsset for this text/voice, generating it once if needed. */
export async function ensureAudio(opts: { schoolId: string; userId: string | null; text: string; language: AppLanguage; voiceId?: string; rate: number; style?: string | null; regenerate?: boolean }) {
  const provider = ttsProvider();
  if (!provider) return null;
  const text = opts.text.trim();
  if (!text) return null;
  const voices = voicesFor(provider).filter((v) => v.language === opts.language);
  const voice = voices.find((v) => v.id === opts.voiceId) ?? voices[0];
  if (!voice) return null;
  const req = { text, voice, rate: opts.rate, style: opts.style ?? null };
  const cacheKey = ttsCacheKey(provider, req);
  const cached = await db.audioAsset.findUnique({ where: { schoolId_cacheKey: { schoolId: opts.schoolId, cacheKey } } });
  if (cached && !opts.regenerate) return { asset: cached, cached: true };
  const audio = await synthesize(provider, req);
  const media = await saveMedia({ schoolId: opts.schoolId, ownerUserId: opts.userId, kind: "AUDIO", data: audio, mimeType: "audio/mpeg", originalName: text.slice(0, 60) + ".mp3" });
  const asset = cached
    ? await db.audioAsset.update({ where: { id: cached.id }, data: { mediaAssetId: media.id } })
    : await db.audioAsset.create({ data: { schoolId: opts.schoolId, mediaAssetId: media.id, text, language: opts.language, voice: voice.id, rate: opts.rate, style: req.style, provider, cacheKey } });
  return { asset, cached: false };
}
