"use client";

import { useMemo, useState } from "react";
import { FeedbackBubble, MicIndicator } from "@/components/player/parts";
import { useVoiceSession } from "@/components/player/useVoiceSession";
import { Button } from "@/components/ui/Button";
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
        <label className="flex items-center gap-2 text-sm font-bold text-ink-2">
          Letter names
          <select value={style} onChange={(e) => setStyle(e.target.value as LetterNameStyle)} className="rounded-lg border border-line bg-card px-2 py-1 text-sm font-normal">
            {LETTER_STYLES.map((st) => <option key={st.value} value={st.value}>{st.label}</option>)}
          </select>
        </label>
        <button type="button" onClick={() => setLower((x) => !x)} aria-pressed={lower} className="rounded-full border-2 border-line bg-card px-3 py-1 text-sm font-bold">
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
                className={`relative aspect-square rounded-2xl border-2 font-display text-2xl font-semibold transition ${
                  i === sel ? "border-ink bg-ink text-white" : x.upper === "Ñ" ? "border-coral/40 bg-coral-soft text-coral-dark hover:border-coral" : "border-line bg-card hover:border-ink-2"
                }`}
              >
                {lower ? x.lower : x.upper}
                {r !== undefined && <span className={`absolute right-1 top-1 h-2 w-2 rounded-full ${r === null ? "bg-coral" : "bg-leaf"}`} aria-hidden="true" />}
              </button>
            );
          })}
        </div>

        <section className="rounded-[1.75rem] border border-line bg-card p-6 text-center" aria-live="polite" aria-label={`Letter ${L.upper}`}>
          <p className="font-display text-7xl font-semibold leading-none">
            {L.upper} <span className="text-teal">{L.lower}</span>
          </p>
          <p className="mt-3 font-display text-3xl font-semibold text-ink-2">“{name}”</p>
          {otherNames.length > 0 && <p className="mt-1 text-sm text-muted">También: {otherNames.join(" · ")}</p>}
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {L.examples.map((w) => (
              <button key={w} type="button" onClick={() => (s.stopAll(), s.say(w))} className="rounded-full bg-paper-2 px-3 py-1 font-semibold hover:bg-line">
                🔊 {w}
              </button>
            ))}
          </div>
          <div className="mt-6 flex justify-center gap-3">
            <Button variant="secondary" size="lg" onClick={listen}>🔊 Listen</Button>
            <Button variant="voice" size="lg" onClick={repeat} disabled={s.phase === "listening"}>🎤 Repeat</Button>
          </div>
          {s.error && <p className="mt-3 text-sm font-semibold text-coral-dark">{s.error}</p>}
          {s.micState === "denied" && <p className="mt-3 text-sm text-coral-dark">The microphone is blocked for this site. Allow it from the 🔒 icon in the address bar, then try again.</p>}
          <div className="mt-4 min-h-12">
            <FeedbackBubble feedback={s.feedback} />
            {s.phase === "listening" && !s.feedback && <p className="text-sm text-muted">Di el nombre de la letra…</p>}
          </div>
          <div className="mt-4 flex justify-between">
            <Button size="sm" variant="ghost" onClick={() => go(sel - 1)} disabled={busy && s.phase === "speaking"}>← Anterior</Button>
            <Button size="sm" variant="ghost" onClick={() => go(sel + 1)}>Siguiente →</Button>
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
