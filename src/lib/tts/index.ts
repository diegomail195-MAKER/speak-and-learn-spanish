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

/** One spoken run: text read by one voice (one language). */
export interface TtsPart {
  text: string;
  voice: Voice;
}

export interface TtsRequest {
  /** One part for plain text; several when the sentence switches language. */
  parts: TtsPart[];
  rate: number; // 0.5 – 1.5
  style?: string | null;
}

export function ttsCacheKey(provider: string, r: TtsRequest) {
  return createHash("sha256")
    .update(JSON.stringify([provider, r.parts.map((p) => [p.voice.id, p.text.normalize("NFC").trim()]), r.rate.toFixed(2), r.style ?? ""]))
    .digest("hex");
}

const escapeXml = (s: string) => s.replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c]!);

/**
 * Azure: one SSML document with one <voice> per language run, so the whole sentence comes back
 * as a single natural recording (each run read by a native voice of its language).
 */
export function azureSsml(r: TtsRequest): string {
  const pct = Math.round((r.rate - 1) * 100);
  const voices = r.parts
    .map((p) => {
      let inner = `<prosody rate="${pct >= 0 ? "+" : ""}${pct}%">${escapeXml(p.text)}</prosody>`;
      if (r.style && p.voice.styles?.includes(r.style)) inner = `<mstts:express-as style="${r.style}">${inner}</mstts:express-as>`;
      return `<voice name="${p.voice.id}">${inner}</voice>`;
    })
    .join("");
  return `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="${r.parts[0].voice.providerLocale}">${voices}</speak>`;
}

async function azure(r: TtsRequest): Promise<{ data: Buffer; mime: string }> {
  const res = await fetch(`https://${process.env.AZURE_SPEECH_REGION}.tts.speech.microsoft.com/cognitiveservices/v1`, {
    method: "POST",
    headers: {
      "Ocp-Apim-Subscription-Key": process.env.AZURE_SPEECH_KEY!,
      "Content-Type": "application/ssml+xml",
      "X-Microsoft-OutputFormat": "audio-24khz-48kbitrate-mono-mp3",
      "User-Agent": "speak-learn-spanish",
    },
    body: azureSsml(r),
  });
  if (!res.ok) throw new Error(`Azure TTS ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return { data: Buffer.from(await res.arrayBuffer()), mime: "audio/mpeg" };
}

async function googlePart(p: TtsPart, rate: number, encoding: "MP3" | "LINEAR16"): Promise<Buffer> {
  const res = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${encodeURIComponent(process.env.GOOGLE_CLOUD_API_KEY!)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      input: { text: p.text },
      voice: { languageCode: p.voice.providerLocale, name: p.voice.id },
      audioConfig: { audioEncoding: encoding, speakingRate: rate, ...(encoding === "LINEAR16" ? { sampleRateHertz: 24000 } : {}) },
    }),
  });
  if (!res.ok) throw new Error(`Google TTS ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const json = (await res.json()) as { audioContent: string };
  return Buffer.from(json.audioContent, "base64");
}

/** Google has no multi-voice request: each run is synthesized as PCM and joined smoothly. */
async function google(r: TtsRequest): Promise<{ data: Buffer; mime: string }> {
  if (r.parts.length === 1) return { data: await googlePart(r.parts[0], r.rate, "MP3"), mime: "audio/mpeg" };
  const pcm = await Promise.all(r.parts.map((p) => googlePart(p, r.rate, "LINEAR16").then(wavSamples)));
  return { data: joinPcm(pcm, 24000), mime: "audio/wav" };
}

/** Int16 samples of a WAV file (finds the "data" chunk). */
export function wavSamples(wav: Buffer): Int16Array {
  let o = 12;
  while (o + 8 <= wav.length) {
    const id = wav.toString("ascii", o, o + 4);
    const size = wav.readUInt32LE(o + 4);
    if (id === "data") {
      const body = wav.subarray(o + 8, o + 8 + size);
      return new Int16Array(body.buffer.slice(body.byteOffset, body.byteOffset + (body.length & ~1)));
    }
    o += 8 + size + (size & 1);
  }
  throw new Error("Not a WAV file");
}

/**
 * Joins runs with a short natural pause. Leading/trailing silence of each run is trimmed and
 * every edge gets a 10 ms fade, so there are no clicks or long gaps between languages.
 */
export function joinPcm(parts: Int16Array[], sampleRate: number, gapMs = 120): Buffer {
  const fade = Math.round(sampleRate * 0.01);
  const gap = new Int16Array(Math.round((sampleRate * gapMs) / 1000));
  const trimmed = parts.map((p) => {
    const thr = 300;
    let a = 0;
    let b = p.length;
    while (a < b && Math.abs(p[a]) < thr) a++;
    while (b > a && Math.abs(p[b - 1]) < thr) b--;
    const x = p.slice(Math.max(0, a - fade), Math.min(p.length, b + fade));
    for (let i = 0; i < Math.min(fade, x.length); i++) {
      x[i] = Math.round((x[i] * i) / fade);
      x[x.length - 1 - i] = Math.round((x[x.length - 1 - i] * i) / fade);
    }
    return x;
  });
  const chunks = trimmed.flatMap((x, i) => (i ? [gap, x] : [x]));
  const n = chunks.reduce((s, c) => s + c.length, 0);
  const out = Buffer.alloc(44 + n * 2);
  out.write("RIFF", 0, "ascii");
  out.writeUInt32LE(36 + n * 2, 4);
  out.write("WAVEfmt ", 8, "ascii");
  out.writeUInt32LE(16, 16);
  out.writeUInt16LE(1, 20);
  out.writeUInt16LE(1, 22);
  out.writeUInt32LE(sampleRate, 24);
  out.writeUInt32LE(sampleRate * 2, 28);
  out.writeUInt16LE(2, 32);
  out.writeUInt16LE(16, 34);
  out.write("data", 36, "ascii");
  out.writeUInt32LE(n * 2, 40);
  let o = 44;
  for (const c of chunks) for (const v of c) (out.writeInt16LE(v, o), (o += 2));
  return out;
}

export async function synthesize(provider: TtsProviderName, r: TtsRequest): Promise<{ data: Buffer; mime: string }> {
  return provider === "azure" ? azure(r) : google(r);
}
