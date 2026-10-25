// Turns "wait for the student's answer" into recognition alternatives, using either the
// server provider (Azure / Google, keys stay on the server) or Chrome's Web Speech API.
import type { MicSession } from "./mic-session";

export type EngineResult =
  | {
      kind: "result";
      alternatives: Array<{ text: string; confidence: number | null }>;
      provider: string;
      locale: string;
      pronunciation?: { accuracy: number; fluency: number; completeness: number; overall: number } | null;
    }
  | { kind: "timeout" | "too_quiet" | "interrupted" | "cancelled" }
  | { kind: "error"; message: string };

export interface ListenOptions {
  language: string; // app language, e.g. es-419
  locale: string; // recognition locale, e.g. es-MX
  mode: "PHRASE" | "LETTERS";
  reference?: string;
  timeoutMs?: number;
}

export interface SpeechEngine {
  name: "server" | "webspeech";
  listen(mic: MicSession, opts: ListenOptions): Promise<EngineResult>;
  cancel(): void;
}

export class ServerEngine implements SpeechEngine {
  name = "server" as const;
  private ctrl: AbortController | null = null;
  async listen(mic: MicSession, opts: ListenOptions): Promise<EngineResult> {
    const heard = await mic.listen(opts.timeoutMs);
    if (heard.kind !== "speech") return { kind: heard.kind };
    this.ctrl = new AbortController();
    const q = new URLSearchParams({ language: opts.language, mode: opts.mode });
    if (opts.reference) q.set("reference", opts.reference);
    try {
      const res = await fetch(`/api/stt?${q}`, { method: "POST", body: heard.utterance.wav, headers: { "Content-Type": "audio/wav" }, signal: this.ctrl.signal });
      if (!res.ok) return { kind: "error", message: `Recognition service error (${res.status})` };
      const json = await res.json();
      return { kind: "result", alternatives: json.alternatives, provider: json.provider, locale: json.locale, pronunciation: json.pronunciation };
    } catch (e) {
      if ((e as Error).name === "AbortError") return { kind: "cancelled" };
      return { kind: "error", message: navigator.onLine ? "Could not reach the recognition service" : "No internet connection" };
    } finally {
      mic.markReady();
    }
  }
  cancel() {
    this.ctrl?.abort();
  }
}

type SR = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  abort(): void;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string; confidence: number }> & { isFinal: boolean }> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  onspeechstart: (() => void) | null;
};

export function webSpeechAvailable() {
  return typeof window !== "undefined" && !!((window as unknown as { SpeechRecognition?: unknown }).SpeechRecognition || (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition);
}

/**
 * Chrome's built-in recognizer. Started fresh for every answer (no clicks needed), only after the
 * app has finished speaking. The language is fixed, so it never switches to English.
 * Note: Chrome sends this audio to Google's speech service.
 */
export class WebSpeechEngine implements SpeechEngine {
  name = "webspeech" as const;
  private rec: SR | null = null;
  listen(mic: MicSession, opts: ListenOptions): Promise<EngineResult> {
    const Ctor = ((window as unknown as { SpeechRecognition?: new () => SR }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: new () => SR }).webkitSpeechRecognition)!;
    return new Promise((resolve) => {
      const rec = new Ctor();
      this.rec = rec;
      rec.lang = opts.locale;
      rec.continuous = false;
      rec.interimResults = false;
      rec.maxAlternatives = 5;
      let done = false;
      let sawSpeech = false;
      const vadWatch = mic.listen(opts.timeoutMs ?? 9000); // drives the on-screen state + silence timeout
      const finish = (r: EngineResult) => {
        if (done) return;
        done = true;
        try {
          rec.abort();
        } catch {}
        mic.hold();
        resolve(r);
      };
      vadWatch.then((o) => {
        if (o.kind === "timeout" && !sawSpeech) finish({ kind: "timeout" });
        if (o.kind === "interrupted") finish({ kind: "interrupted" });
        // when the VAD heard speech, give the recognizer a moment to return its final result
        if (o.kind === "speech" || o.kind === "too_quiet") setTimeout(() => finish(o.kind === "too_quiet" ? { kind: "too_quiet" } : { kind: "result", alternatives: [], provider: "webspeech", locale: opts.locale }), 2500);
      });
      rec.onspeechstart = () => (sawSpeech = true);
      rec.onresult = (e) => {
        const res = e.results[e.results.length - 1];
        const alternatives = Array.from(res).map((a) => ({ text: a.transcript, confidence: a.confidence > 0 ? a.confidence : null }));
        finish({ kind: "result", alternatives, provider: "webspeech", locale: opts.locale });
      };
      rec.onerror = (e) => {
        if (e.error === "no-speech") finish({ kind: "timeout" });
        else if (e.error === "aborted") finish({ kind: "cancelled" });
        else if (e.error === "not-allowed" || e.error === "service-not-allowed") finish({ kind: "error", message: "Speech recognition was blocked by the browser." });
        else if (e.error === "network") finish({ kind: "error", message: "Speech recognition needs an internet connection." });
        else if (e.error === "language-not-supported") finish({ kind: "error", message: `This browser can't recognize ${opts.locale}.` });
        else finish({ kind: "error", message: `Speech recognition error: ${e.error}` });
      };
      rec.onend = () => {
        // Ended without a result (silence or nothing intelligible).
        setTimeout(() => finish(sawSpeech ? { kind: "result", alternatives: [], provider: "webspeech", locale: opts.locale } : { kind: "timeout" }), 50);
      };
      try {
        rec.start();
      } catch (err) {
        finish({ kind: "error", message: (err as Error).message });
      }
    });
  }
  cancel() {
    try {
      this.rec?.abort();
    } catch {}
  }
}
