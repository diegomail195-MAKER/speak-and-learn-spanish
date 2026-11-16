// Plays prompts and feedback. Generated audio (server TTS, cached) is preferred; when a clip
// has no generated audio, the browser's own voice for the *same language* is used. If the
// device has no voice for that language, nothing is spoken (text stays on screen) rather than
// reading Spanish with an English voice.
import { speechSegments } from "@/lib/text/segments";
import { BROWSER_LOCALES, type AudioLanguage } from "@/lib/tts/voices";

export function pickBrowserVoice(language: AudioLanguage): SpeechSynthesisVoice | null {
  if (typeof speechSynthesis === "undefined") return null;
  const voices = speechSynthesis.getVoices();
  for (const tag of BROWSER_LOCALES[language] ?? []) {
    const exact = voices.filter((v) => v.lang.replace("_", "-").toLowerCase() === tag.toLowerCase());
    const pref = exact.find((v) => /google|natural|neural/i.test(v.name)) ?? exact[0];
    if (pref) return pref;
  }
  const prefix = (BROWSER_LOCALES[language]?.at(-1) ?? language).toLowerCase();
  return voices.find((v) => v.lang.toLowerCase().startsWith(prefix)) ?? null;
}

export function loadBrowserVoices(): Promise<void> {
  if (typeof speechSynthesis === "undefined" || speechSynthesis.getVoices().length) return Promise.resolve();
  return new Promise((r) => {
    const t = setTimeout(r, 1500);
    speechSynthesis.addEventListener("voiceschanged", () => (clearTimeout(t), r()), { once: true });
  });
}

export type SayResult = "audio" | "browser" | "none" | "blocked";

// Clips downloaded ahead of time (original URL → in-memory blob URL), so a card's audio starts
// the moment it is shown instead of waiting for the network.
const ready = new Map<string, string>();
const queued = new Set<string>();
let pending: string[] = [];
let active = 0;

function pump() {
  while (active < 4 && pending.length) {
    const url = pending.shift()!;
    active++;
    fetch(url, { credentials: "same-origin" })
      .then((r) => (r.ok ? r.blob() : null))
      .then((b) => {
        if (b && b.size) ready.set(url, URL.createObjectURL(b));
      })
      .catch(() => queued.delete(url)) // try again next time it is asked for
      .finally(() => {
        active--;
        pump();
      });
  }
}

/** Downloads clips in the background, in the order given (first card first). */
export function preloadAudio(urls: Array<string | null | undefined>) {
  if (typeof fetch === "undefined" || typeof URL.createObjectURL !== "function") return;
  const fresh = urls.filter((u): u is string => !!u && !u.startsWith("data:") && !u.startsWith("blob:") && !queued.has(u));
  fresh.forEach((u) => queued.add(u));
  pending = [...fresh, ...pending];
  pump();
}

/** Every audio URL in a game or item, in document order: keys ending in AudioUrl and audio.url. */
export function audioUrlsIn(value: unknown, out: string[] = []): string[] {
  if (Array.isArray(value)) value.forEach((v) => audioUrlsIn(v, out));
  else if (value && typeof value === "object") {
    for (const [k, v] of Object.entries(value)) {
      if (typeof v === "string" && /AudioUrl$/.test(k)) out.push(v);
      else if (k === "audio" && v && typeof v === "object" && typeof (v as { url?: unknown }).url === "string") out.push((v as { url: string }).url);
      if (v && typeof v === "object") audioUrlsIn(v, out);
    }
  }
  return out;
}

/**
 * One reusable <audio> element per speaker. Browsers (iOS Safari above all) only allow audio
 * that starts from a tap; once this element has played inside a tap (unlock), later clips can
 * play by themselves on the same element. When the browser still refuses, say() returns
 * "blocked" so the board can show its "Escuchar" button. A blocked clip never falls back to the
 * device voice (that would sound robotic and is usually blocked too).
 */
export class Speaker {
  private audio: HTMLAudioElement | null = null;
  private cancelFn: (() => void) | null = null;
  private unlocked = false;

  private el(): HTMLAudioElement | null {
    if (typeof Audio === "undefined") return null;
    if (!this.audio) {
      this.audio = new Audio();
      this.audio.preload = "auto";
    }
    return this.audio;
  }

  /** Call from a click/tap handler (Start, Listen): allows later automatic playback. */
  unlock() {
    if (this.unlocked) return;
    const a = this.el();
    if (!a) return;
    this.unlocked = true;
    // 0.1 s of silence: enough for the browser to mark the element as allowed.
    a.src = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YQAAAAA=";
    a.play().catch(() => (this.unlocked = false));
    if (typeof speechSynthesis !== "undefined") {
      try {
        speechSynthesis.speak(new SpeechSynthesisUtterance(""));
      } catch {
        /* ignore */
      }
    }
  }

  /** Resolves when playback ends (or immediately if nothing can be played). */
  async say(text: string, language: AudioLanguage, url?: string | null, rate = 0.95): Promise<SayResult> {
    this.stop();
    if (url) {
      const a = this.el();
      if (a) {
        const r = await new Promise<"ok" | "error" | "blocked" | "cancelled">((resolve) => {
          this.cancelFn = () => resolve("cancelled");
          a.onended = () => resolve("ok");
          a.onerror = () => resolve("error");
          a.dataset.src = url;
          a.src = ready.get(url) ?? url;
          a.currentTime = 0;
          a.play().catch((e: unknown) => resolve((e as { name?: string })?.name === "NotAllowedError" ? "blocked" : "error"));
        });
        a.onended = a.onerror = null;
        if (r === "ok" || r === "cancelled") return "audio";
        if (r === "blocked") return "blocked";
      }
    }
    if (!text.trim()) return "none";
    // Browser voices: each language run ("…en español, [en]love[/en]?") gets a voice of its
    // own language. A run with no matching voice on this device is skipped, not mispronounced.
    const runs = speechSegments(text, language);
    if (!runs.length) return "none";
    await loadBrowserVoices();
    let spoke = false;
    for (const run of runs) {
      const voice = pickBrowserVoice(run.language);
      if (!voice) continue;
      const cancelled = await new Promise<boolean>((resolve) => {
        const u = new SpeechSynthesisUtterance(run.text);
        u.voice = voice;
        u.lang = voice.lang;
        u.rate = rate;
        const safety = setTimeout(() => resolve(false), 2000 + run.text.length * 120); // Chrome sometimes never fires onend
        u.onend = u.onerror = () => (clearTimeout(safety), resolve(false));
        this.cancelFn = () => (clearTimeout(safety), resolve(true));
        speechSynthesis.speak(u);
      });
      spoke = true;
      if (cancelled) break;
    }
    return spoke ? "browser" : "none";
  }

  stop() {
    if (this.audio) this.audio.pause();
    if (typeof speechSynthesis !== "undefined") speechSynthesis.cancel();
    const c = this.cancelFn;
    this.cancelFn = null;
    c?.();
  }
}
