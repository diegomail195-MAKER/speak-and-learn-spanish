"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import type { PlayQuestion } from "@/lib/games/types";
import { plainText } from "@/lib/text/segments";
import { DoneScreen, QuestionView, VoiceDock } from "../parts";
import type { VoiceSession } from "../useVoiceSession";

const COLORS = ["#e4553c", "#12827a", "#f2b33d", "#3a74c9", "#2b8f55", "#b5539a", "#e98a2c", "#5b6bd6"];
const SPIN_MS = 4200;

function slicePath(i: number, n: number, r: number) {
  if (n === 1) return `M ${r} 0 A ${r} ${r} 0 1 1 ${r - 0.01} 0 Z`;
  const a0 = (i / n) * 2 * Math.PI - Math.PI / 2;
  const a1 = ((i + 1) / n) * 2 * Math.PI - Math.PI / 2;
  const large = a1 - a0 > Math.PI ? 1 : 0;
  return `M 0 0 L ${r * Math.cos(a0)} ${r * Math.sin(a0)} A ${r} ${r} 0 ${large} 1 ${r * Math.cos(a1)} ${r * Math.sin(a1)} Z`;
}

/**
 * Spin the Wheel: the wheel picks an item, its question plays and the student answers out loud.
 * Completed slices can leave the wheel; missed ones can stay for another try.
 */
export function WheelBoard({ s, questions, exitHref }: { s: VoiceSession; questions: PlayQuestion[]; exitHref: string }) {
  const { removeCompleted, repeatMissed, timed, seconds } = s.game.options as { removeCompleted: boolean; repeatMissed: boolean; timed: boolean; seconds: number };
  const [status, setStatus] = useState<Record<string, "pending" | "done" | "missed">>(() => Object.fromEntries(questions.map((q) => [q.id, q.id in s.results ? "done" : "pending"])));
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [current, setCurrent] = useState<PlayQuestion | null>(null);
  const [left, setLeft] = useState<number | null>(null);
  const misses = useRef<Record<string, number>>({});
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const visible = questions.filter((q) => !removeCompleted || status[q.id] === "pending");
  const pending = questions.filter((q) => status[q.id] === "pending");

  useEffect(() => () => {
    if (timer.current) clearInterval(timer.current);
    s.stopAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!spinning && !current && pending.length === 0 && s.phase !== "done") s.finish();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending.length, spinning, current]);

  async function spin() {
    if (spinning || current || pending.length === 0) return;
    const pick = pending[Math.floor(Math.random() * pending.length)];
    const i = visible.findIndex((q) => q.id === pick.id);
    const n = visible.length;
    // Bring the middle of slice i under the pointer at the top.
    const target = 360 - ((i + 0.5) / n) * 360 + (Math.random() - 0.5) * (300 / n);
    const base = rotation - (rotation % 360);
    setSpinning(true);
    setRotation(base + 360 * 5 + target);
    await new Promise((r) => setTimeout(r, SPIN_MS + 150));
    setSpinning(false);
    setCurrent(pick);
    if (timed) {
      setLeft(seconds);
      timer.current = setInterval(() => {
        setLeft((x) => {
          if (x === null) return x;
          if (x <= 1) {
            if (timer.current) clearInterval(timer.current);
            s.skip(); // time is up: the question ends unanswered
            return 0;
          }
          return x - 1;
        });
      }, 1000);
    }
    const r = await s.ask(pick);
    if (timer.current) clearInterval(timer.current);
    setLeft(null);
    if (r === "aborted") return;
    const answered = r !== null && r !== "skipped";
    s.record(pick.id, answered ? r : null);
    if (!answered) misses.current[pick.id] = (misses.current[pick.id] ?? 0) + 1;
    // A missed slice may stay for one more try.
    const stays = !answered && repeatMissed && misses.current[pick.id] < 2;
    setStatus((st) => ({ ...st, [pick.id]: answered ? "done" : stays ? "pending" : "missed" }));
    await new Promise((r2) => setTimeout(r2, 900));
    setCurrent(null);
    s.setFeedback(null);
  }

  if (s.phase === "done") return <DoneScreen s={s} exitHref={exitHref} />;

  const R = 150;
  return (
    <div className="flex w-full flex-1 flex-col items-center">
      {current ? (
        <div className="flex w-full flex-col items-center">
          {current.displayText && <p className="mt-1 rounded-full bg-paper-2 px-4 py-1 font-display text-xl font-semibold">{plainText(current.displayText)}</p>}
          <QuestionView s={s} q={current} compact />
          {left !== null && (
            <p className={`mt-3 font-display text-3xl font-semibold tabular-nums ${left <= 5 ? "text-coral" : "text-ink-2"}`} aria-live="polite">
              ⏱ {left}
            </p>
          )}
        </div>
      ) : (
        <div className="mt-2 flex flex-col items-center">
          <div className="relative">
            <svg viewBox="-160 -170 320 330" className="h-[min(62vh,420px)] w-[min(62vh,420px)]" role="img" aria-label={`Wheel with ${visible.length} slices`}>
              <g style={{ transform: `rotate(${rotation}deg)`, transition: spinning ? `transform ${SPIN_MS}ms cubic-bezier(0.12, 0.7, 0.1, 1)` : "none" }}>
                {visible.map((q, i) => {
                  const n = visible.length;
                  const mid = ((i + 0.5) / n) * 360 - 90;
                  const done = status[q.id] !== "pending";
                  return (
                    <g key={q.id}>
                      <path d={slicePath(i, n, R)} fill={done ? "#d9d3c5" : COLORS[i % COLORS.length]} stroke="#fff" strokeWidth={3} />
                      <text
                        transform={`rotate(${mid}) translate(${R * 0.6} 0) ${mid > 90 && mid < 270 ? "rotate(180)" : ""}`}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="fill-white font-display"
                        style={{ fontSize: n > 8 ? 12 : 16, fontWeight: 700 }}
                      >
                        {(plainText(q.displayText) || String(i + 1)).slice(0, 14)}
                      </text>
                    </g>
                  );
                })}
                <circle r={22} fill="#1e2340" />
              </g>
              <path d="M -14 -168 L 14 -168 L 0 -140 Z" fill="#1e2340" />
            </svg>
          </div>
          <Button variant="voice" size="lg" className="mt-4 h-16 px-10 text-xl" onClick={spin} disabled={spinning || pending.length === 0}>
            {spinning ? "…" : "Spin! · ¡Gira!"}
          </Button>
          <p className="mt-2 text-sm text-muted">{pending.length} left</p>
        </div>
      )}
      <VoiceDock s={s} showControls={!!current} />
    </div>
  );
}
