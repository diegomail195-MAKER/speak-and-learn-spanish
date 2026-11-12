import { NextResponse } from "next/server";
import { handle } from "@/lib/api";
import { audit } from "@/lib/audit";
import { HttpError, requireTeacher } from "@/lib/auth/guards";
import { mediaUrl, saveMedia } from "@/lib/media/save";
import { AUDIO_MAX_BYTES, sniffAudio } from "@/lib/media/validate";
import { rateLimit } from "@/lib/rate-limit";

// Audio for a card face or item: a microphone recording or an uploaded file. Checked by its bytes.
export const POST = handle(async (req: Request) => {
  const { user } = await requireTeacher();
  if (!(await rateLimit(`audio-upload:${user.id}`, 120, 60 * 60_000))) throw new HttpError(429, "Demasiados audios seguidos. Espera unos minutos.");
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) throw new HttpError(400, "No file");
  if (file.size > AUDIO_MAX_BYTES) throw new HttpError(413, "Audio files must be 4 MB or smaller");
  const data = Buffer.from(await file.arrayBuffer());
  const mime = sniffAudio(data);
  if (!mime) throw new HttpError(415, "Only MP3, WAV, OGG, WebM or M4A audio is allowed");
  const asset = await saveMedia({ schoolId: user.schoolId, ownerUserId: user.id, kind: "AUDIO", data, mimeType: mime, originalName: file.name || "audio" });
  await audit(user.schoolId, user.id, "media.upload_audio", "MediaAsset", asset.id, { bytes: data.length });
  return NextResponse.json({ id: asset.id, url: mediaUrl(asset.id), name: asset.originalName });
});
