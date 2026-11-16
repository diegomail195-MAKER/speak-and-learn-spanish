"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import type { PlayFace, PlayQuestion } from "@/lib/games/types";
import { plainText } from "@/lib/text/segments";
import { DiagnosticsPanel, DoneScreen, VoiceDock, shuffled } from "../parts";
import { useVoiceSession, type SubmitTurn, type Support, type VoiceSession } from "../useVoiceSession";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export interface FlashcardsGameProps {
  game: VoiceSession["game"];
  mode: "preview" | "student";
  diagnostics?: boolean;
  submitTurn?: SubmitTurn;
  onFinish?: (summary: { presented: number; durationMs: number }) => Promise<void> | void;
  exitHref: string;
  done?: Record<string, Support | null>;
  withMic: boolean;
  /** Strip under the game (title and the actions for this person). */
  below?: ReactNode;
}

/**
 * Flashcards on a stage: a start screen (type, title, Start, instructions, sound and full
 * screen in the corner), then the game: time, "n of N" and cards known on top, one large card,
 * Flip below. Click, tap, Flip or Space turns the card; the student marks it ✓ or ✗ beside it and
 * the next card comes up. Cards with a spoken answer keep LextroSpeak's voice exercise (the
 * microphone listens, the answer is checked and the card is marked by itself).
 */
export function FlashcardsGame({ game, mode, diagnostics, submitTurn, onFinish, exitHref, done, withMic, below }: FlashcardsGameProps) {
  const s = useVoiceSession(game, { mode, submitTurn, onFinish, done });
  const [run, setRun] = useState(0);
  const stage = useRef<HTMLDivElement>(null);
  const [full, setFull] = useState(false);
  const started = run > 0 && s.phase !== "start";

  useEffect(() => {
    const f = () => setFull(document.fullscreenElement === stage.current);
    document.addEventListener("fullscreenchange", f);
    return () => document.removeEventListener("fullscreenchange", f);
  }, []);
  const toggleFull = () => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => undefined);
    else stage.current?.requestFullscreen?.().catch(() => undefined);
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-2 py-2 sm:px-4 sm:py-3">
      <main
        ref={stage}
        data-testid="flashcards-stage"
        className={`relative flex flex-col overflow-hidden bg-ink text-white ${full ? "h-dvh w-full" : "min-h-[calc(100dvh-1rem)] rounded-[1.75rem] shadow-soft sm:min-h-[calc(100dvh-1.5rem)]"}`}
      >
        <StageDecor />
        <div className="relative z-10 flex items-center gap-2 px-3 pt-3 sm:px-5">
          <a href={exitHref} onClick={() => s.stopMic()} className="rounded-full px-3 py-1.5 text-sm font-bold text-white/70 hover:bg-white/10 hover:text-white">
            ✕ <span className="sr-only sm:not-sr-only">Exit</span>
          </a>
          {mode === "preview" && <span className="rounded-full bg-sky-soft px-3 py-1 text-xs font-bold text-sky">Teacher preview — answers are not saved</span>}
        </div>

        <div className="relative z-10 flex min-h-0 flex-1 flex-col items-center px-3 pb-14 sm:px-6">
          {started ? (
            <CardsBoard key={run} s={s} questions={game.questions} exitHref={exitHref} onRestart={() => setRun((r) => r + 1)} />
          ) : (
            <StartPanel
              s={s}
              withMic={withMic}
              onStart={async () => {
                if (await s.start(withMic)) setRun((r) => r + 1);
              }}
            />
          )}
        </div>

        <div className="absolute bottom-3 right-3 z-20 flex gap-1 sm:bottom-4 sm:right-4">
          <button
            type="button"
            onClick={() => s.setMuted(!s.muted)}
            aria-pressed={s.muted}
            aria-label={s.muted ? "Sound off — turn sound on" : "Sound on — turn sound off"}
            title={s.muted ? "Sound off" : "Sound on"}
            className="grid h-11 w-11 place-items-center rounded-full text-white/80 hover:bg-white/10 hover:text-white"
          >
            {s.muted ? <IconMuted /> : <IconSound />}
          </button>
          <button type="button" onClick={toggleFull} aria-label={full ? "Leave full screen" : "Full screen"} title="Full screen" className="grid h-11 w-11 place-items-center rounded-full text-white/80 hover:bg-white/10 hover:text-white">
            <IconFull exit={full} />
          </button>
        </div>
      </main>
      {below}
      {diagnostics && s.usesMic && <DiagnosticsPanel s={s} />}
    </div>
  );
}

/** Soft LextroSpeak shapes behind the stage. */
function StageDecor() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <div className="absolute -left-16 -top-20 h-64 w-64 rounded-full bg-coral/25 blur-2xl" />
      <div className="absolute -bottom-24 -right-10 h-72 w-72 rounded-full bg-teal/30 blur-2xl" />
      <div className="absolute right-[18%] top-[12%] h-24 w-24 rounded-full bg-sun/15 blur-xl" />
    </div>
  );
}

function StartPanel({ s, withMic, onStart }: { s: VoiceSession; withMic: boolean; onStart: () => void }) {
  const { game, micState, error } = s;
  return (
    <div className="flex w-full flex-1 flex-col items-center justify-center text-center">
      <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-sun">Flashcards</p>
      <h1 className="mt-2 max-w-3xl font-display text-3xl font-bold leading-tight sm:text-5xl">{game.title || "Flashcards"}</h1>
      <div className="relative mt-5 grid h-48 w-40 place-items-center sm:mt-6 sm:h-60 sm:w-48">
        {/* the card behind the Start button */}
        <div aria-hidden className="absolute h-44 w-36 rotate-[-8deg] rounded-[1.5rem] bg-white/10 ring-1 ring-white/15 sm:h-56 sm:w-44" />
        <div aria-hidden className="absolute h-44 w-36 rotate-[7deg] rounded-[1.5rem] bg-teal/30 ring-1 ring-white/10 sm:h-56 sm:w-44" />
        <button
          type="button"
          onClick={onStart}
          disabled={micState === "requesting"}
          className="relative flex h-32 w-32 flex-col items-center justify-center gap-1 rounded-[1.5rem] bg-coral font-display text-xl font-bold text-white shadow-[0_6px_0_var(--color-coral-dark)] transition-transform hover:-translate-y-0.5 active:translate-y-1 active:shadow-[0_2px_0_var(--color-coral-dark)] disabled:opacity-70 sm:h-36 sm:w-36"
        >
          <svg viewBox="0 0 24 24" className="h-12 w-12" fill="currentColor" aria-hidden>
            <path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z" />
          </svg>
          {micState === "requesting" ? "Allow the mic…" : withMic ? "🎤 Start" : "Start"}
        </button>
      </div>
      <p className="mt-8 max-w-xl text-base text-white/85 sm:mt-10 sm:text-lg">
        {game.instructions ? plainText(game.instructions) : "Look at each card, turn it over and check yourself."}
      </p>
      <p className="mt-1 text-sm text-white/60">
        {game.questions.length} {game.questions.length === 1 ? "card" : "cards"}
        {withMic ? " · You'll answer out loud. The microphone listens only during this activity." : ""}
      </p>
      {micState === "denied" && (
        <p className="mt-4 max-w-md rounded-xl2 bg-coral-soft p-3 text-left text-sm text-coral-dark">
          <strong>The microphone is blocked.</strong> Click the lock icon next to the web address, set Microphone to “Allow”, then press Start again.
        </p>
      )}
      {micState === "unavailable" && <p className="mt-4 rounded-xl2 bg-coral-soft p-3 text-sm text-coral-dark">No microphone was found. Plug one in or check the device settings.</p>}
      {error && <p className="mt-4 rounded-xl2 bg-coral-soft p-3 text-sm text-coral-dark">{error}</p>}
    </div>
  );
}

/** A face: the picture or the text is the main element; a 🔊 marker when it only has audio. */
function Face({ face, fallbackAlt, big }: { face: PlayFace; fallbackAlt: string; big?: boolean }) {
  const text = plainText(face.text ?? "");
  return (
    <>
      {face.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={face.imageUrl} alt={face.imageAlt || text || fallbackAlt} className={`w-full min-h-0 flex-1 object-contain ${text ? "max-h-[82%]" : "max-h-full"}`} draggable={false} />
      )}
      {text && <span className={`text-center font-display font-bold leading-tight text-ink ${face.imageUrl ? "text-3xl sm:text-5xl" : big ? "text-4xl sm:text-6xl" : "text-3xl sm:text-5xl"}`}>{text}</span>}
      {!face.imageUrl && !text && face.audio && <span className="text-7xl" aria-hidden>🔊</span>}
    </>
  );
}

type Mark = "knew" | "again";

/** Time spent playing, paused while the game is paused or finished. */
function useClock(running: boolean) {
  const [ms, setMs] = useState(0);
  useEffect(() => {
    if (!running) return;
    let last = Date.now();
    const t = setInterval(() => {
      const n = Date.now();
      setMs((m) => m + n - last);
      last = n;
    }, 250);
    return () => clearInterval(t);
  }, [running]);
  return ms;
}
const clockText = (ms: number) => {
  const sec = Math.floor(ms / 1000);
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
};

/**
 * The game: a top bar (time, "n of N" with arrows, cards known), one big card with Flip below.
 * After turning, the student marks the card ✓ (knew it) or ✗ (not yet) beside the card; a mark
 * shows on the card for a moment and the next card comes up. When the deck has been gone
 * through, the cards not yet marked ✓ come round again until every card is ✓ (unless the
 * activity turns off practising missed cards). Then: Game complete with the score (✓ on the
 * first try), the time, the answers, and Start again.
 */
function CardsBoard({ s, questions, exitHref, onRestart }: { s: VoiceSession; questions: PlayQuestion[]; exitHref: string; onRestart: () => void }) {
  const opts = s.game.options;
  const oneSide = opts.sides === "one";
  const cycle = opts.practiceMissed !== false;
  const [order, setOrder] = useState<string[]>(() => {
    const ids = questions.filter((q) => !(q.id in s.results)).map((q) => q.id);
    const list = ids.length ? ids : questions.map((q) => q.id);
    return opts.shuffle ? shuffled(list) : list;
  });
  const deck = useRef(order);
  const [pos, setPos] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [asking, setAsking] = useState(false);
  const [marks, setMarks] = useState<Record<string, Mark>>({});
  const marksRef = useRef(marks);
  const [first, setFirst] = useState<Record<string, Mark>>({});
  const [overlay, setOverlay] = useState<Mark | null>(null);
  const [complete, setComplete] = useState(false);
  const [showAnswers, setShowAnswers] = useState(false);
  const [paused, setPaused] = useState(false);
  const ms = useClock(!complete && !paused && s.phase !== "done");
  const token = useRef(0);
  const byId = useCallback((id: string) => questions.find((q) => q.id === id)!, [questions]);
  const speaks = (q: PlayQuestion) => q.expected.trim().length > 0;

  const mark = useCallback(
    (id: string, m: Mark, support?: Support | null) => {
      marksRef.current = { ...marksRef.current, [id]: m };
      setMarks(marksRef.current);
      setFirst((f) => (id in f ? f : { ...f, [id]: m }));
      s.record(id, support !== undefined ? support : m === "knew" ? "NONE" : null);
    },
    [s],
  );

  async function play(i: number, ord: string[], askOpts?: Parameters<VoiceSession["ask"]>[1]) {
    const my = ++token.current;
    i = Math.min(Math.max(0, i), ord.length - 1);
    s.stopAll();
    s.setFeedback(null);
    setOverlay(null);
    setPos(i);
    setFlipped(false);
    const q = byId(ord[i]);
    if (!speaks(q)) {
      setAsking(false);
      return; // look, flip and check yourself
    }
    setAsking(true);
    const r = await s.ask(q, askOpts);
    if (my !== token.current) return;
    setAsking(false);
    if (r === "aborted" || r === "skipped") return;
    const m: Mark = r === null ? "again" : "knew";
    mark(q.id, m, r);
    if (!oneSide) setFlipped(true);
    setOverlay(m);
    await sleep(1600);
    if (my === token.current) advance(i, ord);
  }

  /** The next card not yet known; at the end of the deck, the cards still to learn come round again. */
  function advance(from: number, ord: string[]) {
    const known = (id: string) => marksRef.current[id] === "knew";
    const next = ord.findIndex((id, i) => i > from && !known(id));
    if (next >= 0) return play(next, ord);
    const left = ord.filter((id) => !known(id));
    if (cycle && left.length) {
      const again = opts.shuffle ? shuffled(left) : left;
      setOrder(again);
      return play(0, again);
    }
    token.current++;
    s.stopAll();
    setOverlay(null);
    setComplete(true);
  }

  useEffect(() => {
    if (order.length) play(0, order);
    else setComplete(true);
    return () => {
      token.current++;
      s.stopAll();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const total = deck.current.length;
  const score = deck.current.filter((id) => first[id] === "knew").length;
  const knownNow = deck.current.filter((id) => marks[id] === "knew").length;

  // A deck of spoken answers all right on the first try ends the activity straight away.
  useEffect(() => {
    if (complete && deck.current.every((id) => speaks(byId(id))) && score === total && s.phase !== "done") s.finish();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [complete]);

  const q = complete ? null : byId(order[pos]);

  const flip = useCallback(() => {
    if (!q || oneSide || overlay || paused) return;
    if (!flipped && speaks(q) && asking) s.raiseSupport("MODEL"); // seeing the answer first means it's not independent
    setFlipped((f) => !f);
  }, [q, oneSide, overlay, paused, flipped, asking, s]);

  const answer = async (m: Mark) => {
    if (!q || overlay) return;
    const my = ++token.current;
    mark(q.id, m);
    setOverlay(m);
    await sleep(700);
    if (my === token.current) advance(pos, order);
  };

  // Space flips the card; arrows move between cards.
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (complete || paused || s.phase === "done") return;
      const el = e.target as HTMLElement;
      if (el.closest("input, textarea, select, [contenteditable]")) return;
      if (e.key === " " || e.code === "Space") {
        if (el.closest("button") && !el.closest("[data-card]")) return; // a focused button handles Space itself
        e.preventDefault();
        flip();
      } else if (e.key === "ArrowRight" && pos < order.length - 1) play(pos + 1, order);
      else if (e.key === "ArrowLeft" && pos > 0) play(pos - 1, order);
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flip, pos, order, complete, paused, s.phase]);

  if (s.phase === "done") {
    return (
      <div className="my-auto w-full max-w-lg rounded-[1.5rem] bg-paper p-6 text-ink">
        <DoneScreen s={s} exitHref={exitHref} />
      </div>
    );
  }

  if (complete || !q) {
    if (showAnswers) {
      return (
        <div className="animate-pop-in my-auto flex max-h-[min(560px,78dvh)] w-full max-w-2xl flex-col rounded-[1.5rem] bg-paper p-4 text-ink sm:p-6" data-testid="answers-list">
          <div className="flex items-center justify-between gap-2">
            <p className="font-display text-2xl font-bold">Answers</p>
            <button type="button" onClick={() => setShowAnswers(false)} className="h-10 rounded-full bg-card px-4 font-bold ring-1 ring-line hover:ring-ink-2/40">‹ Back</button>
          </div>
          <ol className="mt-3 min-h-0 flex-1 divide-y divide-line overflow-y-auto rounded-2xl bg-card ring-1 ring-line">
            {deck.current.map((id, i) => {
              const c = byId(id);
              const back = c.back ?? (c.expected ? { text: c.expected, imageUrl: null, imageAlt: "" } : null);
              const m = first[id];
              return (
                <li key={id} className="flex items-center gap-3 px-3 py-2">
                  <span className="w-6 text-right text-sm font-bold text-muted">{i + 1}</span>
                  <MiniFace face={{ text: c.displayText, imageUrl: c.imageUrl, imageAlt: c.imageAlt }} />
                  {!oneSide && back && (
                    <>
                      <span aria-hidden className="text-muted">→</span>
                      <MiniFace face={back} />
                    </>
                  )}
                  <span
                    className={`ml-auto grid h-8 w-8 shrink-0 place-items-center rounded-full font-bold ${m === "knew" ? "bg-leaf-soft text-leaf" : m === "again" ? "bg-coral-soft text-coral-dark" : "bg-paper-2 text-muted"}`}
                    aria-label={m === "knew" ? "Knew it the first time" : m === "again" ? "Not on the first try" : "Not marked"}
                  >
                    {m === "knew" ? "✓" : m === "again" ? "✗" : "–"}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
      );
    }
    return (
      <div className="animate-pop-in my-auto w-full max-w-md rounded-[1.5rem] bg-paper p-6 text-center text-ink" data-testid="round-results">
        <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-coral">Game complete</p>
        <p className="mt-1 font-display text-3xl font-bold sm:text-4xl">¡Muy bien!</p>
        <dl className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-leaf-soft px-4 py-3 text-leaf">
            <dt className="text-xs font-extrabold uppercase tracking-wider">Score</dt>
            <dd className="font-display text-3xl font-bold" data-testid="final-score">{score}/{total}</dd>
          </div>
          <div className="rounded-2xl bg-sky-soft px-4 py-3 text-sky">
            <dt className="text-xs font-extrabold uppercase tracking-wider">Time</dt>
            <dd className="font-display text-3xl font-bold">{clockText(ms)}</dd>
          </div>
        </dl>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button type="button" onClick={() => setShowAnswers(true)} className="h-12 rounded-full bg-card px-5 font-bold ring-1 ring-line hover:ring-ink-2/40">Show answers</button>
          <button type="button" onClick={onRestart} className="h-12 rounded-full bg-teal px-5 font-bold text-white shadow-[0_2px_0_var(--color-teal-dark)] hover:bg-teal-dark">⟲ Start again</button>
          <button type="button" onClick={() => s.finish()} className="h-12 rounded-full bg-coral px-5 font-bold text-white shadow-[0_2px_0_var(--color-coral-dark)] hover:bg-coral-dark">Finish</button>
        </div>
      </div>
    );
  }

  const front: PlayFace = { text: q.displayText, imageUrl: q.imageUrl, imageAlt: q.imageAlt, audio: q.audio };
  const visibleAudio = flipped ? q.back?.audio : q.audio;
  const listen = () => {
    if (visibleAudio) return s.say(visibleAudio.text, visibleAudio.url, visibleAudio.language);
    if (flipped || s.repeat()) return null;
    if (q.prompt || q.displayText) return s.say(q.prompt || q.displayText, q.prompt ? q.promptAudioUrl : null);
    return null;
  };
  const canListen = !!visibleAudio || (!flipped && !!(q.prompt || q.displayText));
  const showMarks = !speaks(q) && (oneSide || flipped) && !overlay;
  const arrow = "grid h-9 w-9 place-items-center rounded-full text-white hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent";
  const markBtn = "grid h-14 w-14 place-items-center rounded-2xl text-3xl font-bold shadow-[0_4px_0_rgba(0,0,0,.25)] transition-transform hover:-translate-y-0.5 active:translate-y-0.5 sm:h-16 sm:w-16";

  return (
    <div className="flex w-full flex-1 flex-col items-center">
      {/* time · n of N · cards known */}
      <div className="grid w-full max-w-6xl grid-cols-[1fr_auto_1fr] items-center font-display text-lg font-bold sm:text-xl">
        <span className="tabular-nums text-white/85" aria-label={`Time ${clockText(ms)}`} data-testid="game-clock">{clockText(ms)}</span>
        <span className="flex items-center gap-1">
          <button type="button" onClick={() => play(pos - 1, order)} disabled={pos === 0 || paused} className={arrow} aria-label="Previous card">
            <IconArrow left />
          </button>
          <span data-testid="card-counter" className="min-w-[4.5rem] text-center tabular-nums">{pos + 1} of {order.length}</span>
          <button type="button" onClick={() => play(pos + 1, order)} disabled={pos >= order.length - 1 || paused} className={arrow} aria-label="Next card">
            <IconArrow />
          </button>
        </span>
        <span className="justify-self-end tabular-nums text-white/85" aria-label={`${knownNow} cards known`} data-testid="known-count">✓ {knownNow}</span>
      </div>

      <div className="mt-3 flex w-full flex-1 items-center justify-center gap-3 sm:gap-4">
        <div aria-hidden className="hidden w-16 shrink-0 sm:block" />
        <div className="relative h-[clamp(16rem,calc(100dvh-19rem),60rem)] w-full max-w-6xl" style={{ perspective: 1600, WebkitPerspective: 1600 }}>
          <button
            key={q.id /* a new card starts face up, without turning back */}
            type="button"
            data-card
            data-flipped={flipped ? "true" : "false"}
            onClick={flip}
            aria-label={oneSide ? "Card" : flipped ? "Card, back. Flip it to see the front" : "Card, front. Flip it over"}
            className="ls-flip-card relative block h-full w-full cursor-pointer focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-sun"
            style={{ transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)" }}
          >
            <span className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-[1.75rem] bg-card p-3 shadow-[0_10px_0_rgba(0,0,0,.18)] ls-flip-face sm:p-5">
              <Face face={front} fallbackAlt="Card picture" big />
              {q.prompt && <span className="text-center font-display text-xl text-ink-2 sm:text-2xl">{plainText(q.prompt)}</span>}
            </span>
            {!oneSide && (
              <span className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-[1.75rem] bg-teal-soft p-3 shadow-[0_10px_0_rgba(0,0,0,.18)] ls-flip-face ls-flip-back sm:p-5">
                {q.back ? (
                  <>
                    <Face face={q.back} fallbackAlt="Back of the card" big />
                    {speaks(q) && plainText(q.expected) !== plainText(q.back.text) && <span className="text-center text-lg font-semibold text-teal-dark">{plainText(q.expected)}</span>}
                  </>
                ) : (
                  <>
                    <span className="text-center font-display text-4xl font-bold text-teal-dark sm:text-5xl">{plainText(q.expected)}</span>
                    {q.data.translation && <span className="text-center text-xl text-ink-2">{plainText(q.data.translation)}</span>}
                  </>
                )}
              </span>
            )}
          </button>
          {overlay && (
            <span
              aria-live="polite"
              data-testid="mark-overlay"
              className={`animate-pop-in pointer-events-none absolute inset-0 grid place-items-center rounded-[1.75rem] ${overlay === "knew" ? "bg-leaf/25" : "bg-coral/25"}`}
            >
              <span className={`grid h-28 w-28 place-items-center rounded-full text-6xl font-bold text-white shadow-lg ${overlay === "knew" ? "bg-leaf" : "bg-coral"}`}>
                {overlay === "knew" ? "✓" : "✗"}
                <span className="sr-only">{overlay === "knew" ? "Marked as known" : "Marked to practise"}</span>
              </span>
            </span>
          )}
          {paused && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-[1.75rem] bg-ink/95 ring-1 ring-white/15">
              <p className="font-display text-2xl font-bold">Paused</p>
              <button type="button" onClick={() => setPaused(false)} className="h-12 rounded-full bg-coral px-6 font-bold text-white shadow-[0_3px_0_var(--color-coral-dark)]">▶ Resume</button>
            </div>
          )}
        </div>
        <div className="flex w-14 shrink-0 flex-col gap-3 sm:w-16">
          {showMarks && !paused && (
            <>
              <button type="button" onClick={() => answer("knew")} className={`${markBtn} bg-leaf text-white`} data-testid="mark-knew" aria-label="I knew it" title="I knew it">✓</button>
              <button type="button" onClick={() => answer("again")} className={`${markBtn} bg-coral text-white`} data-testid="mark-again" aria-label="Not yet, practise again" title="Not yet">✗</button>
            </>
          )}
        </div>
      </div>

      {s.showHint && q.hint && <p className="mt-3 rounded-full bg-sun-soft px-4 py-1.5 font-semibold text-[#7a5200]">💡 {plainText(q.hint)}</p>}

      <button type="button" onClick={listen} disabled={!canListen || paused} className="mt-3 grid h-10 w-12 place-items-center rounded-xl bg-white/15 text-white hover:bg-white/25 disabled:opacity-30" aria-label="Listen" title="Listen">
        <IconSound />
      </button>

      {speaks(q) && (
        <div className="mt-3 w-full max-w-2xl rounded-[1.25rem] bg-paper px-3 pb-3 text-ink">
          <VoiceDock s={s} showControls={false}>
            <button
              type="button"
              className="h-11 rounded-full bg-card px-5 font-bold ring-1 ring-line"
              onClick={async () => {
                // Repeating after the model is guided practice, never independent.
                const model = () => s.say(q.expected, q.modelAudioUrl, q.answerLanguage);
                if (!asking) return play(pos, order, { initialSupport: "MODEL", prompt: model });
                s.raiseSupport("MODEL");
                await model();
              }}
            >
              🔁 Repeat
            </button>
            {!asking && <button type="button" className="h-11 rounded-full bg-teal px-5 font-bold text-white" onClick={() => play(pos, order)}>🎤 Speak</button>}
            <button type="button" className="h-11 rounded-full px-4 font-bold text-ink-2 hover:bg-paper-2" onClick={s.stopMic} aria-label="Stop the microphone">■ Stop mic</button>
          </VoiceDock>
        </div>
      )}

      {!oneSide && (
        <button
          type="button"
          onClick={flip}
          disabled={paused || !!overlay}
          className="mt-4 h-12 min-w-40 rounded-xl bg-white px-8 font-display text-lg font-bold text-ink shadow-[0_4px_0_rgba(0,0,0,.25)] hover:bg-paper disabled:opacity-60"
          data-testid="turn-card"
        >
          Flip
        </button>
      )}
      {!speaks(q) && !oneSide && !flipped && <p className="mt-2 text-xs text-white/60">Click or tap the card, or press Space, to flip it.</p>}

      <button
        type="button"
        onClick={() => {
          if (!paused) {
            token.current++;
            s.stopAll();
            setAsking(false);
            setPaused(true);
          } else setPaused(false);
        }}
        aria-pressed={paused}
        aria-label={paused ? "Resume" : "Pause"}
        title={paused ? "Resume" : "Pause"}
        className="absolute bottom-3 left-3 z-20 grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20 sm:bottom-4 sm:left-4"
      >
        {paused ? "▶" : <IconPause />}
      </button>
    </div>
  );
}

/** A small face for the answers list. */
function MiniFace({ face }: { face: Pick<PlayFace, "text" | "imageUrl" | "imageAlt"> }) {
  const text = plainText(face.text ?? "");
  return (
    <span className="flex min-w-0 items-center gap-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {face.imageUrl && <img src={face.imageUrl} alt={face.imageAlt || text} className="h-10 w-10 shrink-0 object-contain" />}
      {text && <span className="truncate font-semibold">{text}</span>}
    </span>
  );
}

function IconArrow({ left }: { left?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" aria-hidden>
      <path d={left ? "M16 4 7 12l9 8z" : "M8 4l9 8-9 8z"} />
    </svg>
  );
}
function IconPause() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
      <rect x="6" y="5" width="4" height="14" rx="1" />
      <rect x="14" y="5" width="4" height="14" rx="1" />
    </svg>
  );
}


function IconSound() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M11 5 6 9H3v6h3l5 4V5z" fill="currentColor" />
      <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" />
    </svg>
  );
}
function IconMuted() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M11 5 6 9H3v6h3l5 4V5z" fill="currentColor" />
      <path d="m16 9 5 6M21 9l-5 6" />
    </svg>
  );
}
function IconFull({ exit }: { exit: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {exit ? <path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" /> : <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />}
    </svg>
  );
}
