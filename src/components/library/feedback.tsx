"use client";

// Montessori Intelligent Feedback Engine for the library games (Memory, Picture Match, Listen &
// Find, Quiz). Pages provide the admin settings (and, for students, a reporter that saves the
// items answered); without a provider the games keep their original messages.
import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { MontessoriConfig } from "@/lib/montessori/config";
import { FeedbackEngine, linesFor } from "@/lib/montessori/engine";
import { nounFor } from "@/lib/montessori/nouns";
import type { ActivityType, FeedbackDecision, Support } from "@/lib/montessori/types";

export interface LearnedItem {
  /** Spanish word/phrase (checked against the activity's content on the server). */
  label: string;
  result: Support | null;
}

interface Ctx {
  config: MontessoriConfig;
  topic: string;
  report?: (items: LearnedItem[]) => void;
}

const LibraryFeedbackContext = createContext<Ctx | null>(null);

export function LibraryFeedbackProvider({ config, topic, report, children }: Ctx & { children: ReactNode }) {
  const value = useMemo(() => ({ config, topic, report }), [config, topic, report]);
  return <LibraryFeedbackContext.Provider value={value}>{children}</LibraryFeedbackContext.Provider>;
}

/** One engine per game run (null when no provider, or the activity type is switched off). */
export function useLibraryEngine(activityType: ActivityType, title = "", run = 0) {
  const ctx = useContext(LibraryFeedbackContext);
  const engine = useMemo(() => {
    if (!ctx) return null;
    const e = new FeedbackEngine({ config: ctx.config, activityType, noun: nounFor({ topic: ctx.topic, title, activityType }), targetIsSpanish: true });
    return e.enabled ? e : null;
    // A new run (Play again / practice) gets a fresh engine.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctx, activityType, title, run]);
  return { engine, config: ctx?.config ?? null, report: ctx?.report };
}

function sayLines(lines: Array<{ lang: "en" | "es"; text: string }>) {
  if (typeof speechSynthesis === "undefined") return;
  speechSynthesis.cancel();
  for (const l of lines) {
    const u = new SpeechSynthesisUtterance(l.text);
    u.lang = l.lang === "es" ? "es-MX" : "en-US";
    u.rate = 0.95;
    speechSynthesis.speak(u);
  }
}

/** Speaks a decision when narration is on (used for inline answers). */
export function narrate(d: FeedbackDecision | null, config: MontessoriConfig | null) {
  if (!d || !config || d.display === "silent" || !config.autoNarration) return;
  sayLines(linesFor(d, config).say);
}

/** Bilingual feedback lines with a 🔊 button (always available, even with narration off). */
export function FeedbackLines({ d, config, big = false }: { d: FeedbackDecision; config: MontessoriConfig; big?: boolean }) {
  if (d.display === "silent") return null;
  const { show, say } = linesFor(d, config);
  return (
    <div data-feedback-id={d.id} className="text-center">
      {show.map((l, i) => (
        <p key={l.lang} lang={l.lang} className={i === 0 ? `font-display ${big ? "text-3xl" : "text-2xl"} font-extrabold` : "mt-0.5 text-lg font-semibold text-ink-2"}>{l.text}</p>
      ))}
      {d.model && <p className="mt-1 font-display text-xl font-bold">“{d.model}”</p>}
      <button type="button" onClick={() => sayLines(say.length ? say : show)} className="mt-2 rounded-full bg-paper-2 px-3 py-1 text-sm font-bold text-ink-2" aria-label="Listen to the message">🔊 Listen</button>
    </div>
  );
}
