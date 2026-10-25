"use client";

import { useEffect, useState } from "react";
import type { PlayQuestion } from "@/lib/games/types";
import { DoneScreen, LetterTiles, QuestionView, VoiceDock } from "../parts";
import type { VoiceSession } from "../useVoiceSession";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** One question after another (Image & Speak, Listen & Repeat, Question & Answer…). */
export function SequenceBoard({ s, questions, exitHref }: { s: VoiceSession; questions: PlayQuestion[]; exitHref: string }) {
  const [index, setIndex] = useState(() => Math.max(0, questions.findIndex((q) => !(q.id in s.results))));

  useEffect(() => {
    let live = true;
    (async () => {
      for (let i = index; i < questions.length && live; i++) {
        const q = questions[i];
        if (q.id in s.results) continue;
        setIndex(i);
        const r = await s.ask(q);
        if (r === "aborted" || !live) return;
        s.record(q.id, r === "skipped" ? null : r);
        await sleep(350);
      }
      if (live) await s.finish();
    })();
    return () => {
      live = false;
      s.stopAll();
    };
    // Runs once per mount; the session object is stable in behaviour.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (s.phase === "done") return <DoneScreen s={s} exitHref={exitHref} />;
  const q = questions[index];
  if (!q) return null;
  return (
    <div className="flex w-full flex-1 flex-col items-center">
      <QuestionView s={s} q={q} />
      {q.mode === "LETTERS" && s.heardLetters && <LetterTiles expected={q.expected} heard={s.heardLetters} />}
      <VoiceDock s={s} />
    </div>
  );
}
