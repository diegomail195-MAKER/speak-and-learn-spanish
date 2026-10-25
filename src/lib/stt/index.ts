import "server-only";

// Server-side speech recognition. Audio arrives as 16 kHz mono WAV, is forwarded to the
// configured provider and discarded — it is never written to disk or the database.
//   STT_PROVIDER=azure  + AZURE_SPEECH_KEY + AZURE_SPEECH_REGION   (recognition + pronunciation assessment)
//   STT_PROVIDER=google + GOOGLE_CLOUD_API_KEY                      (recognition)
// Without a server provider the browser's Web Speech API is used instead (Chrome sends that
// audio to Google; see docs/PRIVACY.md).

export type SttProviderName = "azure" | "google" | "scripted-test";

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

export async function recognize(provider: SttProviderName, wav: Buffer, opts: { locale: string; mode: "PHRASE" | "LETTERS"; reference?: string }): Promise<SttResult> {
  if (provider === "scripted-test") return scripted(wav, opts);
  return provider === "azure" ? azure(wav, opts) : google(wav, opts);
}

async function scripted(wav: Buffer, opts: { locale: string }): Promise<SttResult> {
  const { readFile, writeFile } = await import("node:fs/promises");
  const file = process.env.E2E_STT_SCRIPT_FILE!;
  const queue = JSON.parse(await readFile(file, "utf8")) as Array<{ text: string; confidence?: number }>;
  const next = queue.shift();
  await writeFile(file, JSON.stringify(queue));
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

async function google(wav: Buffer, opts: { locale: string; mode: string }): Promise<SttResult> {
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
        speechContexts: opts.mode === "LETTERS" ? [{ phrases: LETTER_HINTS, boost: 10 }] : undefined,
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
