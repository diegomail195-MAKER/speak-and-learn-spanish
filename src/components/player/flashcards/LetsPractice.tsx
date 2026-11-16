"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { PlayFace, PlayGame, PlayQuestion } from "@/lib/games/types";
import { plainText } from "@/lib/text/segments";
import { VoiceDock, shuffled } from "../parts";
import { useVoiceSession } from "../useVoiceSession";

type Lang = PlayGame["language"];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** A rough guess of the language a short card text is written in. */
function guessLang(text: string, fallback: Lang): Lang {
  const t = text.toLowerCase();
  if (/[áéíóúñ¿¡]/.test(t) || /^(el|la|los|las|un|una|unos|unas)\s/.test(t)) return "es-419";
  if (/[àâçèêëîïôûœ]/.test(t) || /^(le|les|une|des)\s/.test(t)) return "fr-FR";
  if (/^(the|a|an)\s/.test(t)) return "en-US";
  return fallback;
}

const asLang = (l: string | undefined): Lang | undefined => (l === "es-419" || l === "en-US" || l === "fr-FR" ? l : undefined);

export interface PracticeCard {
  q: PlayQuestion;
  /** What the student sees: a picture and/or words. */
  show: Pick<PlayFace, "text" | "imageUrl" | "imageAlt">;
}

/**
 * Turns the deck into speaking questions, the way a teacher would ask them: the card's spoken
 * answer when it has one; otherwise the front is shown and the back is said; a card whose back is
 * only a picture shows that picture and the front's words are said. Cards with nothing to say
 * are left out.
 */
export function practiceCards(game: PlayGame): PracticeCard[] {
  const out: PracticeCard[] = [];
  for (const q of game.questions) {
    const frontText = plainText(q.displayText ?? "");
    const backText = plainText(q.back?.text ?? "");
    const front = { text: q.displayText, imageUrl: q.imageUrl, imageAlt: q.imageAlt };
    let expected = "";
    let answerLanguage: Lang = q.answerLanguage;
    let show = front;
    if (plainText(q.expected)) {
      expected = q.expected;
    } else if (backText && (frontText || q.imageUrl)) {
      expected = q.back!.text;
      answerLanguage = guessLang(backText, q.data.translationLanguage ?? asLang(q.back?.audio?.language) ?? game.language);
      if (q.imageUrl && frontText) show = { ...front, text: "" }; // the picture asks; the front's words would give a hint
    } else if (frontText && q.back?.imageUrl) {
      expected = q.displayText;
      answerLanguage = guessLang(frontText, game.language);
      show = { text: "", imageUrl: q.back.imageUrl, imageAlt: q.back.imageAlt };
    } else if (frontText && q.imageUrl) {
      expected = q.displayText;
      answerLanguage = guessLang(frontText, game.language);
      show = { ...front, text: "" };
    }
    if (!plainText(expected)) continue;
    out.push({
      q: { ...q, expected, answerLanguage, mode: "PHRASE", accepted: q.accepted ?? [], supportText: "", hint: q.hint ?? "", audio: null, modelAudioUrl: plainText(q.expected) ? q.modelAudioUrl : null },
      show,
    });
  }
  return out;
}

/**
 * "¡Vamos a practicar! Let's practice!": after the cards, the same cards come back as questions
 * (picture and words) and the student answers out loud. The microphone is asked for here, from a
 * click; if it is blocked the student is told how to turn it on.
 */
export function LetsPractice({ game, onDone, onBack }: { game: PlayGame; onDone: () => void; onBack: () => void }) {
  const cards = useMemo(() => {
    const list = practiceCards(game);
    return game.options.shuffle ? shuffled(list) : list;
  }, [game]);
  const practiceGame = useMemo<PlayGame>(
    () => ({ ...game, instructions: "", settings: { ...game.settings, acceptShortAnswer: true, showAnswerText: false }, questions: cards.map((c) => c.q) }),
    [game, cards],
  );
  const p = useVoiceSession(practiceGame, { mode: "preview" });
  const [stage, setStage] = useState<"intro" | "cards" | "end">("intro");
  const [pos, setPos] = useState(0);
  const [right, setRight] = useState<Record<string, boolean>>({});
  const [overlay, setOverlay] = useState<"good" | "again" | null>(null);
  const run = useRef(0);

  useEffect(() => () => p.stopMic(), []); // eslint-disable-line react-hooks/exhaustive-deps

  async function go(i: number) {
    const my = ++run.current;
    setOverlay(null);
    if (i >= cards.length) {
      p.stopMic();
      setStage("end");
      return;
    }
    setPos(i);
    const r = await p.ask(cards[i].q);
    if (my !== run.current || r === "aborted") return;
    if (r === "skipped") return go(i + 1);
    const ok = r !== null;
    setRight((x) => ({ ...x, [cards[i].q.id]: ok }));
    setOverlay(ok ? "good" : "again");
    await sleep(1200);
    if (my === run.current) go(i + 1);
  }

  async function begin() {
    if (!(await p.start(true))) return;
    setRight({});
    setStage("cards");
    void go(0);
  }

  if (stage === "intro") {
    const blocked = p.micState === "denied";
    return (
      <div className="animate-pop-in my-auto w-full max-w-lg rounded-[1.5rem] bg-paper p-6 text-center text-ink" data-testid="lets-practice-intro">
        <p className="text-5xl" aria-hidden>🎤</p>
        <h2 className="mt-2 font-display text-3xl font-bold">¡Vamos a practicar!</h2>
        <p className="font-display text-xl font-semibold text-teal-dark">Let&apos;s practice!</p>
        <p className="mt-3 text-ink-2">
          Mira cada tarjeta y responde en voz alta. <span className="text-muted">Look at each card and say the answer out loud.</span>
        </p>
        <p className="mt-1 text-sm text-muted">
          {cards.length} {cards.length === 1 ? "pregunta" : "preguntas"}
        </p>
        {blocked && (
          <p className="mt-4 rounded-xl2 bg-coral-soft p-3 text-left text-sm text-coral-dark" data-testid="mic-blocked">
            <strong>Activa tu micrófono · Turn on your microphone.</strong> Haz clic en el candado junto a la dirección web, pon Micrófono en “Permitir” y vuelve a intentarlo. (Click the lock next to the web address, set Microphone to “Allow”, then try again.)
          </p>
        )}
        {p.micState === "unavailable" && <p className="mt-4 rounded-xl2 bg-coral-soft p-3 text-sm text-coral-dark">No encontramos un micrófono. Conecta uno o revisa la configuración. (No microphone was found.)</p>}
        {p.error && <p className="mt-4 rounded-xl2 bg-coral-soft p-3 text-sm text-coral-dark">{p.error}</p>}
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button type="button" onClick={onBack} className="h-12 rounded-full bg-card px-5 font-bold ring-1 ring-line hover:ring-ink-2/40">‹ Back</button>
          <button
            type="button"
            onClick={begin}
            disabled={p.micState === "requesting" || cards.length === 0}
            data-testid="lets-practice-start"
            className="h-12 rounded-full bg-coral px-6 font-bold text-white shadow-[0_3px_0_var(--color-coral-dark)] hover:bg-coral-dark disabled:opacity-60"
          >
            {p.micState === "requesting" ? "Permite el micrófono… (Allow the mic)" : blocked ? "🎤 Intentar de nuevo · Try again" : "🎤 Activar micrófono y empezar"}
          </button>
        </div>
      </div>
    );
  }

  if (stage === "end") {
    const score = cards.filter((c) => right[c.q.id]).length;
    return (
      <div className="animate-pop-in my-auto w-full max-w-md rounded-[1.5rem] bg-paper p-6 text-center text-ink" data-testid="lets-practice-results">
        <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-coral">Let&apos;s practice!</p>
        <p className="mt-1 font-display text-3xl font-bold">{score === cards.length ? "¡Excelente!" : "¡Buen trabajo!"}</p>
        <p className="mt-4 font-display text-4xl font-bold text-leaf" data-testid="practice-score">{score}/{cards.length}</p>
        <p className="text-sm text-muted">respuestas habladas correctas · spoken answers right</p>
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
      <div className="relative mt-3 flex h-[clamp(13rem,calc(100dvh-27rem),44rem)] w-full max-w-5xl flex-col items-center justify-center gap-3 rounded-[1.75rem] bg-card p-4 text-ink shadow-[0_10px_0_rgba(0,0,0,.18)]">
        {c.show.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={c.show.imageUrl} alt={c.show.imageAlt || text || "Card picture"} className="min-h-0 w-full flex-1 object-contain" draggable={false} />
        )}
        {text && <span className="text-center font-display text-3xl font-bold sm:text-5xl">{text}</span>}
        {c.q.prompt ? <span className="text-center font-display text-xl text-ink-2 sm:text-2xl">{plainText(c.q.prompt)}</span> : <span className="text-center text-base font-semibold text-muted">Di la respuesta · Say the answer</span>}
        {overlay && (
          <span aria-live="polite" className={`animate-pop-in pointer-events-none absolute inset-0 grid place-items-center rounded-[1.75rem] ${overlay === "good" ? "bg-leaf/25" : "bg-coral/25"}`}>
            <span className={`grid h-28 w-28 place-items-center rounded-full text-6xl font-bold text-white shadow-lg ${overlay === "good" ? "bg-leaf" : "bg-coral"}`}>{overlay === "good" ? "✓" : "✗"}</span>
          </span>
        )}
      </div>
      <div className="mt-3 w-full max-w-2xl rounded-[1.25rem] bg-paper px-3 pb-3 text-ink">
        <VoiceDock s={p} showControls={false}>
          <button type="button" className="h-11 rounded-full bg-card px-5 font-bold ring-1 ring-line" onClick={() => (p.unlock(), p.raiseSupport("MODEL"), p.say(c.q.expected, c.q.modelAudioUrl, c.q.answerLanguage))}>🔊 Escuchar la respuesta</button>
          <button type="button" className="h-11 rounded-full px-4 font-bold text-ink-2 hover:bg-paper-2" onClick={p.skip} data-testid="practice-skip">Siguiente →</button>
        </VoiceDock>
      </div>
    </div>
  );
}
