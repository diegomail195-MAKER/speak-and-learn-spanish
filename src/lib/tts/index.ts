import "server-only";
import { createHash } from "node:crypto";
import { appendFileSync } from "node:fs";
import { gatewayAvailable, gatewaySpeech } from "./gateway";
import { AZURE_VOICES, GATEWAY_VOICES, GOOGLE_VOICES, type Voice } from "./voices";

// Text-to-speech providers. Keys live only on the server (env vars), never in the browser.
//   TTS_PROVIDER=gateway (Vercel AI Gateway: OIDC on Vercel, or AI_GATEWAY_API_KEY elsewhere)
//   TTS_PROVIDER=azure   + AZURE_SPEECH_KEY + AZURE_SPEECH_REGION
//   TTS_PROVIDER=google  + GOOGLE_CLOUD_API_KEY

export type TtsProviderName = "gateway" | "azure" | "google" | "test";

export function ttsProvider(): TtsProviderName | null {
  const p = process.env.TTS_PROVIDER;
  // Local end-to-end tests only: a short tone per text, never on Vercel.
  if (p === "test" && !process.env.VERCEL) return "test";
  if (p === "gateway" && gatewayAvailable()) return "gateway";
  if (p === "azure" && process.env.AZURE_SPEECH_KEY && process.env.AZURE_SPEECH_REGION) return "azure";
  if (p === "google" && process.env.GOOGLE_CLOUD_API_KEY) return "google";
  return null;
}

export function voicesFor(provider: TtsProviderName | null): Voice[] {
  return provider === "gateway" || provider === "test" ? GATEWAY_VOICES : provider === "azure" ? AZURE_VOICES : provider === "google" ? GOOGLE_VOICES : [];
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
    .update(JSON.stringify([provider, r.parts.map((p) => [p.voice.id, p.voice.model ?? "", p.voice.instructions ?? "", p.text.normalize("NFC").trim()]), r.rate.toFixed(2), r.style ?? ""]))
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

/** Words for the speed, added to voices that take spoken directions instead of a speed value. */
function paceInstruction(rate: number, lang: string) {
  const es = lang.startsWith("es");
  const fr = lang.startsWith("fr");
  if (rate <= 0.8) return es ? "Habla despacio, con pausas claras." : fr ? "Parle lentement, avec des pauses claires." : "Speak slowly, with clear pauses.";
  if (rate < 0.93) return es ? "Habla un poco más despacio de lo normal." : fr ? "Parle un peu plus lentement que d'habitude." : "Speak a little slower than usual.";
  if (rate >= 1.12) return es ? "Habla con un ritmo algo rápido pero claro." : fr ? "Parle à un rythme un peu rapide mais clair." : "Speak a little faster, but clearly.";
  return "";
}

async function gatewayPart(p: TtsPart, rate: number, format: "mp3" | "wav") {
  const v = p.voice;
  const instructions = [v.instructions, v.speedVia === "instructions" ? paceInstruction(rate, v.providerLocale) : ""].filter(Boolean).join(" ");
  return gatewaySpeech({
    model: v.model!,
    voice: v.name,
    text: p.text,
    instructions: instructions || undefined,
    language: v.sendLanguage ? v.providerLocale : undefined,
    speed: v.speedVia === "instructions" ? undefined : rate,
    outputFormat: format,
  });
}

/** AI Gateway: one request per language run; mixed-language sentences are joined as PCM. */
async function gateway(r: TtsRequest): Promise<{ data: Buffer; mime: string }> {
  if (r.parts.length === 1) {
    const a = await gatewayPart(r.parts[0], r.rate, "mp3");
    return { data: a.data, mime: a.mime };
  }
  const wavs = await Promise.all(r.parts.map((p) => gatewayPart(p, r.rate, "wav")));
  const rate = wavRate(wavs[0].data);
  return { data: joinPcm(wavs.map((w) => wavSamples(w.data)), rate), mime: "audio/wav" };
}

/** Sample rate from a WAV "fmt " chunk (24 kHz when it can't be read). */
export function wavRate(wav: Buffer): number {
  let o = 12;
  while (o + 8 <= wav.length) {
    const id = wav.toString("ascii", o, o + 4);
    const size = wav.readUInt32LE(o + 4);
    if (id === "fmt ") return wav.readUInt32LE(o + 12);
    o += 8 + size + (size & 1);
  }
  return 24000;
}

export async function synthesize(provider: TtsProviderName, r: TtsRequest): Promise<{ data: Buffer; mime: string }> {
  if (provider === "test") return testTone(r);
  return provider === "gateway" ? gateway(r) : provider === "azure" ? azure(r) : google(r);
}

/** Test provider: a quiet tone whose length follows the text (deterministic, no network). */
function testTone(r: TtsRequest): Promise<{ data: Buffer; mime: string }> {
  const text = r.parts.map((p) => p.text).join(" ");
  // Length follows the speed and pitch follows the text and voice, so each distinct request
  // yields distinct bytes (storage deduplicates identical files).
  const n = Math.round((16000 * Math.min(2, 0.25 + text.length * 0.02)) / r.rate);
  const seed = createHash("sha256").update(JSON.stringify([text, r.parts.map((p) => p.voice.id), r.style ?? ""])).digest()[0];
  const f = 300 + seed * 2;
  const pcm = new Int16Array(n).map((_, i) => Math.round(Math.sin((2 * Math.PI * f * i) / 16000) * 2000));
  if (process.env.E2E_TTS_LOG) appendFileSync(process.env.E2E_TTS_LOG, JSON.stringify({ text, voices: r.parts.map((p) => p.voice.id), rate: r.rate }) + "\n");
  return Promise.resolve({ data: joinPcm([pcm], 16000, 0), mime: "audio/wav" });
}
