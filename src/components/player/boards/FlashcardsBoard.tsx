"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import type { PlayFace, PlayQuestion } from "@/lib/games/types";
import { plainText } from "@/lib/text/segments";
import { DoneScreen, VoiceDock, shuffled } from "../parts";
import type { VoiceSession } from "../useVoiceSession";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** A face: picture, text and a 🔊 marker when it only has audio. */
function Face({ face, fallbackAlt }: { face: PlayFace; fallbackAlt: string }) {
  return (
    <>
      {face.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={face.imageUrl} alt={face.imageAlt || face.text || fallbackAlt} className="max-h-[60%] w-full rounded-2xl object-contain" />
      )}
      {face.text && <span className="text-center font-display text-3xl font-semibold">{plainText(face.text)}</span>}
      {!face.imageUrl && !face.text && face.audio && <span className="text-6xl" aria-hidden>🔊</span>}
    </>
  );
}

/**
 * Flashcards: the front shows the picture, word and question; when the card has a spoken
 * answer the student answers out loud (no click needed). Flipping or hearing the model before
 * answering makes the card "guided". Cards without an answer are look–flip–listen cards.
 * The 🔊 button plays only the visible face's audio. Missed cards can be practised again.
 */
export function FlashcardsBoard({ s, questions, exitHref }: { s: VoiceSession; questions: PlayQuestion[]; exitHref: string }) {
  const opts = s.game.options;
  const [order, setOrder] = useState<string[]>(() => {
    const ids = questions.filter((q) => !(q.id in s.results)).map((q) => q.id);
    return opts.shuffle ? shuffled(ids) : ids;
  });
  const [pos, setPos] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [asking, setAsking] = useState(false);
  const [missed, setMissed] = useState<string[]>([]);
  const [roundDone, setRoundDone] = useState(false);
  const token = useRef(0);
  const byId = (id: string) => questions.find((q) => q.id === id)!;
  const oneSide = opts.sides === "one";
  const speaks = (q: PlayQuestion) => q.expected.trim().length > 0;

  async function play(i: number, ord: string[], askOpts?: Parameters<VoiceSession["ask"]>[1]) {
    const my = ++token.current;
    i = Math.max(0, i);
    s.stopAll();
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
      return; // look, flip and listen: the student moves on with "Next"
    }
    setAsking(true);
    const r = await s.ask(q, askOpts);
    if (my !== token.current) return;
    setAsking(false);
    if (r === "aborted" || r === "skipped") return;
    s.record(q.id, r);
    if (r === null) setMissed((m) => [...new Set([...m, q.id])]);
    else setMissed((m) => m.filter((x) => x !== q.id));
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

  useEffect(() => {
    if (roundDone && (!opts.practiceMissed || missed.length === 0) && s.phase !== "done") s.finish();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roundDone, missed.length]);

  if (s.phase === "done") return <DoneScreen s={s} exitHref={exitHref} />;

  if (roundDone) {
    return (
      <div className="animate-pop-in my-auto text-center">
        <p className="font-display text-4xl font-semibold">¡Ronda terminada!</p>
        <p className="mt-2 text-ink-2">{missed.length} {missed.length === 1 ? "card" : "cards"} to practise again.</p>
        <div className="mt-6 flex justify-center gap-3">
          <Button variant="voice" size="lg" onClick={() => { const m = shuffled(missed); setOrder(m); play(0, m); }}>Practice missed cards</Button>
          <Button variant="secondary" size="lg" onClick={() => s.finish()}>Finish</Button>
        </div>
      </div>
    );
  }

  const q = byId(order[pos]);
  if (!q) return null;
  const flip = () => {
    if (oneSide) return;
    if (!flipped && speaks(q)) s.raiseSupport("MODEL"); // seeing the answer first means it's not independent
    if (!flipped && q.back?.imageUrl) s.markPictureUsed(); // evidence for "You used the picture…"
    setFlipped((f) => !f);
  };
  const front: PlayFace = { text: q.displayText, imageUrl: q.imageUrl, imageAlt: q.imageAlt, audio: q.audio };
  const visibleAudio = flipped ? q.back?.audio : q.audio;
  const listen = () => {
    if (visibleAudio) return s.say(visibleAudio.text, visibleAudio.url, visibleAudio.language);
    if (flipped || s.repeat()) return null;
    return s.say(q.prompt || q.displayText || q.expected, q.prompt ? q.promptAudioUrl : null);
  };

  return (
    <div className="flex w-full flex-1 flex-col items-center">
      <p className="mt-1 text-sm font-bold text-muted">
        Card {pos + 1} of {order.length}
      </p>
      <div className="mt-3 w-full max-w-md [perspective:1200px]">
        <button
          type="button"
          onClick={flip}
          aria-label={oneSide ? "Card" : flipped ? "Show the front" : "Flip the card"}
          className="relative block aspect-[4/5] w-full transition-transform duration-500 [transform-style:preserve-3d]"
          style={{ transform: flipped ? "rotateY(180deg)" : undefined }}
        >
          <span className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-[2rem] border-2 border-line bg-card p-6 shadow-soft [backface-visibility:hidden]">
            <Face face={front} fallbackAlt="Card picture" />
            {q.prompt && <span className="text-center font-display text-2xl text-ink-2">{plainText(q.prompt)}</span>}
            {!oneSide && <span className="absolute bottom-3 right-4 text-xs font-bold uppercase tracking-wider text-muted">Front</span>}
          </span>
          {!oneSide && (
            <span className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-[2rem] border-2 border-teal/40 bg-teal-soft p-6 shadow-soft [backface-visibility:hidden] [transform:rotateY(180deg)]">
              {q.back ? (
                <>
                  <Face face={q.back} fallbackAlt="Back of the card" />
                  {speaks(q) && plainText(q.expected) !== plainText(q.back.text) && <span className="text-center text-lg font-semibold text-teal-dark">{plainText(q.expected)}</span>}
                </>
              ) : (
                <>
                  <span className="text-center font-display text-4xl font-semibold text-teal-dark">{plainText(q.expected)}</span>
                  {q.data.translation && <span className="text-center text-xl text-ink-2">{plainText(q.data.translation)}</span>}
                </>
              )}
              <span className="absolute bottom-3 right-4 text-xs font-bold uppercase tracking-wider text-teal-dark">Back</span>
            </span>
          )}
        </button>
      </div>
      {s.showHint && q.hint && <p className="mt-3 rounded-full bg-sun-soft px-4 py-1.5 font-semibold text-[#7a5200]">💡 {plainText(q.hint)}</p>}
      <VoiceDock s={s} showControls={false}>
        <Button variant="ghost" onClick={() => play(pos - 1, order)} disabled={pos === 0}>← Previous</Button>
        <Button variant="secondary" onClick={listen} disabled={flipped && !visibleAudio}>🔊 Listen</Button>
        {!oneSide && <Button variant="secondary" onClick={flip}>↻ Flip</Button>}
        {speaks(q) && (
          <Button
            variant="secondary"
            onClick={async () => {
              // Repeating after the model is guided practice, never independent.
              const model = () => s.say(q.expected, q.modelAudioUrl, q.answerLanguage);
              if (!asking) return play(pos, order, { initialSupport: "MODEL", prompt: model });
              s.raiseSupport("MODEL");
              await model();
            }}
          >
            🔁 Repeat
          </Button>
        )}
        {speaks(q) && !asking && <Button variant="voice" onClick={() => play(pos, order)}>🎤 Speak</Button>}
        <Button variant="ghost" onClick={() => play(pos + 1, order)}>Next card →</Button>
        <Button variant="ghost" onClick={() => { const rest = shuffled(order.slice(pos)); const o = [...order.slice(0, pos), ...rest]; setOrder(o); play(pos, o); }}>🔀 Shuffle</Button>
        {speaks(q) && <Button variant="ghost" onClick={s.stopMic} aria-label="Stop the microphone">■ Stop mic</Button>}
      </VoiceDock>
    </div>
  );
}
