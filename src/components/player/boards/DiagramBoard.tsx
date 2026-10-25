"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import type { PlayQuestion } from "@/lib/games/types";
import { plainText } from "@/lib/text/segments";
import { CharKeys, DoneScreen, VoiceDock, shuffled } from "../parts";
import type { VoiceSession } from "../useVoiceSession";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Label the Diagram: one picture with numbered points.
 *  speak — a point lights up, its question plays, the student says the label;
 *  type  — the student types the label of the lit point;
 *  drag  — labels are dragged (or tapped, then the point tapped) onto the points.
 * Correct labels appear on the picture.
 */
export function DiagramBoard({ s, questions, exitHref }: { s: VoiceSession; questions: PlayQuestion[]; exitHref: string }) {
  const mode = (s.game.options.diagramMode as "speak" | "type" | "drag") ?? "speak";
  const [placed, setPlaced] = useState<Record<string, boolean>>(() => Object.fromEntries(questions.filter((q) => q.id in s.results).map((q) => [q.id, true])));
  const [active, setActive] = useState(() => Math.max(0, questions.findIndex((q) => !(q.id in s.results))));
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState<string | null>(null); // drag mode: chosen label (question id)
  const [wrong, setWrong] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const labels = useMemo(() => shuffled(questions), [questions]);
  const label = (q: PlayQuestion) => plainText(q.displayText || q.expected);

  // Speak mode: points one after another.
  useEffect(() => {
    if (mode !== "speak") return;
    let live = true;
    (async () => {
      for (let i = 0; i < questions.length && live; i++) {
        const q = questions[i];
        if (q.id in s.results) continue;
        setActive(i);
        const r = await s.ask(q, { prompt: async () => { if (q.prompt) await s.say(q.prompt, q.promptAudioUrl); } });
        if (r === "aborted" || !live) return;
        s.record(q.id, r === "skipped" ? null : r);
        setPlaced((p) => ({ ...p, [q.id]: true }));
        await sleep(500);
      }
      if (live) await s.finish();
    })();
    return () => {
      live = false;
      s.stopAll();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (mode === "type" && questions[active] && s.phase !== "done") {
      setTyped("");
      const q = questions[active];
      if (q.prompt) s.say(q.prompt, q.promptAudioUrl);
      inputRef.current?.focus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, mode]);

  async function finishIfDone(next: Record<string, boolean>) {
    if (questions.every((q) => next[q.id])) {
      await sleep(700);
      await s.finish();
    }
  }

  async function submitTyped() {
    const q = questions[active];
    if (!q || busy) return;
    setBusy(true);
    try {
      const { next, support } = await s.check(q, typed, "typed");
      if (next === "retry") return;
      s.record(q.id, next === "correct" ? support : null);
      const p = { ...placed, [q.id]: true };
      setPlaced(p);
      const n = questions.findIndex((x) => !p[x.id]);
      if (n === -1) await finishIfDone(p);
      else {
        await sleep(600);
        setActive(n);
      }
    } finally {
      setBusy(false);
    }
  }

  async function drop(labelQ: PlayQuestion, pointQ: PlayQuestion) {
    if (busy || placed[pointQ.id]) return;
    setBusy(true);
    setSelected(null);
    try {
      // The chosen label is checked against the point on the server.
      const { next, support } = await s.check(pointQ, label(labelQ), "choice");
      if (next === "retry") {
        setWrong(pointQ.id);
        setTimeout(() => setWrong(null), 700);
        return;
      }
      s.record(pointQ.id, next === "correct" ? support : null);
      const p = { ...placed, [pointQ.id]: true };
      setPlaced(p);
      await finishIfDone(p);
    } finally {
      setBusy(false);
    }
  }

  if (s.phase === "done") return <DoneScreen s={s} exitHref={exitHref} />;
  const current = questions[active];

  return (
    <div className="flex w-full flex-1 flex-col items-center">
      <div className="relative mt-2 w-full max-w-2xl select-none overflow-hidden rounded-[1.5rem] border border-line bg-card">
        {s.game.diagramImageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={s.game.diagramImageUrl} alt="Picture to label" className="block w-full" draggable={false} />
        )}
        {questions.map((q, i) => {
          const isActive = mode !== "drag" && i === active && !placed[q.id];
          return (
            <div
              key={q.id}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${q.data.x ?? 50}%`, top: `${q.data.y ?? 50}%` }}
              onDragOver={(e) => mode === "drag" && e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const lq = questions.find((x) => x.id === e.dataTransfer.getData("text/plain"));
                if (lq) drop(lq, q);
              }}
            >
              {placed[q.id] ? (
                <span className="animate-pop-in block whitespace-nowrap rounded-full bg-leaf px-3 py-1 text-sm font-bold text-white shadow-soft">{label(q)}</span>
              ) : (
                <button
                  type="button"
                  aria-label={`Point ${i + 1}`}
                  onClick={() => (mode === "drag" && selected ? drop(questions.find((x) => x.id === selected)!, q) : mode === "type" ? setActive(i) : undefined)}
                  className={`grid h-9 w-9 place-items-center rounded-full border-[3px] border-white font-display text-sm font-bold text-white shadow-soft ${wrong === q.id ? "bg-coral" : isActive ? "animate-pulse bg-teal ring-4 ring-teal/30" : "bg-ink"}`}
                >
                  {i + 1}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {mode !== "drag" && current && !placed[current.id] && (
        <div className="mt-4 text-center">
          <p className="text-sm font-bold text-muted">Point {active + 1}</p>
          {current.prompt && <p className="font-display text-3xl font-semibold">{plainText(current.prompt)}</p>}
          {s.showHint && current.hint && <p className="mt-2 rounded-full bg-sun-soft px-4 py-1.5 font-semibold text-[#7a5200]">💡 {plainText(current.hint)}</p>}
        </div>
      )}

      {mode === "type" && current && !placed[current.id] && (
        <form className="mt-3 flex w-full max-w-md flex-col items-center gap-3" onSubmit={(e) => (e.preventDefault(), submitTyped())}>
          <input
            ref={inputRef}
            value={typed}
            onInput={(e) => setTyped((e.target as HTMLInputElement).value)}
            onChange={(e) => setTyped(e.target.value)}
            aria-label={`Label for point ${active + 1}`}
            autoComplete="off"
            spellCheck={false}
            className="h-14 w-full rounded-2xl border-2 border-line bg-card px-4 text-center font-display text-2xl focus:border-sky focus:outline-none"
          />
          <CharKeys target={inputRef} language={s.game.language} />
          <Button type="submit" variant="voice" disabled={busy || !typed.trim()}>Check</Button>
        </form>
      )}

      {mode === "drag" && (
        <div className="mt-4 flex flex-wrap justify-center gap-2" aria-label="Labels">
          {labels
            .filter((q) => !placed[q.id])
            .map((q) => (
              <button
                key={q.id}
                type="button"
                draggable
                onDragStart={(e) => e.dataTransfer.setData("text/plain", q.id)}
                onClick={() => setSelected((x) => (x === q.id ? null : q.id))}
                aria-pressed={selected === q.id}
                className={`cursor-grab rounded-full border-2 px-4 py-2 font-display text-lg font-semibold ${selected === q.id ? "border-teal bg-teal-soft text-teal-dark" : "border-line bg-card"}`}
              >
                {label(q)}
              </button>
            ))}
          {Object.keys(placed).length < questions.length && <p className="w-full text-center text-sm text-muted">Drag a label to its point — or tap a label, then tap the point.</p>}
        </div>
      )}

      <VoiceDock s={s} showControls={mode === "speak"} />
    </div>
  );
}
