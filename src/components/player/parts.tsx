"use client";

import type { ReactNode, RefObject } from "react";
import { Button } from "@/components/ui/Button";
import type { MicState } from "@/lib/client/mic-session";
import type { PlayGame, PlayQuestion } from "@/lib/games/types";
import { lettersOf } from "@/lib/speech/letters";
import { plainText } from "@/lib/text/segments";
import type { Feedback, Phase, Support, VoiceSession } from "./useVoiceSession";

const MIC_LABEL: Partial<Record<MicState, string>> = {
  listening: "Te escucho…",
  hearing: "Te escucho…",
  processing: "Pensando…",
  ready: "Micrófono listo",
  paused: "Micrófono en pausa",
  suspended: "Micrófono interrumpido",
};

export function PlayerFrame({ s, exitHref, rootRef, children, order, diagnostics }: { s: VoiceSession; exitHref: string; rootRef: RefObject<HTMLDivElement | null>; children: ReactNode; order?: PlayQuestion[]; diagnostics?: boolean }) {
  const questions = order ?? s.game.questions;
  function toggleFullscreen() {
    if (document.fullscreenElement) document.exitFullscreen();
    else rootRef.current?.requestFullscreen?.().catch(() => undefined);
  }
  return (
    <div ref={rootRef} className="flex min-h-dvh flex-col bg-paper">
      <header className="flex items-center gap-3 px-4 py-3 sm:px-6">
        <a href={exitHref} className="rounded-full px-3 py-2 text-sm font-bold text-muted hover:bg-paper-2 hover:text-ink" onClick={() => s.stopMic()}>
          ✕ <span className="sr-only sm:not-sr-only">Exit</span>
        </a>
        <div className="flex flex-1 flex-wrap items-center justify-center gap-1.5" aria-label={`${Object.keys(s.results).length} of ${questions.length} done`}>
          {questions.map((q) => {
            const r = s.results[q.id];
            return <span key={q.id} className={`h-2.5 w-2.5 rounded-full ${r === undefined ? "bg-line" : r === "NONE" ? "bg-leaf" : r === null ? "bg-coral/60" : "bg-sun"}`} />;
          })}
        </div>
        <button onClick={toggleFullscreen} className="rounded-full px-3 py-2 text-sm font-bold text-muted hover:bg-paper-2 hover:text-ink" aria-label="Full screen">
          ⛶
        </button>
      </header>
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center px-4 pb-6 sm:px-6">{children}</main>
      {diagnostics && <DiagnosticsPanel s={s} />}
    </div>
  );
}

export function StartScreen({ s, onStart, preview, withMic }: { s: VoiceSession; onStart: () => void; preview: boolean; withMic: boolean }) {
  const { game, micState, error } = s;
  return (
    <div className="my-auto max-w-md text-center">
      {preview && <p className="mb-3 inline-block rounded-full bg-sky-soft px-3 py-1 text-xs font-bold text-sky">Teacher preview — answers are not saved</p>}
      <h1 className="font-display text-4xl font-semibold">{game.title}</h1>
      {game.instructions && <p className="mt-2 text-lg text-ink-2">{plainText(game.instructions)}</p>}
      <p className="mt-4 text-sm text-muted">
        {game.questions.length} {game.questions.length === 1 ? "item" : "items"} ·{" "}
        {withMic ? "You'll answer out loud. The microphone listens only during this activity." : "You'll answer by typing or moving labels."}
      </p>
      {micState === "denied" ? (
        <div className="mt-6 rounded-xl2 bg-coral-soft p-4 text-left text-sm text-coral-dark">
          <p className="font-bold">The microphone is blocked.</p>
          <p className="mt-1">Click the lock icon next to the web address, set Microphone to “Allow”, then press Start again.</p>
        </div>
      ) : micState === "unavailable" ? (
        <p className="mt-6 rounded-xl2 bg-coral-soft p-4 text-sm text-coral-dark">No microphone was found. Plug one in or check the device settings.</p>
      ) : null}
      {error && <p className="mt-6 rounded-xl2 bg-coral-soft p-4 text-sm text-coral-dark">{error}</p>}
      <Button variant="voice" size="lg" className="mt-8 h-16 px-10 text-xl" onClick={onStart} disabled={micState === "requesting"}>
        {micState === "requesting" ? "Allow the microphone…" : withMic ? "🎤 Start" : "Start"}
      </Button>
    </div>
  );
}

export function FeedbackBubble({ feedback }: { feedback: Feedback }) {
  if (!feedback) return <div className="h-14" />;
  const tone = { good: "bg-leaf text-white", retry: "bg-sun-soft text-[#6b4700]", unsure: "bg-sky-soft text-sky", info: "bg-paper-2 text-ink-2" }[feedback.tone];
  return (
    <div key={feedback.text + (feedback.model ?? "")} className={`animate-pop-in rounded-2xl px-5 py-3 text-center font-display text-2xl font-semibold ${tone}`} role="status" aria-live="polite">
      {feedback.text}
      {feedback.model && <span className="mt-1 block text-lg font-medium">“{feedback.model}”</span>}
    </div>
  );
}

export function MicIndicator({ phase, micState, level }: { phase: Phase; micState: MicState; level: number }) {
  const listening = micState === "listening" || micState === "hearing";
  const label = phase === "speaking" || phase === "intro" ? "Escucha…" : (MIC_LABEL[micState] ?? "");
  return (
    <div className="flex items-center gap-3 rounded-full border border-line bg-card px-4 py-2" role="status" aria-live="polite">
      <span className={`relative grid h-10 w-10 place-items-center rounded-full ${listening ? "bg-teal text-white" : "bg-paper-2 text-muted"}`}>
        {listening && <span className="absolute inset-0 rounded-full bg-teal/30" style={{ transform: `scale(${1 + level * 0.8})`, transition: "transform 80ms linear" }} />}
        <svg viewBox="0 0 24 24" className="relative h-5 w-5" fill="currentColor" aria-hidden="true">
          <path d="M12 15a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v6a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-2.08A7 7 0 0 0 19 12z" />
        </svg>
      </span>
      <span className="min-w-28 font-bold text-ink-2">{label}</span>
      <span className="text-[11px] font-bold uppercase tracking-wider text-teal">{micState !== "stopped" && micState !== "idle" ? "● mic on" : ""}</span>
    </div>
  );
}

/** Feedback, microphone state, recovery prompts and the standard controls. */
export function VoiceDock({ s, children, showControls = true }: { s: VoiceSession; children?: ReactNode; showControls?: boolean }) {
  return (
    <div className="mt-auto flex w-full flex-col items-center gap-4 pt-6">
      <FeedbackBubble feedback={s.feedback} />
      {s.usesMic && <MicIndicator phase={s.phase} micState={s.micState} level={s.level} />}
      {s.phase === "suspended" && (
        <div className="text-center">
          <p className="mb-2 text-ink-2">The microphone stopped. Tap to continue.</p>
          <Button variant="voice" size="lg" onClick={s.resume}>Turn the microphone back on</Button>
        </div>
      )}
      {s.phase === "idle" && (
        <div className="text-center">
          <p className="mb-2 text-ink-2">¿Sigues ahí? (Are you still there?)</p>
          <Button variant="voice" size="lg" onClick={s.resume}>Continuar</Button>
        </div>
      )}
      {s.phase === "error" && (
        <div className="text-center">
          <p className="mb-2 font-semibold text-coral-dark">{s.error}</p>
          <Button variant="secondary" size="lg" onClick={s.resume}>Try again</Button>
        </div>
      )}
      <div className="flex flex-wrap justify-center gap-2">
        {children}
        {showControls && s.usesMic && (
          <>
            <Button variant="secondary" onClick={s.repeat} disabled={s.phase !== "listening"}>🔊 Escuchar otra vez</Button>
            <Button variant="ghost" onClick={s.skip}>Siguiente →</Button>
            <Button variant="ghost" onClick={s.stopMic} aria-label="Stop the microphone">■ Stop mic</Button>
          </>
        )}
      </div>
    </div>
  );
}

/** Picture, support line, question and hint of one question. */
export function QuestionView({ s, q, showAnswer, compact }: { s: VoiceSession; q: PlayQuestion; showAnswer?: boolean; compact?: boolean }) {
  return (
    <div className="flex w-full flex-col items-center">
      {q.imageUrl && (
        <div key={q.id} className={`animate-pop-in mt-2 w-full overflow-hidden rounded-[1.75rem] border border-line bg-card p-3 ${compact ? "max-w-xs" : "max-w-lg"}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={q.imageUrl} alt={q.displayText || "Activity image"} className="mx-auto aspect-[4/3] w-full rounded-2xl object-contain" />
        </div>
      )}
      {q.supportText && <p className="mt-5 text-center text-lg text-muted">{plainText(q.supportText)}</p>}
      {q.prompt && <h1 className="mt-2 text-center font-display text-4xl font-semibold tracking-tight sm:text-5xl">{plainText(q.prompt)}</h1>}
      {!q.prompt && (showAnswer || s.game.settings.showAnswerText) && <h1 className="mt-5 text-center font-display text-4xl font-semibold tracking-tight sm:text-5xl">{plainText(q.expected)}</h1>}
      {s.showHint && q.hint && <p className="mt-3 rounded-full bg-sun-soft px-4 py-1.5 text-center font-semibold text-[#7a5200]">💡 {plainText(q.hint)}</p>}
    </div>
  );
}

/** Letter boxes for spelling: filled as letters are heard; green when right. */
export function LetterTiles({ expected, heard, reveal }: { expected: string; heard: string[] | null; reveal?: boolean }) {
  const exp = lettersOf(expected);
  const same = (a?: string, b?: string) => !!a && !!b && (a === b || (a === "B" && b === "V") || (a === "V" && b === "B"));
  return (
    <div className="mt-4 flex flex-wrap justify-center gap-1.5" aria-label="Letters">
      {exp.map((l, i) => {
        const h = heard?.[i];
        const tone = h ? (same(l, h) ? "bg-leaf-soft text-leaf border-leaf/40" : "bg-coral-soft text-coral-dark border-coral/40") : "bg-card text-muted border-line";
        return (
          <span key={i} className={`grid h-14 w-12 place-items-center rounded-xl border-2 font-display text-2xl font-semibold ${tone}`}>
            {h ?? (reveal ? <span className="opacity-40">{l}</span> : "")}
          </span>
        );
      })}
      {heard && heard.length > exp.length && heard.slice(exp.length).map((l, i) => <span key={`x${i}`} className="grid h-14 w-12 place-items-center rounded-xl border-2 border-coral/40 bg-coral-soft font-display text-2xl text-coral-dark">{l}</span>)}
    </div>
  );
}

export function DoneScreen({ s, exitHref, extra }: { s: VoiceSession; exitHref: string; extra?: ReactNode }) {
  const vals = Object.values(s.results);
  const independent = vals.filter((r) => r === "NONE").length;
  return (
    <div className="animate-pop-in my-auto text-center">
      <p className="font-display text-5xl font-semibold">¡Terminaste!</p>
      <p className="mt-3 text-lg text-ink-2">{vals.length > 0 ? <>You answered <strong>{independent}</strong> of {vals.length} on your own.</> : "Activity finished."}</p>
      {s.usesMic && <p className="mt-1 text-sm text-muted">The microphone is off.</p>}
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        {extra}
        <a href={exitHref} className="inline-flex h-14 items-center rounded-full bg-coral px-7 text-lg font-bold text-white">Done</a>
      </div>
    </div>
  );
}

const FR_CHARS = ["à", "â", "æ", "ç", "è", "é", "ê", "ë", "î", "ï", "ô", "œ", "ù", "û", "ü", "ÿ"];
const ES_CHARS = ["á", "é", "í", "ó", "ú", "ü", "ñ", "Á", "É", "Í", "Ó", "Ú", "Ü", "Ñ", "¿", "¡"];

/** Special characters for students typing on US keyboards; inserts at the cursor. */
export function CharKeys({ target, language }: { target: RefObject<HTMLInputElement | null>; language: PlayGame["language"] }) {
  const chars = language === "fr-FR" ? FR_CHARS : language === "es-419" ? ES_CHARS : [];
  if (!chars.length) return null;
  return (
    <div className="flex flex-wrap justify-center gap-1" role="toolbar" aria-label="Special letters">
      {chars.map((c) => (
        <button
          key={c}
          type="button"
          tabIndex={-1}
          onMouseDown={(e) => {
            e.preventDefault();
            const el = target.current;
            if (!el) return;
            const a = el.selectionStart ?? el.value.length;
            const b = el.selectionEnd ?? a;
            el.setRangeText(c, a, b, "end");
            el.dispatchEvent(new Event("input", { bubbles: true }));
            el.focus();
          }}
          className="h-10 min-w-10 rounded-lg border border-line bg-card px-2 text-lg font-semibold hover:border-sky hover:bg-sky-soft"
          aria-label={`Insert ${c}`}
        >
          {c}
        </button>
      ))}
    </div>
  );
}

export function DiagnosticsPanel({ s }: { s: VoiceSession }) {
  const { diag, micState, game, supportLevel } = s;
  const engine = s.engineName;
  return (
    <details className="border-t border-line bg-card px-4 py-3 text-xs sm:px-6" open>
      <summary className="cursor-pointer font-bold text-ink-2">Teacher diagnostics</summary>
      <p className="mt-2 text-muted">
        Recognizer: <strong>{engine === "server" ? game.sttProvider : engine === "webspeech" ? "Chrome Web Speech API" : "—"}</strong> · Locales:{" "}
        <strong>{Object.entries(game.sttLocales).map(([k, v]) => `${k}→${v}`).join(", ")}</strong> · Mic: <strong>{micState}</strong> · Support now: <strong>{supportLevel}</strong>
      </p>
      <div className="mt-2 max-h-56 overflow-auto">
        <table className="w-full text-left">
          <thead className="text-muted">
            <tr>
              <th className="py-1 pr-3">Expected</th>
              <th className="pr-3">Answer (alternatives)</th>
              <th className="pr-3">Input</th>
              <th className="pr-3">Locale</th>
              <th className="pr-3">Conf.</th>
              <th className="pr-3">Result</th>
              <th className="pr-3">Reason</th>
              <th className="pr-3">Support</th>
              <th className="pr-3">Noise floor</th>
            </tr>
          </thead>
          <tbody>
            {diag.length === 0 && (
              <tr>
                <td colSpan={9} className="py-2 text-muted">No answers yet.</td>
              </tr>
            )}
            {diag.map((d) => (
              <tr key={d.at} className="border-t border-line align-top">
                <td className="py-1 pr-3">{d.expected}</td>
                <td className="pr-3">
                  <strong>{d.transcript || "—"}</strong>
                  {d.alternatives.length > 1 && <span className="block text-muted">{d.alternatives.slice(1).map((a) => a.text).join(" · ")}</span>}
                  {d.pronunciation && <span className="block text-muted">Pronunciation: {Math.round(d.pronunciation.overall)} (acc {Math.round(d.pronunciation.accuracy)}, flu {Math.round(d.pronunciation.fluency)})</span>}
                </td>
                <td className="pr-3">{d.input}</td>
                <td className="pr-3">{d.locale}</td>
                <td className="pr-3">{d.confidence != null ? d.confidence.toFixed(2) : "n/a"}</td>
                <td className={`pr-3 font-bold ${d.outcome === "CORRECT" ? "text-leaf" : d.outcome === "INCORRECT" ? "text-coral-dark" : "text-sky"}`}>{d.outcome}</td>
                <td className="pr-3">{d.reason}</td>
                <td className="pr-3">{d.support}</td>
                <td className="pr-3">{d.input === "voice" ? `${d.noiseFloorDb.toFixed(0)} dB` : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}

export const shuffled = <T,>(a: T[]) => {
  const x = [...a];
  for (let i = x.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [x[i], x[j]] = [x[j], x[i]];
  }
  return x;
};

export type { Support };
