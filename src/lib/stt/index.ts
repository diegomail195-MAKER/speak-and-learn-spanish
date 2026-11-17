import "server-only";

// Server-side speech recognition. Audio arrives as 16 kHz mono WAV, is forwarded to the
// configured provider and discarded — it is never written to disk or the database.
//   STT_PROVIDER=azure  + AZURE_SPEECH_KEY + AZURE_SPEECH_REGION   (recognition + pronunciation assessment)
//   STT_PROVIDER=google + GOOGLE_CLOUD_API_KEY                      (recognition)
//   STT_PROVIDER=gateway (Vercel AI Gateway, OpenAI transcription; STT_GATEWAY_MODEL, default
//                        openai/gpt-4o-transcribe, then gpt-4o-mini-transcribe, then whisper-1). Also the default on Vercel when no
//                        STT_PROVIDER is set, since the natural voices use the same gateway.
// Without a server provider the browser's Web Speech API is used instead (Chrome sends that
// audio to Google; see docs/PRIVACY.md).

import { gatewayAvailable, gatewayTranscribe } from "@/lib/tts/gateway";

export type SttProviderName = "azure" | "google" | "gateway" | "scripted-test";

/**
 * "scripted-test" exists only for automated end-to-end tests: it receives the real WAV from the
 * browser, checks it contains audio, and returns the next transcript from E2E_STT_SCRIPT_FILE.
 * It requires E2E_SCRIPTED_STT=1 and is shown as a warning in the dashboard.
 */
export function sttProvider(): SttProviderName | null {
  const p = process.env.STT_PROVIDER;
  if (p === "scripted-test" && process.env.E2E_SCRIPTED_STT === "1" && process.env.E2E_STT_SCRIPT_FILE) return "scripted-test";
  if (p === "azure" && process.env.AZURE_SPEECH_KEY && process.env.AZURE_SPEECH_REGION) return "azure";
  if (p === "google" && process.env.GOOGLE_CLOUD_API_KEY) return "google";
  if ((p === "gateway" || !p) && gatewayAvailable() && process.env.STT_PROVIDER !== "browser") return "gateway";
  return null;
}

/** The recognition locale is fixed per activity; the engine is never allowed to auto-switch to English. */
export function sttLocale(appLanguage: string): string {
  if (appLanguage === "es-419") return process.env.STT_SPANISH_LOCALE ?? "es-MX";
  return appLanguage;
}

export interface SttResult {
  alternatives: Array<{ text: string; confidence: number | null }>;
  locale: string;
  provider: SttProviderName;
  status: string;
  pronunciation?: { accuracy: number; fluency: number; completeness: number; overall: number } | null;
}

const LETTER_HINTS = ["a", "be", "ce", "de", "e", "efe", "ge", "hache", "i", "jota", "ka", "ele", "eme", "ene", "eñe", "o", "pe", "cu", "erre", "ese", "te", "u", "uve", "doble ve", "equis", "i griega", "zeta", "be larga", "ve corta"];

export async function recognize(provider: SttProviderName, wav: Buffer, opts: { locale: string; mode: "PHRASE" | "LETTERS"; reference?: string; hints?: string[] }): Promise<SttResult> {
  if (provider === "scripted-test") return scripted(wav, opts);
  if (provider === "gateway") return gateway(wav, opts);
  return provider === "azure" ? azure(wav, opts) : google(wav, opts);
}

/**
 * OpenAI transcription through Vercel AI Gateway. The language is fixed to the activity's (never
 * auto-detected). The prompt gives the context of a child learning the language and the
 * activity's whole vocabulary (every answer, not the right one), which helps with accents and
 * soft voices without pushing the transcript towards the correct answer. Letter names get a
 * hint of the alphabet, as with Google.
 */
const GATEWAY_MODELS = ["openai/gpt-4o-transcribe", "openai/gpt-4o-mini-transcribe", "openai/whisper-1"];
const CONTEXT: Record<string, (words: string) => string> = {
  es: (w) => `Un niño que aprende español responde en voz alta con acento.${w ? ` Palabras de la actividad: ${w}.` : ""}`,
  en: (w) => `A child learning English answers out loud with an accent.${w ? ` Words in this activity: ${w}.` : ""}`,
  fr: (w) => `Un enfant qui apprend le français répond à voix haute avec un accent.${w ? ` Mots de l'activité : ${w}.` : ""}`,
};

async function gateway(wav: Buffer, opts: { locale: string; mode: string; hints?: string[] }): Promise<SttResult> {
  const samples = (wav.length - 44) / 2;
  if (samples / 16000 < 0.25) return { provider: "gateway", locale: opts.locale, status: "NoMatch", alternatives: [], pronunciation: null };
  const lang = opts.locale.slice(0, 2);
  const prompt = opts.mode === "LETTERS" ? `Letras del alfabeto: ${LETTER_HINTS.join(", ")}.` : (CONTEXT[lang] ?? CONTEXT.es)((opts.hints ?? []).join(", "));
  const preferred = process.env.STT_GATEWAY_MODEL;
  const models = preferred ? [preferred, ...GATEWAY_MODELS.filter((m) => m !== preferred)] : GATEWAY_MODELS;
  let text = "";
  let lastError: unknown = null;
  for (const model of models) {
    try {
      text = (await gatewayTranscribe(model, wav, "audio/wav", lang, prompt)).trim();
      lastError = null;
      break;
    } catch (e) {
      lastError = e; // a model the gateway doesn't offer: try the next one
    }
  }
  if (lastError) throw lastError;
  // Whisper-style models sometimes "hear" these on silence, or echo the prompt; treat them as nothing heard.
  const junk = /^(gracias( por ver( el video)?)?|subtítulos .*|thank you|merci)[.!]?$/i;
  const echoed = prompt && text && prompt.toLowerCase().includes(text.toLowerCase()) && text.length > 25;
  const status = text && !junk.test(text) && !echoed ? "Success" : "NoMatch";
  return { provider: "gateway", locale: opts.locale, status, alternatives: status === "Success" ? [{ text, confidence: null }] : [], pronunciation: null };
}

async function scripted(wav: Buffer, opts: { locale: string; mode: string }): Promise<SttResult> {
  const { appendFile, readFile, writeFile } = await import("node:fs/promises");
  const file = process.env.E2E_STT_SCRIPT_FILE!;
  const queue = JSON.parse(await readFile(file, "utf8")) as Array<{ text: string; confidence?: number }>;
  const next = queue.shift();
  await writeFile(file, JSON.stringify(queue));
  // Lets the tests check which locale each answer was recognized in (never auto-switched).
  if (process.env.E2E_STT_LOG) await appendFile(process.env.E2E_STT_LOG, JSON.stringify({ locale: opts.locale, mode: opts.mode, text: next?.text ?? null }) + "\n");
  const samples = (wav.length - 44) / 2;
  const seconds = samples / 16000;
  const status = !next || seconds < 0.2 ? "NoMatch" : "Success";
  return {
    provider: "scripted-test",
    locale: opts.locale,
    status,
    alternatives: status === "Success" ? [{ text: next!.text, confidence: next!.confidence ?? 0.9 }] : [],
    pronunciation: null,
  };
}

async function azure(wav: Buffer, opts: { locale: string; mode: string; reference?: string }): Promise<SttResult> {
  const headers: Record<string, string> = {
    "Ocp-Apim-Subscription-Key": process.env.AZURE_SPEECH_KEY!,
    "Content-Type": "audio/wav; codecs=audio/pcm; samplerate=16000",
    Accept: "application/json",
  };
  // Pronunciation assessment is a separate signal from recognition; only requested for repeat-after-me items.
  if (opts.reference && opts.mode === "PHRASE") {
    headers["Pronunciation-Assessment"] = Buffer.from(
      JSON.stringify({ ReferenceText: opts.reference, GradingSystem: "HundredMark", Granularity: "Word", Dimension: "Comprehensive" }),
    ).toString("base64");
  }
  const url = `https://${process.env.AZURE_SPEECH_REGION}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=${encodeURIComponent(opts.locale)}&format=detailed&profanity=masked`;
  const res = await fetch(url, { method: "POST", headers, body: new Uint8Array(wav) });
  if (!res.ok) throw new Error(`Azure STT ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const json = (await res.json()) as {
    RecognitionStatus: string;
    NBest?: Array<{ Confidence: number; Lexical: string; Display: string; PronScore?: number; AccuracyScore?: number; FluencyScore?: number; CompletenessScore?: number; PronunciationAssessment?: { AccuracyScore: number; FluencyScore: number; CompletenessScore: number; PronScore: number } }>;
  };
  const nbest = json.NBest ?? [];
  const pa = nbest[0]?.PronunciationAssessment ?? (nbest[0]?.PronScore != null ? { AccuracyScore: nbest[0].AccuracyScore!, FluencyScore: nbest[0].FluencyScore!, CompletenessScore: nbest[0].CompletenessScore!, PronScore: nbest[0].PronScore } : null);
  return {
    provider: "azure",
    locale: opts.locale,
    status: json.RecognitionStatus,
    alternatives: nbest.map((n) => ({ text: n.Display || n.Lexical, confidence: n.Confidence })),
    pronunciation: pa ? { accuracy: pa.AccuracyScore, fluency: pa.FluencyScore, completeness: pa.CompletenessScore, overall: pa.PronScore } : null,
  };
}

async function google(wav: Buffer, opts: { locale: string; mode: string; hints?: string[] }): Promise<SttResult> {
  const pcm = wav.subarray(44); // strip the WAV header; LINEAR16 expects raw samples
  const res = await fetch(`https://speech.googleapis.com/v1/speech:recognize?key=${encodeURIComponent(process.env.GOOGLE_CLOUD_API_KEY!)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      config: {
        encoding: "LINEAR16",
        sampleRateHertz: 16000,
        languageCode: opts.locale,
        maxAlternatives: 5,
        model: "latest_short",
        profanityFilter: true,
        // Letter names are short and easily misheard; hinting the alphabet helps without biasing towards one answer.
        speechContexts: opts.mode === "LETTERS" ? [{ phrases: LETTER_HINTS, boost: 10 }] : opts.hints?.length ? [{ phrases: opts.hints, boost: 6 }] : undefined,
      },
      audio: { content: pcm.toString("base64") },
    }),
  });
  if (!res.ok) throw new Error(`Google STT ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const json = (await res.json()) as { results?: Array<{ alternatives: Array<{ transcript: string; confidence?: number }> }> };
  const alts = (json.results ?? []).flatMap((r) => r.alternatives);
  return {
    provider: "google",
    locale: opts.locale,
    status: alts.length ? "Success" : "NoMatch",
    alternatives: alts.map((a) => ({ text: a.transcript.trim(), confidence: a.confidence ?? null })),
    pronunciation: null,
  };
}
