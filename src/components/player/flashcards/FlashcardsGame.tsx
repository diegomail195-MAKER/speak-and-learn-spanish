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
 * screen in the corner), then one large card at a time. Click, tap or Space turns it. After
 * turning, the student says how it went: "I knew it" or "Practice again". Cards with a spoken
 * answer keep LextroSpeak's voice exercise (the microphone listens, the answer is checked and the
 * card turns by itself). At the end of a round: what they knew, what to practise, and the
 * options to practise the missed cards or start again.
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
    <div className="mx-auto w-full max-w-5xl px-3 py-3 sm:px-5 sm:py-5">
      <main
        ref={stage}
        data-testid="flashcards-stage"
        className={`relative flex flex-col overflow-hidden bg-ink text-white ${full ? "h-dvh w-full" : "min-h-[min(640px,86dvh)] rounded-[1.75rem] shadow-soft sm:min-h-[620px]"}`}
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
        <img src={face.imageUrl} alt={face.imageAlt || text || fallbackAlt} className={`w-full min-h-0 flex-1 object-contain ${text ? "max-h-[68%]" : "max-h-full"}`} draggable={false} />
      )}
      {text && <span className={`text-center font-display font-bold leading-tight text-ink ${face.imageUrl ? "text-2xl sm:text-3xl" : big ? "text-4xl sm:text-6xl" : "text-3xl sm:text-5xl"}`}>{text}</span>}
      {!face.imageUrl && !text && face.audio && <span className="text-7xl" aria-hidden>🔊</span>}
    </>
  );
}

type Mark = "knew" | "again";

function CardsBoard({ s, questions, exitHref, onRestart }: { s: VoiceSession; questions: PlayQuestion[]; exitHref: string; onRestart: () => void }) {
  const opts = s.game.options;
  const oneSide = opts.sides === "one";
  const [order, setOrder] = useState<string[]>(() => {
    const ids = questions.filter((q) => !(q.id in s.results)).map((q) => q.id);
    const list = ids.length ? ids : questions.map((q) => q.id);
    return opts.shuffle ? shuffled(list) : list;
  });
  const [pos, setPos] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [asking, setAsking] = useState(false);
  const [marks, setMarks] = useState<Record<string, Mark>>({});
  const [roundDone, setRoundDone] = useState(false);
  const [round, setRound] = useState(1);
  const token = useRef(0);
  const byId = useCallback((id: string) => questions.find((q) => q.id === id)!, [questions]);
  const speaks = (q: PlayQuestion) => q.expected.trim().length > 0;

  const mark = useCallback(
    (id: string, m: Mark, support?: Support | null) => {
      setMarks((x) => ({ ...x, [id]: m }));
      s.record(id, support !== undefined ? support : m === "knew" ? "NONE" : null);
    },
    [s],
  );

  async function play(i: number, ord: string[], askOpts?: Parameters<VoiceSession["ask"]>[1]) {
    const my = ++token.current;
    i = Math.max(0, i);
    s.stopAll();
    s.setFeedback(null);
    if (i >= ord.length) {
      setRoundDone(true);
      return;
    }
    setPos(i);
    setFlipped(false);
    setRoundDone(false);
    const q = byId(ord[i]);
    if (!speaks(q)) {
      setAsking(false);
      return; // look, turn and check yourself
    }
    setAsking(true);
    const r = await s.ask(q, askOpts);
    if (my !== token.current) return;
    setAsking(false);
    if (r === "aborted" || r === "skipped") return;
    mark(q.id, r === null ? "again" : "knew", r);
    if (!oneSide) setFlipped(true);
    await sleep(1600);
    if (my === token.current) play(i + 1, ord);
  }

  useEffect(() => {
    if (order.length) play(0, order);
    else setRoundDone(true);
    return () => {
      token.current++;
      s.stopAll();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const missed = order.filter((id) => marks[id] === "again");
  const knew = order.filter((id) => marks[id] === "knew");
  const allVoice = order.every((id) => speaks(byId(id)));

  // A round of spoken answers with nothing to practise ends the activity straight away.
  useEffect(() => {
    if (roundDone && allVoice && missed.length === 0 && s.phase !== "done") s.finish();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roundDone]);

  const q = roundDone ? null : byId(order[pos]);

  const flip = useCallback(() => {
    if (!q || oneSide) return;
    if (!flipped && speaks(q) && asking) s.raiseSupport("MODEL"); // seeing the answer first means it's not independent
    setFlipped((f) => !f);
  }, [q, oneSide, flipped, asking, s]);

  const answer = (m: Mark) => {
    if (!q) return;
    mark(q.id, m);
    play(pos + 1, order);
  };

  // Space turns the card; arrows move between cards.
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (roundDone || s.phase === "done") return;
      const el = e.target as HTMLElement;
      if (el.closest("input, textarea, select, [contenteditable]")) return;
      if (e.key === " " || e.code === "Space") {
        if (el.closest("button") && !el.closest("[data-card]")) return; // a focused button handles Space itself
        e.preventDefault();
        flip();
      } else if (e.key === "ArrowRight") play(pos + 1, order);
      else if (e.key === "ArrowLeft" && pos > 0) play(pos - 1, order);
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flip, pos, order, roundDone, s.phase]);

  if (s.phase === "done") {
    return (
      <div className="my-auto w-full max-w-lg rounded-[1.5rem] bg-paper p-6 text-ink">
        <DoneScreen s={s} exitHref={exitHref} />
      </div>
    );
  }

  if (roundDone || !q) {
    const practise = () => {
      const m = shuffled(missed);
      setOrder(m);
      setMarks({});
      setRound((r) => r + 1);
      play(0, m);
    };
    return (
      <div className="animate-pop-in my-auto w-full max-w-xl rounded-[1.5rem] bg-paper p-6 text-center text-ink" data-testid="round-results">
        <p className="font-display text-3xl font-bold sm:text-4xl">{round > 1 ? "¡Repaso terminado!" : "¡Ronda terminada!"}</p>
        <div className="mt-4 flex justify-center gap-3">
          <span className="rounded-2xl bg-leaf-soft px-4 py-3 font-bold text-leaf">
            <span className="block font-display text-3xl">{knew.length}</span> I knew
          </span>
          <span className="rounded-2xl bg-sun-soft px-4 py-3 font-bold text-[#7a5200]">
            <span className="block font-display text-3xl">{missed.length}</span> to practise
          </span>
        </div>
        {missed.length > 0 && (
          <ul className="mt-4 flex flex-wrap justify-center gap-2" aria-label="Cards to practise">
            {missed.slice(0, 12).map((id) => {
              const c = byId(id);
              return (
                <li key={id} className="flex h-14 min-w-14 max-w-32 items-center justify-center gap-1 rounded-xl border border-line bg-card px-2 text-sm font-bold">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {c.imageUrl && <img src={c.imageUrl} alt={c.imageAlt || c.displayText} className="h-10 w-10 object-contain" />}
                  {c.displayText && <span className="truncate">{plainText(c.displayText)}</span>}
                </li>
              );
            })}
            {missed.length > 12 && <li className="self-center text-sm text-muted">+{missed.length - 12}</li>}
          </ul>
        )}
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {missed.length > 0 && opts.practiceMissed !== false && (
            <button type="button" onClick={practise} className="h-12 rounded-full bg-teal px-6 font-bold text-white shadow-[0_2px_0_var(--color-teal-dark)] hover:bg-teal-dark">
              ↺ Practice the {missed.length} missed {missed.length === 1 ? "card" : "cards"}
            </button>
          )}
          <button type="button" onClick={onRestart} className="h-12 rounded-full bg-card px-6 font-bold ring-1 ring-line hover:ring-ink-2/40">⟲ Start again</button>
          <button type="button" onClick={() => s.finish()} className="h-12 rounded-full bg-coral px-6 font-bold text-white shadow-[0_2px_0_var(--color-coral-dark)] hover:bg-coral-dark">Finish</button>
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
  const showMarks = !speaks(q) && (oneSide || flipped);
  const iconBtn = "grid h-12 w-12 place-items-center rounded-full bg-white/10 text-xl text-white hover:bg-white/20 disabled:opacity-30";

  return (
    <div className="flex w-full flex-1 flex-col items-center">
      <div className="flex w-full max-w-xl items-center justify-between text-sm font-bold text-white/75">
        <span data-testid="card-counter">Card {pos + 1} of {order.length}</span>
        <button
          type="button"
          onClick={() => {
            const rest = shuffled(order.slice(pos));
            const o = [...order.slice(0, pos), ...rest];
            setOrder(o);
            play(pos, o);
          }}
          className="rounded-full px-3 py-1 hover:bg-white/10 hover:text-white"
        >
          🔀 Shuffle
        </button>
      </div>

      <div className="mt-2 flex w-full flex-1 items-center justify-center gap-2 sm:gap-4">
        <button type="button" onClick={() => play(pos - 1, order)} disabled={pos === 0} className={`${iconBtn} hidden sm:grid`} aria-label="Previous card">‹</button>
        <div className="h-[clamp(15rem,48dvh,27rem)] w-full max-w-xl [perspective:1400px] sm:h-[clamp(16rem,46dvh,27rem)]">
          <button
            type="button"
            data-card
            onClick={flip}
            aria-label={oneSide ? "Card" : flipped ? "Card, back. Turn it to see the front" : "Card, front. Turn it over"}
            className="relative block h-full w-full cursor-pointer transition-transform duration-500 [transform-style:preserve-3d] focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-sun"
            style={{ transform: flipped ? "rotateY(180deg)" : undefined }}
          >
            <span className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-[1.75rem] bg-card p-5 shadow-[0_10px_0_rgba(0,0,0,.18)] [backface-visibility:hidden] sm:p-8">
              <Face face={front} fallbackAlt="Card picture" big />
              {q.prompt && <span className="text-center font-display text-xl text-ink-2 sm:text-2xl">{plainText(q.prompt)}</span>}
              {!oneSide && <span className="absolute right-4 top-3 text-[11px] font-extrabold uppercase tracking-wider text-muted">Front</span>}
            </span>
            {!oneSide && (
              <span className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-[1.75rem] bg-teal-soft p-5 shadow-[0_10px_0_rgba(0,0,0,.18)] [backface-visibility:hidden] [transform:rotateY(180deg)] sm:p-8">
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
                <span className="absolute right-4 top-3 text-[11px] font-extrabold uppercase tracking-wider text-teal-dark">Back</span>
              </span>
            )}
          </button>
        </div>
        <button type="button" onClick={() => play(pos + 1, order)} className={`${iconBtn} hidden sm:grid`} aria-label="Next card">›</button>
      </div>

      {s.showHint && q.hint && <p className="mt-3 rounded-full bg-sun-soft px-4 py-1.5 font-semibold text-[#7a5200]">💡 {plainText(q.hint)}</p>}

      <div className="mt-4 flex w-full max-w-xl flex-wrap items-center justify-center gap-2">
        <button type="button" onClick={() => play(pos - 1, order)} disabled={pos === 0} className={`${iconBtn} sm:hidden`} aria-label="Previous card">‹</button>
        <button type="button" onClick={listen} disabled={!canListen} className={iconBtn} aria-label="Listen" title="Listen">🔊</button>
        {showMarks ? (
          <>
            <button type="button" onClick={() => answer("again")} className="h-12 rounded-full bg-sun px-5 font-bold text-ink shadow-[0_3px_0_#c99a1e] hover:brightness-105" data-testid="mark-again">
              ↺ Practice again
            </button>
            <button type="button" onClick={() => answer("knew")} className="h-12 rounded-full bg-leaf px-5 font-bold text-white shadow-[0_3px_0_#1f6b3f] hover:brightness-110" data-testid="mark-knew">
              ✓ I knew it
            </button>
          </>
        ) : (
          !oneSide && (
            <button type="button" onClick={flip} className="h-12 rounded-full bg-white px-6 font-bold text-ink hover:bg-paper" data-testid="turn-card">
              ↻ Turn card
            </button>
          )
        )}
        <button type="button" onClick={() => play(pos + 1, order)} className={`${iconBtn} sm:hidden`} aria-label="Next card">›</button>
      </div>
      {!speaks(q) && !oneSide && !flipped && <p className="mt-2 text-xs text-white/60">Click or tap the card, or press Space, to turn it.</p>}

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
    </div>
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
