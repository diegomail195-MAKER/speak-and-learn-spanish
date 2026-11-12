"use client";

import { useEffect, useRef, useState } from "react";
import { Speaker } from "@/lib/client/speaker";
import type { FaceAudio, Lang } from "@/lib/games/types";
import type { TtsConfig } from "./AudioControl";
import { useUi } from "./i18n";
import { mediaSrc } from "./ImageField";

const speaker = typeof window !== "undefined" ? new Speaker() : null;

// Latin American Spanish and US English first, then the other languages the voice service supports.
export const AUDIO_LANGUAGES: Array<{ code: Lang; es: string; en: string }> = [
  { code: "es-419", es: "Español (Latinoamérica)", en: "Spanish (Latin America)" },
  { code: "en-US", es: "Inglés (Estados Unidos)", en: "English (US)" },
  { code: "fr-FR", es: "Francés", en: "French" },
];
const SHORT: Record<Lang, string> = { "es-419": "ES", "en-US": "EN", "fr-FR": "FR" };

/** Plays a face's audio: the saved file, or the text with a device voice of its language. */
export function playFaceAudio(a: { url?: string | null; mediaId?: string | null; text: string; language: Lang } | null | undefined, rate = 0.95) {
  if (!a) return Promise.resolve("none" as const);
  return speaker?.say(a.text, a.language, a.url ?? mediaSrc(a.mediaId), rate) ?? Promise.resolve("none" as const);
}
export const stopFaceAudio = () => speaker?.stop();

async function uploadAudio(blob: Blob, name: string): Promise<{ id: string; name: string }> {
  const fd = new FormData();
  fd.append("file", new File([blob], name, { type: blob.type }));
  const res = await fetch("/api/media/audio", { method: "POST", body: fd });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || `Upload failed (${res.status})`);
  return json;
}

/**
 * "Audio" button for a face or item: record with the microphone, upload a file, or generate
 * speech from text (language and voice per face; the words read aloud can differ from the
 * visible text). The microphone is only requested when the teacher chooses to record.
 */
export function AudioField({
  audio,
  onChange,
  defaultText,
  defaultLanguage,
  tts,
  rate = 0.95,
  label,
}: {
  audio: FaceAudio | null | undefined;
  onChange: (a: FaceAudio | null) => void;
  defaultText: string;
  defaultLanguage: Lang;
  tts: TtsConfig | null;
  rate?: number;
  label?: string;
}) {
  const { t } = useUi();
  const [open, setOpen] = useState(false);
  const has = !!audio && (!!audio.mediaId || !!audio.text.trim());
  return (
    <div className="relative flex min-w-0 max-w-full flex-wrap items-center gap-1">
      {has ? (
        <>
          <button type="button" onClick={() => playFaceAudio(audio, rate)} className="inline-flex h-8 items-center gap-1 rounded-full bg-teal-soft px-2.5 text-xs font-bold text-teal-dark hover:bg-teal hover:text-white" title={audio!.text || audio!.name || t.play} aria-label={`${t.play}${label ? ` (${label})` : ""}`}>
            ▶ <span className="max-w-28 truncate">{audio!.text || audio!.name || (audio!.source === "record" ? "🎙" : "♪")}</span> <span className="opacity-70">{SHORT[audio!.language]}</span>
          </button>
          <button type="button" onClick={() => setOpen(true)} className="h-8 rounded-full px-2 text-xs font-bold text-muted hover:bg-paper-2 hover:text-ink" aria-label={`${t.replace}: ${t.addAudio}${label ? ` (${label})` : ""}`}>✎</button>
          <button type="button" onClick={() => onChange(null)} className="h-8 rounded-full px-1.5 text-xs font-bold text-muted hover:text-coral-dark" aria-label={`${t.remove}: ${t.addAudio}${label ? ` (${label})` : ""}`}>×</button>
        </>
      ) : (
        <button type="button" onClick={() => setOpen(true)} className="inline-flex h-8 items-center gap-1 rounded-full bg-paper-2 px-2.5 text-xs font-bold text-ink-2 hover:bg-line" aria-label={`${t.addAudio}${label ? ` (${label})` : ""}`}>
          🎙 {t.addAudio}
        </button>
      )}
      {open && <AudioPanel audio={audio} defaultText={defaultText} defaultLanguage={defaultLanguage} tts={tts} rate={rate} onClose={() => setOpen(false)} onSave={(a) => (onChange(a), setOpen(false))} />}
    </div>
  );
}

function AudioPanel({ audio, defaultText, defaultLanguage, tts, rate, onClose, onSave }: { audio: FaceAudio | null | undefined; defaultText: string; defaultLanguage: Lang; tts: TtsConfig | null; rate: number; onClose: () => void; onSave: (a: FaceAudio) => void }) {
  const { t, lang: ui } = useUi();
  const [tab, setTab] = useState<"record" | "upload" | "tts">(audio?.source === "record" ? "record" : audio?.source === "upload" ? "upload" : "tts");
  const [language, setLanguage] = useState<Lang>(audio?.language ?? defaultLanguage);
  const [text, setText] = useState(audio?.text || defaultText);
  const [voice, setVoice] = useState<string>(audio?.voice ?? "");
  const [clip, setClip] = useState<{ blob: Blob; url: string; name: string; source: "record" | "upload" } | null>(null);
  const [generated, setGenerated] = useState<{ mediaId: string; url: string; key: string } | null>(null);
  const [rec, setRec] = useState<MediaRecorder | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [micBlocked, setMicBlocked] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const voices = (tts?.voices ?? []).filter((v) => v.language === language);
  const ttsKey = `${text.trim()}|${language}|${voice}`;

  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    return () => {
      window.removeEventListener("keydown", esc);
      rec?.stream.getTracks().forEach((tr) => tr.stop());
    };
  }, [onClose, rec]);

  async function startRec() {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg"].find((m) => typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(m));
      const r = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      const chunks: Blob[] = [];
      r.ondataavailable = (e) => e.data.size && chunks.push(e.data);
      r.onstop = () => {
        stream.getTracks().forEach((tr) => tr.stop());
        const blob = new Blob(chunks, { type: r.mimeType || "audio/webm" });
        setClip({ blob, url: URL.createObjectURL(blob), name: `recording.${blob.type.includes("mp4") ? "m4a" : blob.type.includes("ogg") ? "ogg" : "webm"}`, source: "record" });
        setRec(null);
      };
      r.start();
      setRec(r);
      setTimeout(() => r.state === "recording" && r.stop(), 30_000); // short clips only
    } catch {
      setMicBlocked(true);
    }
  }

  async function previewTts() {
    setError("");
    if (!text.trim()) return;
    if (!tts?.provider) return playFaceAudio({ text, language }, rate);
    if (generated?.key === ttsKey) return playFaceAudio({ url: generated.url, text, language }, rate);
    setBusy(true);
    try {
      const res = await fetch("/api/tts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text, language, voice: voice || undefined, rate }) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message ?? json.error);
      setGenerated({ mediaId: json.mediaId, url: json.url, key: ttsKey });
      await playFaceAudio({ url: json.url, text, language }, rate);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    setError("");
    setBusy(true);
    try {
      if (tab === "tts") {
        if (!text.trim()) throw new Error(t.ttsText);
        if (tts?.provider) {
          let g = generated?.key === ttsKey ? generated : null;
          if (!g) {
            const res = await fetch("/api/tts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text, language, voice: voice || undefined, rate }) });
            const json = await res.json();
            if (!res.ok) throw new Error(json.message ?? json.error);
            g = { mediaId: json.mediaId, url: json.url, key: ttsKey };
          }
          onSave({ mediaId: g.mediaId, text: text.trim(), language, voice: voice || null, source: "tts" });
        } else {
          onSave({ mediaId: null, text: text.trim(), language, voice: null, source: "browser" });
        }
      } else {
        if (!clip) throw new Error(tab === "record" ? t.record : t.uploadAudio);
        const up = await uploadAudio(clip.blob, clip.name);
        onSave({ mediaId: up.id, text: "", language, source: clip.source, name: clip.source === "upload" ? clip.name : undefined });
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const tabs = [
    ["record", `🎙 ${t.record}`],
    ["upload", `⬆ ${t.uploadAudio}`],
    ["tts", `🗣 ${t.tts}`],
  ] as const;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-ink/40 p-3 sm:p-10" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-label={t.addAudio} className="w-full max-w-lg overflow-hidden rounded-xl2 bg-card shadow-soft">
        <div className="flex items-center border-b border-line px-4 py-3">
          <h2 className="font-display text-lg font-semibold">{t.addAudio}</h2>
          <button type="button" onClick={onClose} className="ml-auto rounded-full px-2 text-2xl leading-none text-muted hover:text-ink" aria-label={t.close}>×</button>
        </div>
        <div className="flex gap-1 bg-paper-2 p-1.5 text-sm font-bold" role="tablist">
          {tabs.map(([k, l]) => (
            <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => (setTab(k), setClip(null), setError(""))} className={`flex-1 rounded-full px-2 py-1.5 ${tab === k ? "bg-card text-ink shadow-sm" : "text-muted"}`}>
              {l}
            </button>
          ))}
        </div>
        <div className="space-y-3 p-4 text-sm">
          <label className="block">
            <span className="mb-1 block text-xs font-bold text-ink-2">{t.language}</span>
            <select value={language} onChange={(e) => (setLanguage(e.target.value as Lang), setVoice(""))} className="h-9 w-full rounded-lg border border-line bg-card px-2">
              {AUDIO_LANGUAGES.map((l) => <option key={l.code} value={l.code}>{ui === "es" ? l.es : l.en}</option>)}
            </select>
          </label>
          {tab === "record" && (
            <div className="rounded-xl bg-paper p-3">
              {micBlocked ? (
                <p className="font-semibold text-coral-dark">{t.micBlocked}</p>
              ) : rec ? (
                <button type="button" onClick={() => rec.stop()} className="rounded-full bg-coral px-4 py-2 font-bold text-white">■ {t.stop} <span className="ml-1 animate-pulse">● {t.recording}</span></button>
              ) : (
                <button type="button" onClick={startRec} className="rounded-full bg-teal px-4 py-2 font-bold text-white hover:bg-teal-dark">🎙 {clip ? t.replace : t.record}</button>
              )}
            </div>
          )}
          {tab === "upload" && (
            <div className="rounded-xl bg-paper p-3">
              <button type="button" onClick={() => fileRef.current?.click()} className="rounded-full bg-teal px-4 py-2 font-bold text-white hover:bg-teal-dark">{clip ? t.replace : t.chooseFile}</button>
              <span className="ml-2 text-xs text-muted">MP3, WAV, OGG, M4A · 4 MB</span>
              <input
                ref={fileRef}
                type="file"
                accept="audio/mpeg,audio/wav,audio/x-wav,audio/ogg,audio/webm,audio/mp4,audio/x-m4a,.mp3,.wav,.ogg,.m4a,.webm"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) setClip({ blob: f, url: URL.createObjectURL(f), name: f.name, source: "upload" });
                }}
              />
            </div>
          )}
          {(tab === "record" || tab === "upload") && clip && <audio controls src={clip.url} className="w-full" />}
          {tab === "tts" && (
            <>
              <label className="block">
                <span className="mb-1 block text-xs font-bold text-ink-2">{t.ttsText} <span className="font-normal text-muted">— {t.ttsHint}</span></span>
                <input value={text} onChange={(e) => setText(e.target.value)} maxLength={300} placeholder={language === "en-US" ? "red" : "rojo"} className="h-10 w-full rounded-lg border border-line px-3" />
              </label>
              {tts?.provider ? (
                <label className="block">
                  <span className="mb-1 block text-xs font-bold text-ink-2">{t.voice}</span>
                  <select value={voice} onChange={(e) => setVoice(e.target.value)} className="h-9 w-full rounded-lg border border-line bg-card px-2">
                    <option value="">{voices[0]?.label ?? "—"}</option>
                    {voices.slice(1).map((v) => <option key={v.id} value={v.id}>{v.label}</option>)}
                  </select>
                </label>
              ) : (
                <p className="rounded-lg bg-paper-2 p-2 text-xs text-ink-2">{t.ttsDevice}</p>
              )}
              <button type="button" onClick={previewTts} disabled={busy || !text.trim()} className="rounded-full bg-paper-2 px-4 py-2 font-bold text-ink-2 hover:bg-line disabled:opacity-50">▶ {t.listen}</button>
            </>
          )}
          {error && <p className="font-semibold text-coral-dark">{error}</p>}
        </div>
        <div className="flex justify-end gap-2 border-t border-line px-4 py-3">
          <button type="button" onClick={onClose} className="rounded-full px-4 py-2 text-sm font-bold text-ink-2 hover:bg-paper-2">{t.cancel}</button>
          <button type="button" onClick={save} disabled={busy || !!rec || (tab !== "tts" && !clip) || (tab === "tts" && !text.trim())} className="rounded-full bg-coral px-5 py-2 text-sm font-bold text-white hover:bg-coral-dark disabled:opacity-50">
            {busy ? "…" : t.save}
          </button>
        </div>
      </div>
    </div>
  );
}
