"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { preloadAudio, Speaker } from "@/lib/client/speaker";
import type { AudioLanguage, FaceAudio } from "@/lib/games/types";
import { AUDIO_LANGUAGE_LABELS } from "@/lib/tts/voices";
import type { TtsConfig } from "./AudioControl";
import { useUi } from "./i18n";
import { mediaSrc } from "./ImageField";
import { inputClass } from "@/components/ui/Field";
import { UiIcon } from "@/components/ui/icons";

const speaker = typeof window !== "undefined" ? new Speaker() : null;

const MAIN: AudioLanguage[] = ["es-419", "en-US", "fr-FR"];
const SHORT = (l: AudioLanguage) => (l === "es-419" ? "ES" : l.slice(0, 2).toUpperCase());

/** Languages offered in the Audio panel: Latin American Spanish, US English and French first. */
export function audioLanguages(tts: TtsConfig | null): AudioLanguage[] {
  const extra = (tts?.languages ?? []).filter((l) => !MAIN.includes(l));
  return [...MAIN, ...extra];
}

/**
 * The activity's default language voices and speed. The Audio panel starts from them and can
 * save its own choice as the new default (a card, face or question may still differ).
 */
export interface AudioDefaults {
  voices: Partial<Record<AudioLanguage, string>>;
  rate: number;
  set: (language: AudioLanguage, voice: string | null, rate: number) => void;
}
export const AudioDefaultsContext = createContext<AudioDefaults | null>(null);

/** Plays a face's audio: the saved file, or the text with a device voice of its language. */
export function playFaceAudio(a: { url?: string | null; mediaId?: string | null; text: string; language: AudioLanguage; rate?: number } | null | undefined, rate = 0.95) {
  if (!a) return Promise.resolve("none" as const);
  return speaker?.say(a.text, a.language, a.url ?? mediaSrc(a.mediaId), a.rate ?? rate) ?? Promise.resolve("none" as const);
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

/** Asks the server for natural speech (reused from the cache when text, voice and speed match). */
async function requestTts(body: { text: string; language: AudioLanguage; voice?: string; rate: number; regenerate?: boolean }) {
  const res = await fetch("/api/tts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.message ?? json.error ?? `Error ${res.status}`);
  return json as { mediaId: string; url: string; voice: string; cached: boolean };
}

const SAMPLE: Partial<Record<AudioLanguage, string>> = {
  "es-419": "¡Hola! ¿Cuál es tu color favorito?",
  "en-US": "Hi there! What is your favorite color?",
  "fr-FR": "Bonjour ! Quelle est ta couleur préférée ?",
  "pt-BR": "Olá! Qual é a sua cor favorita?",
  "it-IT": "Ciao! Qual è il tuo colore preferito?",
  "de-DE": "Hallo! Was ist deine Lieblingsfarbe?",
  "zh-CN": "你好！你最喜欢什么颜色？",
  "ja-JP": "こんにちは！好きな色は何ですか？",
  "ko-KR": "안녕하세요! 가장 좋아하는 색은 무엇인가요?",
};

/**
 * "Audio" button for a card face or an item: generate natural speech from text (its own
 * language, voice and speed; the words read aloud can differ from the visible text), record
 * with the microphone, or upload a file. The microphone is only requested to record.
 */
export function AudioField({
  audio,
  onChange,
  defaultText,
  defaultLanguage,
  tts,
  rate = 0.95,
  label,
  inline,
}: {
  audio: FaceAudio | null | undefined;
  onChange: (a: FaceAudio | null) => void;
  defaultText: string;
  defaultLanguage: AudioLanguage;
  tts: TtsConfig | null;
  rate?: number;
  label?: string;
  /** Compact, to sit inside a one-line field. */
  inline?: boolean;
}) {
  const { t } = useUi();
  const [open, setOpen] = useState(false);
  const has = !!audio && (!!audio.mediaId || !!audio.text.trim());
  return (
    <div className="relative flex min-w-0 max-w-full flex-wrap items-center gap-1">
      {has ? (
        <>
          <button type="button" onClick={() => playFaceAudio(audio, rate)} className="inline-flex h-11 items-center gap-1 rounded-ctl bg-teal-soft px-3 text-xs font-bold text-teal-dark hover:bg-teal hover:text-white" title={audio!.text || audio!.name || t.play} aria-label={`${t.play}${label ? ` (${label})` : ""}`}>
            ▶ <span className={`${inline ? "max-w-16" : "max-w-28"} truncate`}>{audio!.text || audio!.name || (audio!.source === "record" ? "🎙" : "♪")}</span> <span className="opacity-70">{SHORT(audio!.language)}</span>
          </button>
          <button type="button" onClick={() => setOpen(true)} className="grid h-11 w-11 place-items-center rounded-ctl text-sm font-bold text-muted hover:bg-paper-2 hover:text-ink" aria-label={`${t.replace}: ${t.addAudio}${label ? ` (${label})` : ""}`} title={t.edit}>✎</button>
          <button type="button" onClick={() => onChange(null)} className="grid h-11 w-11 place-items-center rounded-ctl text-base font-bold text-muted hover:bg-coral-soft hover:text-coral-dark" aria-label={`${t.remove}: ${t.addAudio}${label ? ` (${label})` : ""}`}>×</button>
        </>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={`inline-flex h-11 shrink-0 items-center gap-1.5 rounded-ctl bg-paper-2 text-xs font-bold text-ink-2 hover:bg-sky-soft hover:text-sky ${inline ? "px-2.5" : "px-3"}`}
          aria-label={`${t.addAudio}${label ? ` (${label})` : ""}`}
          title={t.addAudio}
          data-testid="audio-button"
        >
          <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5 6 9H3v6h3l5 4z" /><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" /></svg>
          {t.addAudio}
        </button>
      )}
      {open && <AudioPanel audio={audio} defaultText={defaultText} defaultLanguage={defaultLanguage} tts={tts} rate={rate} onClose={() => setOpen(false)} onSave={(a) => (onChange(a), setOpen(false))} />}
    </div>
  );
}

const RATE_STEPS = [0.8, 0.9, 1, 1.1];

function AudioPanel({ audio, defaultText, defaultLanguage, tts, rate: activityRate, onClose, onSave }: { audio: FaceAudio | null | undefined; defaultText: string; defaultLanguage: AudioLanguage; tts: TtsConfig | null; rate: number; onClose: () => void; onSave: (a: FaceAudio) => void }) {
  const { t, lang: ui } = useUi();
  const defaults = useContext(AudioDefaultsContext);
  const natural = !!tts?.provider;
  const [tab, setTab] = useState<"record" | "upload" | "tts">(audio?.source === "record" ? "record" : audio?.source === "upload" ? "upload" : "tts");
  const [language, setLanguage] = useState<AudioLanguage>(audio?.language ?? defaultLanguage);
  const [text, setText] = useState(audio?.text || defaultText);
  const allVoices = tts?.voices ?? [];
  const voicesOf = (l: AudioLanguage) => {
    const v = allVoices.filter((x) => x.language === l);
    return [...v.filter((x) => x.recommended), ...v.filter((x) => !x.recommended)];
  };
  const defaultVoiceFor = (l: AudioLanguage) => {
    const list = voicesOf(l);
    const d = defaults?.voices[l];
    return list.find((v) => v.id === d)?.id ?? list[0]?.id ?? "";
  };
  const [voice, setVoice] = useState<string>(() => (audio?.voice && voicesOf(audio.language).some((v) => v.id === audio.voice) ? audio.voice : defaultVoiceFor(audio?.language ?? defaultLanguage)));
  const [rate, setRate] = useState<number>(audio?.rate ?? defaults?.rate ?? activityRate);
  const [makeDefault, setMakeDefault] = useState(false);
  const [clip, setClip] = useState<{ blob: Blob; url: string; name: string; source: "record" | "upload" } | null>(null);
  const [generated, setGenerated] = useState<{ mediaId: string; url: string; key: string } | null>(null);
  const [sampling, setSampling] = useState<string | null>(null);
  const [rec, setRec] = useState<MediaRecorder | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [micBlocked, setMicBlocked] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const inflight = useRef<{ key: string; p: Promise<{ mediaId: string; url: string; key: string }> } | null>(null);
  const voices = voicesOf(language);
  const ttsKey = `${text.trim()}|${language}|${voice}|${rate.toFixed(2)}`;
  const savedKey = audio?.source === "tts" && audio.mediaId ? `${audio.text.trim()}|${audio.language}|${audio.voice ?? ""}|${(audio.rate ?? activityRate).toFixed(2)}` : null;
  const changed = !!savedKey && savedKey !== ttsKey;
  const languages = audioLanguages(tts);

  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    return () => {
      window.removeEventListener("keydown", esc);
      rec?.stream.getTracks().forEach((tr) => tr.stop());
      speaker?.stop();
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

  /** Generates (or reuses) the audio for the current text, language, voice and speed. */
  async function ensureGenerated(regenerate = false) {
    if (!regenerate && generated?.key === ttsKey) return generated;
    if (!regenerate && savedKey === ttsKey && audio?.mediaId) return { mediaId: audio.mediaId, url: mediaSrc(audio.mediaId)!, key: ttsKey };
    // One request per text/voice/speed: Listen or Save while the early generation is still
    // running waits for it instead of asking twice.
    const key = ttsKey;
    if (!regenerate && inflight.current?.key === key) return inflight.current.p;
    const p = requestTts({ text: text.trim(), language, voice: voice || undefined, rate, regenerate }).then((json) => {
      const g = { mediaId: json.mediaId, url: json.url, key };
      setGenerated(g);
      preloadAudio([json.url]);
      return g;
    });
    inflight.current = { key, p };
    p.catch(() => inflight.current?.p === p && (inflight.current = null));
    return p;
  }

  // Start generating as soon as the panel opens (and after the text, voice or speed settle), so
  // Listen and Save are usually instant.
  useEffect(() => {
    if (!natural || tab !== "tts" || !text.trim() || savedKey === ttsKey || generated?.key === ttsKey) return;
    const t = setTimeout(() => void ensureGenerated().catch(() => {}), 700);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ttsKey, natural, tab]);

  async function previewTts(regenerate = false) {
    setError("");
    speaker?.unlock();
    if (!text.trim()) return;
    if (!natural) return playFaceAudio({ text, language, rate });
    setBusy(true);
    try {
      const g = await ensureGenerated(regenerate);
      await playFaceAudio({ url: g.url, text, language });
    } catch (e) {
      setError((e as Error).message || t.voiceError);
    } finally {
      setBusy(false);
    }
  }

  /** ▶ next to a voice: this voice reading the text (or a short sample sentence). */
  async function sampleVoice(id: string) {
    setError("");
    speaker?.unlock();
    setSampling(id);
    try {
      const sampleText = text.trim() || SAMPLE[language] || "";
      const json = await requestTts({ text: sampleText, language, voice: id, rate });
      if (sampleText === text.trim() && id === voice) setGenerated({ mediaId: json.mediaId, url: json.url, key: ttsKey });
      await playFaceAudio({ url: json.url, text: sampleText, language });
    } catch (e) {
      setError((e as Error).message || t.voiceError);
    } finally {
      setSampling(null);
    }
  }

  async function save() {
    setError("");
    setBusy(true);
    try {
      if (tab === "tts") {
        if (!text.trim()) throw new Error(t.ttsText);
        if (natural) {
          const g = await ensureGenerated();
          onSave({ mediaId: g.mediaId, text: text.trim(), language, voice: voice || null, rate, source: "tts" });
        } else {
          onSave({ mediaId: null, text: text.trim(), language, voice: null, rate, source: "browser" });
        }
        if (makeDefault) defaults?.set(language, natural ? voice || null : null, rate);
      } else {
        if (!clip) throw new Error(tab === "record" ? t.record : t.uploadAudio);
        const up = await uploadAudio(clip.blob, clip.name);
        onSave({ mediaId: up.id, text: "", language, source: clip.source, name: clip.source === "upload" ? clip.name : undefined });
      }
    } catch (e) {
      setError((e as Error).message || t.voiceError);
    } finally {
      setBusy(false);
    }
  }

  const tabs = [
    ["tts", `🗣 ${t.tts}`],
    ["record", `🎙 ${t.record}`],
    ["upload", `⬆ ${t.uploadAudio}`],
  ] as const;
  const rateLabel = (r: number) => (r <= 0.8 ? t.slow : r >= 1.1 ? t.fast : r === 1 ? t.normal : `${r.toFixed(1)}×`);
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/40 p-3 sm:p-10" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-label={t.addAudio} className="w-full max-w-lg overflow-hidden rounded-xl2 bg-card shadow-soft" data-testid="audio-panel">
        <div className="flex items-center border-b border-line px-4 py-3">
          <h2 className="font-display text-lg font-semibold">{t.addAudio}</h2>
          <button type="button" onClick={onClose} className="ml-auto grid h-11 w-11 place-items-center rounded-ctl text-muted hover:bg-paper-2 hover:text-ink" aria-label={t.close}><UiIcon name="x" /></button>
        </div>
        <div className="flex gap-1 bg-paper-2 p-1 text-sm font-bold" role="tablist">
          {tabs.map(([k, l]) => (
            <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => (setTab(k), setClip(null), setError(""))} className={`min-h-10 flex-1 rounded-lg px-2 py-1 leading-tight ${tab === k ? "bg-card text-ink shadow-sm" : "text-muted"}`}>
              {l}
            </button>
          ))}
        </div>
        <div className="space-y-3 p-4 text-sm">
          {tab === "tts" && (
            <label className="block">
              <span className="mb-1 block text-xs font-bold text-ink-2">{t.ttsText} <span className="font-normal text-muted">— {t.ttsHint}</span></span>
              <textarea value={text} onChange={(e) => setText(e.target.value)} maxLength={300} rows={2} placeholder={language === "en-US" ? "red" : language === "fr-FR" ? "rouge" : "rojo"} className={`${inputClass} resize-y`} lang={language} data-testid="tts-text" />
            </label>
          )}
          <label className="block">
            <span className="mb-1 block text-xs font-bold text-ink-2">{t.language}</span>
            <select value={language} onChange={(e) => { const l = e.target.value as AudioLanguage; setLanguage(l); setVoice(defaultVoiceFor(l)); }} className={inputClass} data-testid="tts-language">
              {languages.map((l) => <option key={l} value={l}>{ui === "es" ? AUDIO_LANGUAGE_LABELS[l].es : AUDIO_LANGUAGE_LABELS[l].en}</option>)}
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
              {natural ? (
                <fieldset>
                  <legend className="mb-1 block text-xs font-bold text-ink-2">{t.voice}</legend>
                  <div className="max-h-48 space-y-1 overflow-y-auto rounded-xl border border-line p-1" role="radiogroup" aria-label={t.voice}>
                    {voices.map((v) => (
                      <div key={v.id} className={`flex items-center gap-2 rounded-lg px-2 py-1.5 ${voice === v.id ? "bg-teal-soft" : "hover:bg-paper-2"}`}>
                        <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2">
                          <input type="radio" name="tts-voice" value={v.id} checked={voice === v.id} onChange={() => setVoice(v.id)} className="accent-teal" />
                          <span className="min-w-0">
                            <span className="font-bold">{v.label}</span>
                            {v.recommended && <span className="ml-1.5 rounded-full bg-sun-soft px-1.5 text-[10px] font-bold uppercase text-[#7a5200]">{t.recommended}</span>}
                            {defaults?.voices[language] === v.id && <span className="ml-1.5 rounded-full bg-sky-soft px-1.5 text-[10px] font-bold uppercase text-sky">{t.defaultSet}</span>}
                            {v.description && <span className="block truncate text-xs text-muted">{v.description}</span>}
                          </span>
                        </label>
                        <button type="button" onClick={() => sampleVoice(v.id)} disabled={!!sampling} className="grid h-11 w-11 shrink-0 place-items-center rounded-ctl border border-line bg-card text-teal-dark hover:bg-teal hover:text-white disabled:opacity-50" aria-label={`${t.sample}: ${v.label}`} title={t.sample}>
                          {sampling === v.id ? "…" : "▶"}
                        </button>
                      </div>
                    ))}
                    {!voices.length && <p className="p-2 text-xs text-muted">—</p>}
                  </div>
                </fieldset>
              ) : (
                <p className="rounded-lg bg-paper-2 p-2 text-xs text-ink-2">{t.ttsDevice}</p>
              )}
              <div>
                <span className="mb-1 block text-xs font-bold text-ink-2">{t.speed}</span>
                <div className="flex gap-1" role="radiogroup" aria-label={t.speed}>
                  {RATE_STEPS.map((r) => (
                    <button key={r} type="button" role="radio" aria-checked={Math.abs(rate - r) < 0.001} onClick={() => setRate(r)} className={`h-control flex-1 rounded-ctl border text-xs font-bold ${Math.abs(rate - r) < 0.001 ? "border-teal bg-teal text-white" : "border-line bg-card text-ink-2 hover:bg-paper-2"}`}>
                      {rateLabel(r)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button type="button" onClick={() => previewTts(false)} disabled={busy || !text.trim()} className="rounded-full bg-paper-2 px-4 py-2 font-bold text-ink-2 hover:bg-line disabled:opacity-50" data-testid="tts-listen">
                  {busy ? t.generating : `▶ ${t.listen}`}
                </button>
                {natural && (savedKey === ttsKey || generated?.key === ttsKey) && (
                  <button type="button" onClick={() => previewTts(true)} disabled={busy} className="rounded-full px-3 py-2 text-xs font-bold text-muted hover:bg-paper-2 hover:text-ink disabled:opacity-50">↻ {t.regenerate}</button>
                )}
              </div>
              {changed && <p className="rounded-lg bg-sun-soft px-2 py-1.5 text-xs font-semibold text-[#7a5200]">{t.changedRegen}</p>}
              {defaults && (
                <label className="flex items-start gap-2 text-xs text-ink-2">
                  <input type="checkbox" className="mt-0.5 accent-teal" checked={makeDefault} onChange={(e) => setMakeDefault(e.target.checked)} />
                  {t.makeDefault}
                </label>
              )}
            </>
          )}
          {error && (
            <p className="flex flex-wrap items-center gap-2 font-semibold text-coral-dark" role="alert">
              {error}
              {tab === "tts" && (
                <button type="button" onClick={() => previewTts(false)} className="rounded-full bg-coral-soft px-3 py-1 text-xs font-bold text-coral-dark hover:bg-coral hover:text-white">{t.retry}</button>
              )}
            </p>
          )}
        </div>
        <div className="flex justify-end gap-2 border-t border-line px-4 py-3">
          <button type="button" onClick={onClose} className="rounded-full px-4 py-2 text-sm font-bold text-ink-2 hover:bg-paper-2">{t.cancel}</button>
          <button type="button" onClick={save} disabled={busy || !!rec || (tab !== "tts" && !clip) || (tab === "tts" && !text.trim())} className="rounded-full bg-coral px-5 py-2 text-sm font-bold text-white hover:bg-coral-dark disabled:opacity-50" data-testid="audio-save">
            {busy ? "…" : t.save}
          </button>
        </div>
      </div>
    </div>
  );
}
