"use client";

import { useMemo, useState } from "react";
import { FeedbackBubble, MicIndicator } from "@/components/player/parts";
import { useVoiceSession } from "@/components/player/useVoiceSession";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { ALPHABET, LETTER_STYLES, letterName, type LetterNameStyle } from "@/lib/alphabet";
import type { PlayGame } from "@/lib/games/types";

type Config = Pick<PlayGame, "sttProvider" | "sttLocale" | "sttLocales">;

/**
 * The Spanish alphabet: 27 letters, upper and lower case, letter names with their common
 * regional variants, and example words. Listen plays the name; Repeat opens the microphone and
 * checks the letter the child says (any common name counts). Practice only: nothing is saved.
 */
export function AlphabetExplorer({ config, audience }: { config: Config; audience: "teacher" | "student" }) {
  const [style, setStyle] = useState<LetterNameStyle>("rae");
  const [sel, setSel] = useState(0);
  const [lower, setLower] = useState(false);
  const game = useMemo<PlayGame>(
    () => ({
      gameId: "alphabet",
      title: "El abecedario",
      instructions: "",
      templateKey: "ALPHABET",
      language: "es-419",
      ...config,
      board: "sequence",
      options: { letterNames: style },
      diagramImageUrl: null,
      settings: { acceptShortAnswer: false, maxTries: 3, showAnswerText: true, rate: 0.9 },
      phraseAudio: {},
      questions: ALPHABET.map((L) => ({
        id: L.upper,
        prompt: "",
        promptAudioUrl: null,
        supportText: "",
        supportLanguage: "en-US",
        supportAudioUrl: null,
        imageUrl: null,
        displayText: `${L.upper} ${L.lower}`,
        expected: L.upper,
        accepted: [],
        mode: "LETTERS",
        hint: `${L.upper} de ${L.examples[0]}`,
        hintAudioUrl: null,
        modelAudioUrl: null,
        answerLanguage: "es-419",
        data: {},
      })),
    }),
    [config, style],
  );
  const s = useVoiceSession(game, { mode: "preview" });
  const L = ALPHABET[sel];
  const q = game.questions[sel];
  const name = letterName(L.upper, style);
  const otherNames = [L.name, ...L.variants].filter((n) => n !== name);
  const busy = s.phase === "speaking" || s.phase === "listening";
  const micOpen = s.usesMic && s.micState !== "idle" && s.micState !== "denied";

  async function listen() {
    s.stopAll();
    s.setFeedback(null);
    await s.say(name);
  }

  async function repeat() {
    s.stopAll();
    if (!micOpen && !(await s.start(true))) return;
    const r = await s.ask(q, { prompt: async () => { await s.say(name); } });
    if (r !== "aborted") s.record(q.id, r === "skipped" ? null : r);
  }

  function go(i: number) {
    s.stopAll();
    s.setFeedback(null);
    setSel((i + ALPHABET.length) % ALPHABET.length);
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <label className="flex min-w-0 max-w-full items-center gap-2 text-sm font-bold text-ink-2">
          <span className="shrink-0">Letter names</span>
          <select value={style} onChange={(e) => setStyle(e.target.value as LetterNameStyle)} className="min-h-10 w-full min-w-0 max-w-xs rounded-lg border-[1.5px] border-line-strong bg-card px-2 py-1 text-sm font-normal">
            {LETTER_STYLES.map((st) => <option key={st.value} value={st.value}>{st.label}</option>)}
          </select>
        </label>
        <button type="button" onClick={() => setLower((x) => !x)} aria-pressed={lower} className="min-h-10 rounded-lg border-2 border-line-strong/60 bg-card px-3 text-sm font-bold hover:border-ink">
          {lower ? "abc → ABC" : "ABC → abc"}
        </button>
        {micOpen && (
          <span className="ml-auto flex items-center gap-2">
            <MicIndicator phase={s.phase} micState={s.micState} level={s.level} />
            <Button size="sm" variant="ghost" onClick={() => s.stopMic()}>Turn microphone off</Button>
          </span>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="grid content-start grid-cols-5 gap-2 sm:grid-cols-7 md:grid-cols-9" role="listbox" aria-label="Letters">
          {ALPHABET.map((x, i) => {
            const r = s.results[x.upper];
            return (
              <button
                key={x.upper}
                type="button"
                role="option"
                aria-selected={i === sel}
                aria-label={`${x.upper}, ${letterName(x.upper, style)}`}
                onClick={() => go(i)}
                className={`press relative aspect-square rounded-xl border-2 font-display text-2xl font-bold transition ${
                  i === sel ? "border-ink bg-indigo text-white shadow-[3px_3px_0_var(--color-ink)]" : x.upper === "Ñ" ? "border-coral bg-coral-soft text-coral-dark hover:shadow-[2px_2px_0_var(--color-coral)]" : "border-line-strong/60 bg-card hover:border-ink hover:shadow-[2px_2px_0_var(--color-ink)]"
                }`}
              >
                {lower ? x.lower : x.upper}
                {r !== undefined && <span className={`absolute right-0.5 top-0.5 grid h-4 w-4 place-items-center rounded-full text-white ${r === null ? "bg-coral" : "bg-leaf"}`} aria-hidden="true"><Icon name={r === null ? "retry" : "check"} size={10} strokeWidth={3.5} /></span>}
              </button>
            );
          })}
        </div>

        <section className="rounded-2xl border-2 border-ink bg-card p-6 text-center shadow-[5px_5px_0_var(--color-aqua)]" aria-live="polite" aria-label={`Letter ${L.upper}`}>
          <p className="font-display text-7xl font-bold leading-none">
            {L.upper} <span className="text-coral">{L.lower}</span>
          </p>
          <p className="mt-3 font-display text-3xl font-bold text-indigo">“{name}”</p>
          {otherNames.length > 0 && <p className="mt-1 text-sm text-muted">También: {otherNames.join(" · ")}</p>}
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {L.examples.map((w) => (
              <button key={w} type="button" onClick={() => (s.stopAll(), s.say(w))} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border-[1.5px] border-line-strong bg-paper px-3 font-semibold hover:border-ink">
                <Icon name="speaker" size={16} /> {w}
              </button>
            ))}
          </div>
          <div className="mt-6 flex justify-center gap-3">
            <Button variant="secondary" size="lg" onClick={listen}><Icon name="speaker" /> Listen</Button>
            <Button variant="voice" size="lg" onClick={repeat} disabled={s.phase === "listening"}><Icon name="mic" /> Repeat</Button>
          </div>
          {s.error && <p className="mt-3 text-sm font-semibold text-coral-dark">{s.error}</p>}
          {s.micState === "denied" && <p className="mt-3 text-sm text-coral-dark">The microphone is blocked for this site. Allow it from the lock icon in the address bar, then try again.</p>}
          <div className="mt-4 min-h-12">
            <FeedbackBubble feedback={s.feedback} />
            {s.phase === "listening" && !s.feedback && <p className="text-sm text-muted">Di el nombre de la letra…</p>}
          </div>
          <div className="mt-4 flex justify-between">
            <Button size="sm" variant="ghost" onClick={() => go(sel - 1)} disabled={busy && s.phase === "speaking"}>← Anterior</Button>
            <Button size="sm" variant="ghost" onClick={() => go(sel + 1)}>Siguiente <Icon name="next" size={16} /></Button>
          </div>
          <p className="mt-4 text-xs text-muted">
            {audience === "teacher"
              ? "Practice only: nothing is saved. Students may say any common name of a letter. To assign the alphabet, create Flashcards, Listen & Repeat or Spell the Word and use “Add the Spanish alphabet”."
              : "Solo práctica: no se guarda nada."}
          </p>
        </section>
      </div>
    </div>
  );
}
