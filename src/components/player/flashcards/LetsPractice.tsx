"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { PRACTICE, clipKey, practiceCards, type Lang, type Line } from "@/lib/games/practice";
import type { PlayGame } from "@/lib/games/types";
import { plainText } from "@/lib/text/segments";
import { VoiceDock, shuffled } from "../parts";
import { useVoiceSession, type Coach, type CoachLine } from "../useVoiceSession";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export type Clips = Record<string, string>;
const loaded = new Map<string, Promise<Clips>>();

/** The natural-voice clips of the speaking round, fetched once in the background. */
export function usePracticeClips(url: string | undefined, enabled: boolean): Clips {
  const [clips, setClips] = useState<Clips>({});
  useEffect(() => {
    if (!url || !enabled) return;
    let alive = true;
    if (!loaded.has(url)) {
      loaded.set(
        url,
        fetch(url, { method: "POST", credentials: "same-origin" })
          .then((r) => (r.ok ? r.json() : { clips: {} }))
          .then((j: { clips?: Clips }) => j.clips ?? {})
          .catch(() => {
            loaded.delete(url);
            return {};
          }),
      );
    }
    loaded.get(url)!.then((c) => alive && setClips(c));
    return () => {
      alive = false;
    };
  }, [url, enabled]);
  return clips;
}

const pickOf = (list: readonly Line[]): Line => list[Math.floor(Math.random() * list.length)];

/** A fixed line, said first in Spanish and then in English (natural-voice clips when available). */
export function lineFor(l: Line, _lang: Lang, clips: Clips): CoachLine {
  return {
    text: l.es,
    sub: l.en,
    url: clips[clipKey("es-419", l.es)] ?? null,
    language: "es-419",
    then: { text: l.en, url: clips[clipKey("en-US", l.en)] ?? null, language: "en-US" },
  };
}

/** Says a line in Spanish, then in English (both natural voices when available). */
export async function sayBoth(sayFn: (text: string, url?: string | null, language?: Lang) => Promise<void>, l: Line, clips: Clips) {
  await sayFn(l.es, clips[clipKey("es-419", l.es)] ?? null, "es-419");
  await sayFn(l.en, clips[clipKey("en-US", l.en)] ?? null, "en-US");
}

/**
 * "¡Vamos a practicar! Let's practice!": after the cards, the same cards come back as questions
 * (picture and question, e.g. "¿Qué color es este?") and the student answers out loud. The
 * microphone turns on as the round opens; if it is blocked the student is told how to allow it.
 * Feedback follows the Montessori library: a first miss means "look again" (no answer), the
 * answer is only said after the second try.
 */
export function LetsPractice({ game, clips, onDone }: { game: PlayGame; clips: Clips; onDone: () => void }) {
  const cards = useMemo(() => {
    const list = practiceCards(game);
    return game.options.shuffle ? shuffled(list) : list;
  }, [game]);
  const practiceGame = useMemo<PlayGame>(
    () => ({ ...game, instructions: "", settings: { ...game.settings, acceptShortAnswer: true, showAnswerText: false, maxTries: 2 }, questions: cards.map((c) => c.q) }),
    [game, cards],
  );
  const p = useVoiceSession(practiceGame, { mode: "preview" });
  const [stage, setStage] = useState<"mic" | "cards" | "end">("mic");
  const [pos, setPos] = useState(0);
  const [right, setRight] = useState<Record<string, boolean>>({});
  const [overlay, setOverlay] = useState<"good" | "again" | null>(null);
  const run = useRef(0);
  const clipsRef = useRef(clips);
  clipsRef.current = clips;

  useEffect(() => {
    void begin(); // the click on "¡Vamos a practicar!" opens the round: turn the microphone on now
    return () => p.stopMic();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const lang = (i: number): Lang => cards[i]?.q.answerLanguage ?? game.language;
  const coachFor =
    (i: number): Coach =>
    (event, info) => {
      const c = clipsRef.current;
      if (event === "correct") return lineFor(pickOf(info.tries > 0 ? PRACTICE.corrected : PRACTICE.correct), lang(i), c);
      if (event === "retry") return lineFor(pickOf(PRACTICE.retry), lang(i), c);
      if (event === "model") return lineFor(PRACTICE.model[0], lang(i), c);
      if (event === "uncertain") return lineFor(PRACTICE.uncertain[0], lang(i), c);
      return lineFor(PRACTICE.waiting[0], lang(i), c);
    };

  async function go(i: number) {
    const my = ++run.current;
    setOverlay(null);
    if (i >= cards.length) {
      setStage("end");
      p.setFeedback(null);
      await sayBoth(p.say, PRACTICE.done, clipsRef.current);
      p.stopMic();
      return;
    }
    setPos(i);
    const card = cards[i];
    // The question in Spanish, then in English (a teacher's own prompt is said as written).
    const question = async () => {
      const c = clipsRef.current;
      if (card.ask) {
        await p.say(card.ask.es, c[clipKey("es-419", card.ask.es)] ?? null, "es-419");
        await p.say(card.ask.en, c[clipKey("en-US", card.ask.en)] ?? null, "en-US");
      } else await p.say(card.question, card.q.promptAudioUrl, game.language);
    };
    const q = { ...card.q, modelAudioUrl: card.q.modelAudioUrl ?? clipsRef.current[clipKey(card.q.answerLanguage, card.q.expected)] ?? null };
    const r = await p.ask(q, { prompt: question, coach: coachFor(i) });
    if (my !== run.current || r === "aborted") return;
    if (r === "skipped") return go(i + 1);
    const ok = r !== null;
    setRight((x) => ({ ...x, [card.q.id]: ok }));
    setOverlay(ok ? "good" : "again");
    await sleep(1100);
    if (my === run.current) go(i + 1);
  }

  async function begin() {
    if (!(await p.start(true))) {
      setStage("mic");
      return;
    }
    setRight({});
    setStage("cards");
    setPos(0);
    await sayBoth(p.say, PRACTICE.start, clipsRef.current);
    void go(0);
  }

  if (stage === "mic") {
    const blocked = p.micState === "denied";
    const asking = p.micState === "requesting" || p.micState === "idle";
    return (
      <div className="animate-pop-in my-auto w-full max-w-lg rounded-[1.5rem] bg-paper p-6 text-center text-ink" data-testid="lets-practice-intro">
        <p className="text-5xl" aria-hidden>🎤</p>
        <h2 className="mt-2 font-display text-3xl font-bold">¡Vamos a practicar!</h2>
        <p className="font-display text-xl font-semibold text-teal-dark">Let&apos;s practice!</p>
        {asking && !p.error && (
          <p className="mt-3 text-ink-2">
            Activa el micrófono: pulsa “Permitir”. <span className="text-muted">Turn on the microphone: press “Allow”.</span>
          </p>
        )}
        {blocked && (
          <p className="mt-4 rounded-xl2 bg-coral-soft p-3 text-left text-sm text-coral-dark" data-testid="mic-blocked">
            <strong>Activa tu micrófono · Turn on your microphone.</strong> Haz clic en el candado junto a la dirección web, pon Micrófono en “Permitir” y pulsa el botón. (Click the lock next to the web address, set Microphone to “Allow”, then press the button.)
          </p>
        )}
        {p.micState === "unavailable" && <p className="mt-4 rounded-xl2 bg-coral-soft p-3 text-sm text-coral-dark">No encontramos un micrófono. Conecta uno o revisa la configuración. (No microphone was found.)</p>}
        {p.error && <p className="mt-4 rounded-xl2 bg-coral-soft p-3 text-sm text-coral-dark">{p.error}</p>}
        {!asking && (
          <button type="button" onClick={begin} data-testid="lets-practice-start" className="mt-6 h-12 rounded-full bg-coral px-6 font-bold text-white shadow-[0_3px_0_var(--color-coral-dark)] hover:bg-coral-dark">
            🎤 Activar micrófono · Turn on the mic
          </button>
        )}
      </div>
    );
  }

  if (stage === "end") {
    const score = cards.filter((c) => right[c.q.id]).length;
    const missed = cards.length - score;
    return (
      <div className="animate-pop-in my-auto w-full max-w-md rounded-[1.5rem] bg-paper p-6 text-center text-ink" data-testid="lets-practice-results">
        <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-coral">¡Vamos a practicar! · Let&apos;s practice!</p>
        <p className="mt-1 font-display text-2xl font-bold">Completaste la actividad.</p>
        <p className="text-sm text-muted">You completed the activity.</p>
        <p className="mt-4 font-display text-4xl font-bold text-leaf" data-testid="practice-score">{score}/{cards.length}</p>
        <p className="text-sm text-ink-2">
          Reconociste {score} de {cards.length}.{missed ? " Repasemos las demás." : ""}{" "}
          <span className="text-muted">You recognized {score} of {cards.length}.{missed ? " Let's revisit the rest." : ""}</span>
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button type="button" onClick={begin} className="h-12 rounded-full bg-teal px-5 font-bold text-white shadow-[0_2px_0_var(--color-teal-dark)] hover:bg-teal-dark">⟲ Practicar otra vez</button>
          <button type="button" onClick={onDone} className="h-12 rounded-full bg-coral px-5 font-bold text-white shadow-[0_2px_0_var(--color-coral-dark)] hover:bg-coral-dark">Finish</button>
        </div>
      </div>
    );
  }

  const c = cards[pos];
  const text = plainText(c.show.text ?? "");
  return (
    <div className="flex w-full flex-1 flex-col items-center" data-testid="lets-practice">
      <div className="grid w-full max-w-6xl grid-cols-[1fr_auto_1fr] items-center font-display text-lg font-bold sm:text-xl">
        <span className="text-sun">🎤 Let&apos;s practice!</span>
        <span className="tabular-nums" data-testid="practice-counter">{pos + 1} of {cards.length}</span>
        <span className="justify-self-end tabular-nums text-white/85">✓ {Object.values(right).filter(Boolean).length}</span>
      </div>
      <div className="relative mt-3 flex h-[clamp(13rem,calc(100dvh-27rem),44rem)] w-full max-w-5xl flex-col items-center justify-center gap-2 rounded-[1.75rem] bg-card p-4 text-ink shadow-[0_10px_0_rgba(0,0,0,.18)]">
        {c.show.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={c.show.imageUrl} alt={c.show.imageAlt || text || "Card picture"} className="min-h-0 w-full flex-1 object-contain" draggable={false} />
        )}
        {text && <span className="text-center font-display text-3xl font-bold sm:text-5xl">{text}</span>}
        <span className="text-center font-display text-2xl font-bold text-ink sm:text-3xl" data-testid="practice-question">{plainText(c.ask ? c.ask.es : c.question)}</span>
        {c.ask && <span className="-mt-1 text-center text-lg font-semibold text-muted">{c.ask.en}</span>}
        {overlay && (
          <span aria-live="polite" className={`animate-pop-in pointer-events-none absolute inset-0 grid place-items-center rounded-[1.75rem] ${overlay === "good" ? "bg-leaf/25" : "bg-coral/25"}`}>
            <span className={`grid h-28 w-28 place-items-center rounded-full text-6xl font-bold text-white shadow-lg ${overlay === "good" ? "bg-leaf" : "bg-coral"}`}>{overlay === "good" ? "✓" : "→"}</span>
          </span>
        )}
      </div>
      <div className="mt-3 w-full max-w-2xl rounded-[1.25rem] bg-paper px-3 pb-3 text-ink">
        <VoiceDock s={p} showControls={false}>
          <button type="button" className="h-11 rounded-full bg-card px-5 font-bold ring-1 ring-line" onClick={() => (p.unlock(), p.repeat())} disabled={p.phase !== "listening"}>
            🔊 Escuchar la pregunta
          </button>
          <button type="button" className="h-11 rounded-full px-4 font-bold text-ink-2 hover:bg-paper-2" onClick={p.skip} data-testid="practice-skip">
            Siguiente →
          </button>
        </VoiceDock>
      </div>
    </div>
  );
}
