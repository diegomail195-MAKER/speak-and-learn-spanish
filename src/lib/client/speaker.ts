// Plays prompts and feedback. Generated audio (server TTS, cached) is preferred; when a clip
// has no generated audio, the browser's own voice for the *same language* is used. If the
// device has no voice for that language, nothing is spoken (text stays on screen) rather than
// reading Spanish with an English voice.
import { speechSegments } from "@/lib/text/segments";
import { BROWSER_LOCALES, type AppLanguage } from "@/lib/tts/voices";

export function pickBrowserVoice(language: AppLanguage): SpeechSynthesisVoice | null {
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

export class Speaker {
  private audio: HTMLAudioElement | null = null;
  private cancelFn: (() => void) | null = null;

  /** Resolves when playback ends (or immediately if nothing can be played). */
  async say(text: string, language: AppLanguage, url?: string | null, rate = 0.95): Promise<"audio" | "browser" | "none"> {
    this.stop();
    if (url) {
      const ok = await new Promise<boolean>((resolve) => {
        const a = new Audio(url);
        this.audio = a;
        this.cancelFn = () => resolve(true);
        a.onended = () => resolve(true);
        a.onerror = () => resolve(false);
        a.play().catch(() => resolve(false));
      });
      if (ok) return "audio";
    }
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
    if (this.audio) {
      this.audio.pause();
      this.audio = null;
    }
    if (typeof speechSynthesis !== "undefined") speechSynthesis.cancel();
    this.cancelFn?.();
    this.cancelFn = null;
  }
}
