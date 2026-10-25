import "server-only";
import { createHash } from "node:crypto";
import { AZURE_VOICES, GOOGLE_VOICES, type Voice } from "./voices";

// Text-to-speech providers. Keys live only on the server (env vars), never in the browser.
//   TTS_PROVIDER=azure  + AZURE_SPEECH_KEY + AZURE_SPEECH_REGION
//   TTS_PROVIDER=google + GOOGLE_CLOUD_API_KEY

export type TtsProviderName = "azure" | "google";

export function ttsProvider(): TtsProviderName | null {
  const p = process.env.TTS_PROVIDER;
  if (p === "azure" && process.env.AZURE_SPEECH_KEY && process.env.AZURE_SPEECH_REGION) return "azure";
  if (p === "google" && process.env.GOOGLE_CLOUD_API_KEY) return "google";
  return null;
}

export function voicesFor(provider: TtsProviderName | null): Voice[] {
  return provider === "azure" ? AZURE_VOICES : provider === "google" ? GOOGLE_VOICES : [];
}

export interface TtsRequest {
  text: string;
  voice: Voice;
  rate: number; // 0.5 – 1.5
  style?: string | null;
}

export function ttsCacheKey(provider: string, r: TtsRequest) {
  return createHash("sha256")
    .update(JSON.stringify([provider, r.voice.id, r.rate.toFixed(2), r.style ?? "", r.text.normalize("NFC").trim()]))
    .digest("hex");
}

const escapeXml = (s: string) => s.replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c]!);

async function azure(r: TtsRequest): Promise<Buffer> {
  const pct = Math.round((r.rate - 1) * 100);
  let inner = `<prosody rate="${pct >= 0 ? "+" : ""}${pct}%">${escapeXml(r.text)}</prosody>`;
  if (r.style && r.voice.styles?.includes(r.style)) inner = `<mstts:express-as style="${r.style}">${inner}</mstts:express-as>`;
  const ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="${r.voice.providerLocale}"><voice name="${r.voice.id}">${inner}</voice></speak>`;
  const res = await fetch(`https://${process.env.AZURE_SPEECH_REGION}.tts.speech.microsoft.com/cognitiveservices/v1`, {
    method: "POST",
    headers: {
      "Ocp-Apim-Subscription-Key": process.env.AZURE_SPEECH_KEY!,
      "Content-Type": "application/ssml+xml",
      "X-Microsoft-OutputFormat": "audio-24khz-48kbitrate-mono-mp3",
      "User-Agent": "speak-learn-spanish",
    },
    body: ssml,
  });
  if (!res.ok) throw new Error(`Azure TTS ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return Buffer.from(await res.arrayBuffer());
}

async function google(r: TtsRequest): Promise<Buffer> {
  const res = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${encodeURIComponent(process.env.GOOGLE_CLOUD_API_KEY!)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      input: { text: r.text },
      voice: { languageCode: r.voice.providerLocale, name: r.voice.id },
      audioConfig: { audioEncoding: "MP3", speakingRate: r.rate },
    }),
  });
  if (!res.ok) throw new Error(`Google TTS ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const json = (await res.json()) as { audioContent: string };
  return Buffer.from(json.audioContent, "base64");
}

export async function synthesize(provider: TtsProviderName, r: TtsRequest): Promise<Buffer> {
  return provider === "azure" ? azure(r) : google(r);
}
