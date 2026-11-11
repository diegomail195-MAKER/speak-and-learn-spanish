"use client";

import type { ReactNode, RefObject } from "react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
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
      <header className="flex items-center gap-3 border-b border-line bg-card px-3 py-2.5 sm:px-6">
        <a href={exitHref} className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-3 text-sm font-bold text-muted hover:bg-paper-2 hover:text-ink" onClick={() => s.stopMic()}>
          <Icon name="close" size={18} /> <span className="sr-only sm:not-sr-only">Exit</span>
        </a>
        <ProgressTrack questions={questions} results={s.results} title={s.game.title} />
        <button onClick={toggleFullscreen} className="inline-grid min-h-11 min-w-11 place-items-center rounded-lg text-muted hover:bg-paper-2 hover:text-ink" aria-label="Full screen">
          <Icon name="expand" size={20} />
        </button>
      </header>
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center px-4 pb-6 sm:px-6">{children}</main>
      {diagnostics && <DiagnosticsPanel s={s} />}
    </div>
  );
}

/**
 * What am I learning + how far along am I. One segment per item; finished segments carry a mark
 * (not only a colour): ✓ on my own, • with help, ↻ to practise. The count is always written out.
 */
function ProgressTrack({ questions, results, title }: { questions: PlayQuestion[]; results: VoiceSession["results"]; title: string }) {
  const done = questions.filter((q) => results[q.id] !== undefined).length;
  return (
    <div className="flex min-w-0 flex-1 flex-col items-center gap-1">
      <p className="max-w-full truncate text-xs font-bold uppercase tracking-[0.14em] text-muted">{title}</p>
      <div className="flex w-full max-w-md items-center gap-2.5">
        <div className="flex flex-1 gap-1" aria-hidden="true">
          {questions.map((q) => {
            const r = results[q.id];
            const tone = r === undefined ? "bg-paper-2 border-line-strong/50" : r === "NONE" ? "bg-leaf border-leaf" : r === null ? "bg-coral-soft border-coral/50" : "bg-sun border-sun-ink/30";
            return <span key={q.id} className={`h-2.5 min-w-1.5 flex-1 rounded-full border transition-colors duration-300 ${tone}`} />;
          })}
        </div>
        <span className="font-display text-sm font-bold tabular-nums text-ink" aria-label={`${done} of ${questions.length} done`}>
          {done}/{questions.length}
        </span>
      </div>
    </div>
  );
}

export function StartScreen({ s, onStart, preview, withMic }: { s: VoiceSession; onStart: () => void; preview: boolean; withMic: boolean }) {
  const { game, micState, error } = s;
  return (
    <div className="animate-rise-in my-auto w-full max-w-lg text-center">
      {preview && <p className="mb-3 inline-block rounded-full bg-sky-soft px-3 py-1 text-xs font-bold text-sky">Teacher preview — answers are not saved</p>}
      <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">{game.title}</h1>
      {game.instructions && (
        <p className="mx-auto mt-4 max-w-md rounded-xl border-l-4 border-coral-bright bg-card px-4 py-3 text-left text-lg text-ink-2">{plainText(game.instructions)}</p>
      )}
      <p className="mt-5 flex items-center justify-center gap-2 text-sm text-muted">
        <span className="rounded-full bg-indigo-soft px-2.5 py-0.5 font-bold text-indigo">
          {game.questions.length} {game.questions.length === 1 ? "item" : "items"}
        </span>
        <span className="text-left">{withMic ? "You'll answer out loud. The microphone listens only during this activity." : "You'll answer by typing or moving labels."}</span>
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
      <Button variant="voice" size="lg" className="mt-8 min-h-16 px-10 text-xl" onClick={onStart} disabled={micState === "requesting"}>
        {micState === "requesting" ? (
          "Allow the microphone…"
        ) : (
          <>
            {withMic && <Icon name="mic" size={24} />}
            Start
          </>
        )}
      </Button>
    </div>
  );
}

/**
 * Feedback is told three ways: words, a mark and a colour. Correct lands like a stamp; "try again"
 * and "I didn't hear you" simply appear (no shaking, nothing that singles the child out).
 */
const FEEDBACK_STYLE = {
  good: { box: "bg-leaf text-white border-ink shadow-[3px_3px_0_var(--color-ink)] animate-stamp", icon: "check", mark: "bg-white text-leaf" },
  retry: { box: "bg-sun-soft text-sun-ink border-sun-ink/30 animate-pop-in", icon: "retry", mark: "bg-sun text-ink" },
  unsure: { box: "bg-sky-soft text-sky border-sky/30 animate-pop-in", icon: "ear", mark: "bg-white text-sky" },
  info: { box: "bg-paper-2 text-ink-2 border-line animate-pop-in", icon: "hint", mark: "bg-white text-ink-2" },
} as const;

export function FeedbackBubble({ feedback }: { feedback: Feedback }) {
  if (!feedback) return <div className="h-14" />;
  const st = FEEDBACK_STYLE[feedback.tone];
  return (
    <div key={feedback.text + (feedback.model ?? "")} className={`flex items-center gap-3 rounded-2xl border-2 px-4 py-2.5 font-display text-2xl font-bold ${st.box}`} role="status" aria-live="polite">
      <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${st.mark}`}>
        <Icon name={st.icon} size={22} strokeWidth={feedback.tone === "good" ? 3 : 2.4} />
      </span>
      <span className="text-left">
        {feedback.text}
        {feedback.model && <span className="block text-lg font-medium">“{feedback.model}”</span>}
      </span>
    </div>
  );
}

export function MicIndicator({ phase, micState, level }: { phase: Phase; micState: MicState; level: number }) {
  const listening = micState === "listening" || micState === "hearing";
  const label = phase === "speaking" || phase === "intro" ? "Escucha…" : (MIC_LABEL[micState] ?? "");
  const thinking = micState === "processing";
  const appSpeaking = phase === "speaking" || phase === "intro";
  return (
    <div className={`flex items-center gap-3 rounded-2xl border-2 px-3 py-2 transition-colors ${listening ? "border-teal bg-teal-soft" : "border-line bg-card"}`} role="status" aria-live="polite">
      <span className={`relative grid h-11 w-11 place-items-center rounded-full ${listening ? "bg-teal text-white" : appSpeaking ? "bg-indigo-soft text-indigo" : "bg-paper-2 text-muted"}`}>
        {listening && <span className="absolute inset-0 rounded-full border-[3px] border-teal/40" style={{ transform: `scale(${1 + level * 0.7})`, transition: "transform 80ms linear" }} />}
        <Icon name={appSpeaking ? "speaker" : "mic"} size={22} className="relative" />
      </span>
      <span className="flex min-w-28 items-center gap-1.5 font-bold text-ink">
        {label}
        {thinking && (
          <span className="inline-flex gap-0.5" aria-hidden="true">
            <span className="think-dot h-1.5 w-1.5 rounded-full bg-ink-2" />
            <span className="think-dot h-1.5 w-1.5 rounded-full bg-ink-2" />
            <span className="think-dot h-1.5 w-1.5 rounded-full bg-ink-2" />
          </span>
        )}
      </span>
      {micState !== "stopped" && micState !== "idle" && (
        <span className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-teal-dark">
          <span className="h-2 w-2 rounded-full bg-teal" aria-hidden="true" />
          mic on
        </span>
      )}
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
            <Button variant="secondary" onClick={s.repeat} disabled={s.phase !== "listening"}><Icon name="speaker" /> Escuchar otra vez</Button>
            <Button variant="ghost" onClick={s.skip}>Siguiente <Icon name="next" size={18} /></Button>
            <Button variant="ghost" onClick={s.stopMic} aria-label="Stop the microphone"><Icon name="stop" size={14} /> Stop mic</Button>
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
        <div key={q.id} className={`animate-rise-in mt-3 w-full overflow-hidden rounded-2xl border-2 border-ink bg-card p-2.5 shadow-[4px_4px_0_var(--color-aqua)] ${compact ? "max-w-xs" : "max-w-lg"}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={q.imageUrl} alt={q.displayText || "Activity image"} className="mx-auto aspect-[4/3] w-full rounded-xl object-contain" />
        </div>
      )}
      {q.supportText && <p className="mt-5 text-center text-lg font-medium text-ink-2">{plainText(q.supportText)}</p>}
      {q.prompt && <h1 key={`p${q.id}`} className="animate-rise-in mt-2 text-center font-display text-4xl font-bold tracking-tight sm:text-5xl">{plainText(q.prompt)}</h1>}
      {!q.prompt && (showAnswer || s.game.settings.showAnswerText) && <h1 className="mt-5 text-center font-display text-4xl font-bold tracking-tight sm:text-5xl">{plainText(q.expected)}</h1>}
      {s.showHint && q.hint && <HintNote className="mt-3">{plainText(q.hint)}</HintNote>}
    </div>
  );
}

/** A hint: mango note with a bulb mark, clearly apart from the question and from feedback. */
export function HintNote({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <p className={`animate-pop-in inline-flex items-center gap-2 rounded-xl border-[1.5px] border-sun-ink/25 bg-sun-soft px-3.5 py-1.5 text-center font-semibold text-sun-ink ${className}`}>
      <Icon name="hint" size={18} />
      <span className="sr-only">Hint: </span>
      {children}
    </p>
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
        const tone = h ? (same(l, h) ? "bg-leaf-soft text-leaf border-leaf" : "bg-coral-soft text-coral-dark border-coral/50 border-dashed") : "bg-card text-muted border-line-strong/60";
        return (
          <span key={i} className={`grid h-14 w-12 place-items-center rounded-xl border-2 font-display text-2xl font-bold ${tone}`}>
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
    <div className="animate-rise-in my-auto text-center">
      <div className="relative mx-auto mb-4 h-20 w-24" aria-hidden="true">
        {[["left-0 top-6", "0ms", 22], ["left-9 top-0", "120ms", 34], ["right-0 top-5", "240ms", 24]].map(([pos, delay, size]) => (
          <span key={pos as string} className={`absolute ${pos} text-sun`}>
            <Icon name="star" size={size as number} className="text-sun" stroke="var(--color-ink)" />
            <span className="animate-star-rise absolute inset-0 text-sun" style={{ animationDelay: delay as string }}>
              <Icon name="star" size={(size as number) * 0.5} />
            </span>
          </span>
        ))}
      </div>
      <p className="font-display text-5xl font-bold tracking-tight">¡<span className="tilde-underline">Terminaste</span>!</p>
      <p className="mt-3 text-lg text-ink-2">{vals.length > 0 ? <>You answered <strong>{independent}</strong> of {vals.length} on your own.</> : "Activity finished."}</p>
      {s.usesMic && <p className="mt-1 text-sm text-muted">The microphone is off.</p>}
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        {extra}
        <a href={exitHref} className="press inline-flex min-h-14 items-center gap-2 rounded-xl border-2 border-ink bg-indigo px-7 text-lg font-bold text-white shadow-[2px_2px_0_var(--color-ink)] hover:bg-indigo-dark">Done</a>
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
          className="h-11 min-w-11 rounded-lg border-[1.5px] border-line-strong bg-card px-2 text-lg font-semibold hover:border-indigo hover:bg-indigo-soft active:translate-y-px"
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
