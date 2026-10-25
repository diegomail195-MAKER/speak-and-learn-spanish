"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { ALPHABET, letterName, type LetterNameStyle } from "@/lib/alphabet";
import type { PlayQuestion } from "@/lib/games/types";
import { plainText } from "@/lib/text/segments";
import { CharKeys, DoneScreen, LetterTiles, VoiceDock } from "../parts";
import type { VoiceSession } from "../useVoiceSession";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Spell the Word. Voice mode: the student spells with Spanish letter names, in one go or in
 * several breaths, without pressing anything; letters fill in as they are heard.
 * Type mode: the word is typed and checked for letters, order, accents, ñ (and capitals).
 */
export function SpellBoard({ s, questions, exitHref }: { s: VoiceSession; questions: PlayQuestion[]; exitHref: string }) {
  const typeMode = s.game.options.spellMode === "type";
  const showWord = s.game.options.showWord === true;
  const style = (s.game.options.letterNames as LetterNameStyle) ?? "rae";
  const [index, setIndex] = useState(() => Math.max(0, questions.findIndex((q) => !(q.id in s.results))));
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const q = questions[index];

  const sayWord = (qq: PlayQuestion) => (qq.prompt ? s.say(qq.prompt, qq.promptAudioUrl) : s.say(qq.expected, qq.modelAudioUrl, qq.answerLanguage));

  // Voice mode: one word after another, answered by voice.
  useEffect(() => {
    if (typeMode) return;
    let live = true;
    (async () => {
      for (let i = index; i < questions.length && live; i++) {
        const qq = questions[i];
        if (qq.id in s.results) continue;
        setIndex(i);
        const r = await s.ask(qq, { prompt: () => sayWord(qq) });
        if (r === "aborted" || !live) return;
        s.record(qq.id, r === "skipped" ? null : r);
        await sleep(600);
      }
      if (live) await s.finish();
    })();
    return () => {
      live = false;
      s.stopAll();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Type mode: say the word when it appears.
  useEffect(() => {
    if (!typeMode || !q || s.phase === "done") return;
    setTyped("");
    setRevealed(false);
    s.setFeedback(null);
    sayWord(q);
    inputRef.current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeMode, index]);

  async function submit() {
    if (!q || busy) return;
    setBusy(true);
    try {
      const { next, support } = await s.check(q, typed, "typed");
      if (next === "retry") return;
      if (next === "done") setRevealed(true);
      s.record(q.id, next === "correct" ? support : null);
      await sleep(next === "done" ? 2200 : 900);
      const nextIndex = questions.findIndex((x, k) => k > index && !(x.id in s.results));
      if (nextIndex === -1) await s.finish();
      else setIndex(nextIndex);
    } finally {
      setBusy(false);
    }
  }

  if (s.phase === "done") return <DoneScreen s={s} exitHref={exitHref} />;
  if (!q) return null;

  return (
    <div className="flex w-full flex-1 flex-col items-center">
      <p className="mt-1 text-sm font-bold text-muted">
        Word {index + 1} of {questions.length}
      </p>
      {q.imageUrl && (
        <div key={q.id} className="animate-pop-in mt-2 w-full max-w-xs overflow-hidden rounded-[1.75rem] border border-line bg-card p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={q.imageUrl} alt="Picture of the word" className="mx-auto aspect-[4/3] w-full rounded-2xl object-contain" />
        </div>
      )}
      {q.prompt && <p className="mt-3 text-center font-display text-3xl font-semibold">{plainText(q.prompt)}</p>}
      {(showWord || revealed) && <p className="mt-2 font-display text-4xl font-semibold tracking-wide">{plainText(q.expected)}</p>}
      <Button variant="secondary" className="mt-3" onClick={() => sayWord(q)}>🔊 Hear the word</Button>

      {typeMode ? (
        <form
          className="mt-5 flex w-full max-w-md flex-col items-center gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <input
            ref={inputRef}
            value={typed}
            onInput={(e) => setTyped((e.target as HTMLInputElement).value)}
            onChange={(e) => setTyped(e.target.value)}
            aria-label="Type the word"
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            lang={s.game.language === "es-419" ? "es" : s.game.language}
            className="h-16 w-full rounded-2xl border-2 border-line bg-card px-4 text-center font-display text-3xl tracking-wider focus:border-sky focus:outline-none"
          />
          <CharKeys target={inputRef} language={s.game.language} />
          <Button type="submit" variant="voice" size="lg" disabled={busy || !typed.trim()}>Check</Button>
        </form>
      ) : (
        <LetterTiles expected={q.expected} heard={s.heardLetters} reveal={showWord} />
      )}

      {!typeMode && (
        <details className="mt-4 w-full max-w-2xl">
          <summary className="cursor-pointer text-center text-sm font-bold text-muted">🔤 Hear the letter names</summary>
          <div className="mt-2 flex flex-wrap justify-center gap-1.5">
            {ALPHABET.map((l) => (
              <button key={l.upper} type="button" onClick={() => s.say(letterName(l.upper, style), null, "es-419")} className="h-11 min-w-11 rounded-xl border border-line bg-card px-2 font-display text-lg font-semibold hover:border-teal hover:bg-teal-soft" aria-label={`Letter ${l.upper}: ${letterName(l.upper, style)}`}>
                {l.upper}
              </button>
            ))}
          </div>
        </details>
      )}

      {s.showHint && q.hint && <p className="mt-3 rounded-full bg-sun-soft px-4 py-1.5 font-semibold text-[#7a5200]">💡 {plainText(q.hint)}</p>}
      <VoiceDock s={s} />
    </div>
  );
}
