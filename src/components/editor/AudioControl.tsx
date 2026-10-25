"use client";

import { useState } from "react";
import { Speaker } from "@/lib/client/speaker";
import type { AppLanguage } from "@/lib/tts/voices";

export type TtsConfig = { provider: "azure" | "google" | null; voices: Array<{ id: string; label: string; language: AppLanguage; styles?: string[] }> };

const speaker = typeof window !== "undefined" ? new Speaker() : null;

/** Generate / regenerate / play the spoken version of a text field. */
export function AudioControl({
  text,
  language,
  voice,
  voices,
  rate,
  audio,
  onAudio,
  tts,
}: {
  text: string;
  language: AppLanguage;
  voice?: string;
  /** Voices for runs marked in other languages. */
  voices?: Partial<Record<AppLanguage, string>>;
  rate: number;
  audio: { id: string | null; text?: string | null; url?: string | null };
  onAudio: (a: { id: string; text: string; url: string } | null) => void;
  tts: TtsConfig | null;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [noVoice, setNoVoice] = useState(false);
  const stale = !!audio.id && audio.text != null && audio.text !== text.trim();
  const has = !!audio.id && !stale;

  async function generate(regenerate = false) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, language, voice: voice || undefined, voices, rate, regenerate }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message ?? json.error);
      onAudio({ id: json.audioId, text: json.text, url: json.url });
      await speaker?.say(text, language, json.url, rate);
    } catch (e) {
      setError((e as Error).message || "Could not generate audio");
    } finally {
      setBusy(false);
    }
  }

  async function browserPreview() {
    const r = await speaker?.say(text, language, null, rate);
    setNoVoice(r === "none");
  }

  if (!text.trim()) return null;
  if (tts && !tts.provider) {
    return (
      <span className="inline-flex flex-wrap items-center gap-2 text-xs">
        <button type="button" onClick={browserPreview} className="rounded-full bg-paper-2 px-3 py-1 font-bold text-ink-2 hover:bg-line">
          ▶ Preview (browser voice)
        </button>
        <span className="text-muted">{noVoice ? "This device has no voice for this language." : "Natural audio needs a TTS key (not saved)."}</span>
      </span>
    );
  }
  return (
    <span className="inline-flex flex-wrap items-center gap-2 text-xs">
      {has ? (
        <>
          <button type="button" onClick={() => speaker?.say(text, language, audio.url, rate)} className="rounded-full bg-teal-soft px-3 py-1 font-bold text-teal-dark hover:bg-teal hover:text-white">
            ▶ Play audio
          </button>
          <button type="button" disabled={busy} onClick={() => generate(true)} className="font-bold text-muted hover:text-ink disabled:opacity-50">
            {busy ? "Generating…" : "Regenerate"}
          </button>
        </>
      ) : (
        <button type="button" disabled={busy || !tts} onClick={() => generate(false)} className="rounded-full bg-teal px-3 py-1 font-bold text-white hover:bg-teal-dark disabled:opacity-50">
          {busy ? "Generating…" : stale ? "Text changed — generate again" : "Generate audio"}
        </button>
      )}
      {error && <span className="font-semibold text-coral-dark">{error}</span>}
    </span>
  );
}
