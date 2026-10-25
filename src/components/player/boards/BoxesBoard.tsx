"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import type { PlayQuestion } from "@/lib/games/types";
import { plainText } from "@/lib/text/segments";
import { DoneScreen, QuestionView, VoiceDock } from "../parts";
import type { VoiceSession } from "../useVoiceSession";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
type State = "closed" | "correct" | "missed";

/**
 * Open the Box: each box hides a picture, word or question. Opening it plays the question and
 * the answer is checked like any other. Missed boxes can be reviewed at the end.
 */
export function BoxesBoard({ s, questions, exitHref }: { s: VoiceSession; questions: PlayQuestion[]; exitHref: string }) {
  const order = s.game.options.boxOrder as "free" | "sequential" | "random";
  const review = s.game.options.reviewIncorrect === true;
  const [state, setState] = useState<Record<string, State>>(() => Object.fromEntries(questions.map((q) => [q.id, q.id in s.results ? (s.results[q.id] === null ? "missed" : "correct") : "closed"])));
  const [open, setOpen] = useState<PlayQuestion | null>(null);
  const [reviewing, setReviewing] = useState(false);
  const live = useRef(true);

  useEffect(() => {
    live.current = true;
    return () => {
      live.current = false;
      s.stopAll();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const closed = questions.filter((q) => state[q.id] === "closed");
  const missed = questions.filter((q) => state[q.id] === "missed");
  const allOpened = closed.length === 0;

  useEffect(() => {
    // The review round finishes by itself (runReview).
    if (allOpened && !open && !reviewing && (!review || missed.length === 0) && s.phase !== "done") s.finish();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allOpened, open, missed.length]);

  async function openBox(q: PlayQuestion) {
    if (open) return;
    setOpen(q);
    await sleep(450); // lid animation
    const r = await s.ask(q);
    if (!live.current || r === "aborted") return;
    const ok = r !== null && r !== "skipped";
    s.record(q.id, ok ? r : null);
    setState((st) => ({ ...st, [q.id]: ok ? "correct" : "missed" }));
    await sleep(900);
    setOpen(null);
    s.setFeedback(null);
  }

  async function runReview() {
    setReviewing(true);
    for (const q of missed) {
      setState((st) => ({ ...st, [q.id]: "closed" }));
    }
    for (const q of missed) {
      if (!live.current) return;
      await openBox(q);
    }
    if (live.current) await s.finish();
  }

  if (s.phase === "done") return <DoneScreen s={s} exitHref={exitHref} />;

  if (open) {
    return (
      <div className="flex w-full flex-1 flex-col items-center">
        <div className="animate-pop-in mt-2 flex flex-col items-center">
          <span className="rounded-full bg-sun px-4 py-1 font-display text-lg font-semibold text-ink">Box {questions.indexOf(open) + 1}</span>
          {open.displayText && <p className="mt-3 font-display text-3xl font-semibold">{plainText(open.displayText)}</p>}
        </div>
        <QuestionView s={s} q={open} />
        <VoiceDock s={s} />
      </div>
    );
  }

  if (allOpened && review && missed.length > 0 && !reviewing) {
    return (
      <div className="animate-pop-in my-auto text-center">
        <p className="font-display text-4xl font-semibold">¡Abriste todas las cajas!</p>
        <p className="mt-2 text-ink-2">{missed.length} {missed.length === 1 ? "box" : "boxes"} to review.</p>
        <div className="mt-6 flex justify-center gap-3">
          <Button variant="voice" size="lg" onClick={runReview}>Review missed boxes</Button>
          <Button variant="secondary" size="lg" onClick={() => s.finish()}>Finish</Button>
        </div>
      </div>
    );
  }

  const nextSequential = closed[0];
  return (
    <div className="flex w-full flex-1 flex-col items-center">
      <p className="mt-1 text-sm font-bold text-muted">
        {order === "sequential" ? "Open the boxes in order." : order === "random" ? "Open a surprise box." : "Choose a box."}
      </p>
      <div className="mt-4 grid w-full max-w-3xl grid-cols-3 gap-3 sm:grid-cols-4">
        {questions.map((q, i) => {
          const st = state[q.id];
          const can = st === "closed" && (order === "free" || (order === "sequential" && q === nextSequential));
          return (
            <button
              key={q.id}
              type="button"
              disabled={!can}
              onClick={() => openBox(q)}
              aria-label={`Box ${i + 1}${st === "correct" ? ", answered" : st === "missed" ? ", missed" : ""}`}
              className={`group relative aspect-square rounded-2xl border-2 font-display text-3xl font-semibold transition ${
                st === "correct" ? "border-leaf/40 bg-leaf-soft text-leaf" : st === "missed" ? "border-coral/40 bg-coral-soft text-coral-dark" : can ? "border-[#c98a12] bg-sun text-ink shadow-soft hover:-translate-y-1" : "border-line bg-paper-2 text-muted"
              }`}
            >
              {st === "closed" && <span className="absolute inset-x-2 top-2 h-3 rounded-full bg-black/10 transition group-hover:-translate-y-1" aria-hidden="true" />}
              {st === "correct" ? "✓" : st === "missed" ? "↺" : i + 1}
            </button>
          );
        })}
      </div>
      {order === "random" && closed.length > 0 && (
        <Button variant="voice" size="lg" className="mt-6" onClick={() => openBox(closed[Math.floor(Math.random() * closed.length)])}>
          Open a random box
        </Button>
      )}
      <VoiceDock s={s} showControls={false} />
    </div>
  );
}
