"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import type { PlayQuestion } from "@/lib/games/types";
import { plainText } from "@/lib/text/segments";
import { DoneScreen, VoiceDock, shuffled } from "../parts";
import type { VoiceSession } from "../useVoiceSession";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Match & Speak: drag (or tap) each word onto its picture; after a correct match the student
 * says the word. The teacher decides whether saying it is required.
 */
export function MatchBoard({ s, questions, exitHref }: { s: VoiceSession; questions: PlayQuestion[]; exitHref: string }) {
  const speakRequired = s.game.options.speakRequired !== false;
  const [matched, setMatched] = useState<Record<string, boolean>>(() => Object.fromEntries(questions.filter((q) => q.id in s.results).map((q) => [q.id, true])));
  const [selected, setSelected] = useState<string | null>(null);
  const [wrong, setWrong] = useState<string | null>(null);
  const [speaking, setSpeaking] = useState<PlayQuestion | null>(null);
  const [busy, setBusy] = useState(false);
  const words = useMemo(() => shuffled(questions), [questions]);
  const word = (q: PlayQuestion) => plainText(q.displayText || q.expected);

  useEffect(
    () => () => s.stopAll(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  async function done(next: Record<string, boolean>) {
    if (questions.every((q) => next[q.id])) {
      await sleep(600);
      await s.finish();
    }
  }

  async function drop(wordQ: PlayQuestion, pictureQ: PlayQuestion) {
    if (busy || matched[pictureQ.id]) return;
    setBusy(true);
    setSelected(null);
    try {
      const { next, support } = await s.check(pictureQ, word(wordQ), "choice");
      if (next === "retry") {
        setWrong(pictureQ.id);
        setTimeout(() => setWrong(null), 700);
        return;
      }
      const m = { ...matched, [pictureQ.id]: true };
      setMatched(m);
      if (next === "done") {
        s.record(pictureQ.id, null);
        return done(m);
      }
      // Now say it.
      setSpeaking(pictureQ);
      const r = await s.ask(pictureQ, { prompt: async () => { await s.sayPhrase("yourTurn"); } });
      setSpeaking(null);
      if (r === "aborted") return;
      s.record(pictureQ.id, r === "skipped" ? (speakRequired ? null : support) : r);
      s.setFeedback(null);
      await done(m);
    } finally {
      setBusy(false);
    }
  }

  if (s.phase === "done") return <DoneScreen s={s} exitHref={exitHref} />;

  return (
    <div className="flex w-full flex-1 flex-col items-center">
      <div className="mt-2 grid w-full max-w-3xl grid-cols-2 gap-3 sm:grid-cols-3">
        {questions.map((q) => (
          <div
            key={q.id}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const wq = questions.find((x) => x.id === e.dataTransfer.getData("text/plain"));
              if (wq) drop(wq, q);
            }}
            onClick={() => selected && drop(questions.find((x) => x.id === selected)!, q)}
            className={`relative overflow-hidden rounded-2xl border-2 bg-card p-2 transition ${speaking?.id === q.id ? "border-teal ring-4 ring-teal/25" : matched[q.id] ? "border-leaf/50" : wrong === q.id ? "border-coral" : selected ? "cursor-pointer border-sky/60" : "border-line"}`}
            role="button"
            aria-label={matched[q.id] ? `Matched: ${word(q)}` : "Picture — drop a word here"}
          >
            {q.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={q.imageUrl} alt="" className="aspect-[4/3] w-full rounded-xl object-contain" draggable={false} />
            )}
            <div className="mt-2 grid h-10 place-items-center rounded-xl border-2 border-dashed border-line font-display text-lg font-semibold">
              {matched[q.id] ? <span className="text-leaf">{word(q)}</span> : <span className="text-muted">?</span>}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-5 flex flex-wrap justify-center gap-2" aria-label="Words">
        {words
          .filter((q) => !matched[q.id])
          .map((q) => (
            <button
              key={q.id}
              type="button"
              draggable
              disabled={busy}
              onDragStart={(e) => e.dataTransfer.setData("text/plain", q.id)}
              onClick={() => setSelected((x) => (x === q.id ? null : q.id))}
              aria-pressed={selected === q.id}
              className={`cursor-grab rounded-full border-2 px-4 py-2 font-display text-lg font-semibold ${selected === q.id ? "border-teal bg-teal-soft text-teal-dark" : "border-line bg-card"}`}
            >
              {word(q)}
            </button>
          ))}
      </div>
      {speaking && (
        <p className="mt-4 text-center font-display text-3xl font-semibold">
          Di: <span className="text-teal-dark">{word(speaking)}</span>
        </p>
      )}
      <VoiceDock s={s} showControls={false}>
        {speaking && !speakRequired && <Button variant="ghost" onClick={s.skip}>Skip speaking →</Button>}
        {speaking && <Button variant="secondary" onClick={s.repeat} disabled={s.phase !== "listening"}>🔊 Escuchar otra vez</Button>}
      </VoiceDock>
    </div>
  );
}
