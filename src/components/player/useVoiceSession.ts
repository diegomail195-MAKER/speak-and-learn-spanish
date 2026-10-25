"use client";

// The activity engine shared by every template. One microphone session for the whole activity
// (permission once, stream kept open, VAD armed only while waiting for an answer, disarmed
// while the app speaks), one speaker, one recognizer. Boards (cards, wheel, boxes…) decide
// *which* question comes next; this hook runs the question itself: present → listen → check
// on the server → feedback → hint → model → next.
import { useCallback, useEffect, useRef, useState } from "react";
import { pick, type PhraseKind } from "@/lib/feedback";
import { MicSession, type MicState } from "@/lib/client/mic-session";
import { Speaker } from "@/lib/client/speaker";
import { ServerEngine, WebSpeechEngine, webSpeechAvailable, type EngineResult, type SpeechEngine } from "@/lib/client/speech-engine";
import { scoreTurn } from "@/lib/games/turn";
import type { PlayGame, PlayQuestion } from "@/lib/games/types";
import { REASON_TEXT, type Evaluation } from "@/lib/speech/evaluate";
import { letterName, type LetterNameStyle } from "@/lib/alphabet";
import { compareLetters, lettersOf, parseSpokenLetters } from "@/lib/speech/letters";
import { plainText } from "@/lib/text/segments";
import type { AppLanguage } from "@/lib/tts/voices";

export type Support = "NONE" | "HINT" | "MODEL";
export type Phase = "start" | "intro" | "speaking" | "listening" | "thinking" | "feedback" | "idle" | "suspended" | "error" | "ready" | "done";
export type Feedback = { tone: "good" | "retry" | "unsure" | "info"; text: string; model?: string } | null;
export type Input = "voice" | "typed" | "choice";
export type TurnResult = Evaluation & { endsQuestion: boolean };

export type SubmitTurn = (
  q: PlayQuestion,
  body: { alternatives: Array<{ text: string; confidence: number | null }>; tooQuiet: boolean; provider: string; locale: string; support: Support; tryNumber: number; input: Input },
) => Promise<TurnResult>;

export interface Diagnostic {
  at: number;
  expected: string;
  transcript: string;
  alternatives: Array<{ text: string; confidence: number | null }>;
  locale: string;
  provider: string;
  confidence: number | null;
  outcome: string;
  reason: string;
  support: Support;
  input: Input;
  micState: MicState;
  noiseFloorDb: number;
  pronunciation?: { accuracy: number; fluency: number; completeness: number; overall: number } | null;
}

/** Child-facing explanation of a typed mistake, in the activity language. */
const TYPED_HELP: Partial<Record<string, Record<AppLanguage, string>>> = {
  missing_accent: { "es-419": "Revisa la tilde.", "en-US": "Check the accent mark.", "fr-FR": "Vérifie l'accent." },
  missing_enye: { "es-419": "¿Lleva ñ?", "en-US": "Does it need ñ?", "fr-FR": "Il faut un ñ ?" },
  wrong_case: { "es-419": "Revisa las mayúsculas.", "en-US": "Check the capital letters.", "fr-FR": "Vérifie les majuscules." },
  wrong_order: { "es-419": "Las letras están bien, pero no el orden.", "en-US": "Right letters, wrong order.", "fr-FR": "Bonnes lettres, mauvais ordre." },
  empty: { "es-419": "Escribe tu respuesta.", "en-US": "Type your answer.", "fr-FR": "Écris ta réponse." },
};

export interface SessionOptions {
  mode: "preview" | "student";
  submitTurn?: SubmitTurn;
  onFinish?: (summary: { presented: number; durationMs: number }) => Promise<void> | void;
  done?: Record<string, Support | null>;
}

export function useVoiceSession(game: PlayGame, sessionOpts: SessionOptions) {
  const optsRef = useRef(sessionOpts);
  optsRef.current = sessionOpts;
  const [phase, setPhase] = useState<Phase>("start");
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [micState, setMicState] = useState<MicState>("idle");
  const [level, setLevel] = useState(0);
  const [error, setError] = useState("");
  const [diag, setDiag] = useState<Diagnostic[]>([]);
  const [results, setResults] = useState<Record<string, Support | null>>(() => ({ ...sessionOpts.done }));
  const [heardLetters, setHeardLetters] = useState<string[] | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [supportLevel, setSupportLevel] = useState<Support>("NONE");
  const [usesMic, setUsesMic] = useState(false);

  const mic = useRef<MicSession | null>(null);
  const speaker = useRef<Speaker | null>(null);
  const engine = useRef<SpeechEngine | null>(null);
  const runId = useRef(0);
  const resumeWaiter = useRef<(() => void) | null>(null);
  const skipFlag = useRef(false);
  const repeatFlag = useRef(false);
  const supportRef = useRef<Support>("NONE");
  const startedAt = useRef(0);
  const presented = useRef(new Set<string>());
  const tries = useRef<Record<string, { n: number; incorrect: number }>>({});
  const current = useRef<PlayQuestion | null>(null);

  useEffect(() => {
    speaker.current = new Speaker();
    return () => {
      runId.current++;
      speaker.current?.stop();
      engine.current?.cancel();
      mic.current?.stop();
    };
  }, []);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      if (mic.current) setLevel(mic.current.level);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const lang = game.language;
  const spellOut = useCallback((word: string) => lettersOf(word).map((l) => letterName(l, (game.options.letterNames as LetterNameStyle) ?? "rae")).join(", "), [game.options.letterNames]);

  const say = useCallback(
    async (text: string, url?: string | null, language: AppLanguage = lang) => {
      mic.current?.hold(); // never listen while the app is talking
      await speaker.current?.say(text, language, url, game.settings.rate);
      await new Promise((r) => setTimeout(r, 180)); // let room echo die down
    },
    [lang, game.settings.rate],
  );

  /** Shows and says one feedback phrase (the same text on screen and in the audio). */
  const sayPhrase = useCallback(
    async (kind: PhraseKind, tone?: NonNullable<Feedback>["tone"], model?: string) => {
      const text = pick(kind, lang);
      if (tone) setFeedback({ tone, text, model });
      await say(text, game.phraseAudio[text]);
      return text;
    },
    [say, game.phraseAudio, lang],
  );

  const waitForResume = () => new Promise<void>((r) => (resumeWaiter.current = r));

  const present = useCallback(
    async (q: PlayQuestion, extra?: { repeatModel?: boolean }) => {
      setPhase("speaking");
      if (q.supportText) await say(q.supportText, q.supportAudioUrl, q.supportLanguage);
      if (q.prompt) await say(q.prompt, q.promptAudioUrl);
      else if (game.settings.showAnswerText || extra?.repeatModel) {
        if (q.mode === "LETTERS") await say(spellOut(q.expected), null, "es-419"); // letter names, not the word
        else await say(q.expected, q.modelAudioUrl, q.answerLanguage);
      }
    },
    [say, spellOut, game.settings.showAnswerText],
  );

  const addDiag = useCallback((d: Diagnostic) => setDiag((x) => [d, ...x].slice(0, 30)), []);

  const record = useCallback((id: string, support: Support | null) => setResults((r) => ({ ...r, [id]: support })), []);

  /** Raises the support level of the current question (e.g. the student flipped the card). */
  const raiseSupport = useCallback((s: Support) => {
    const order = { NONE: 0, HINT: 1, MODEL: 2 };
    if (order[s] > order[supportRef.current]) {
      supportRef.current = s;
      setSupportLevel(s);
    }
  }, []);

  /** Scores one answer: on the server for students (authoritative), locally in preview. */
  const score = useCallback(
    async (q: PlayQuestion, body: Parameters<SubmitTurn>[1]): Promise<TurnResult> => {
      if (optsRef.current.submitTurn) return optsRef.current.submitTurn(q, body);
      const t = tries.current[`${q.id}:${body.input === "voice" ? "v" : "t"}`] ?? { n: 0, incorrect: 0 };
      return scoreTurn({
        alternatives: body.alternatives,
        tooQuiet: body.tooQuiet,
        expected: body.input === "choice" ? q.displayText || q.expected : q.expected,
        accepted: q.accepted,
        mode: q.mode,
        acceptShortAnswer: game.settings.acceptShortAnswer,
        incorrectSoFar: t.incorrect,
        maxTries: game.settings.maxTries,
        input: body.input,
        language: q.answerLanguage,
        caseSensitive: game.options.caseSensitive === true,
      });
    },
    [game],
  );

  /** Starts the activity. Voice activities open the microphone once, here, from a click. */
  const start = useCallback(
    async (withMic: boolean) => {
      setError("");
      setUsesMic(withMic);
      if (withMic) {
        const m = mic.current ?? new MicSession();
        mic.current = m;
        m.onChange(() => setMicState(m.state));
        const ok = m.state === "ready" ? true : await m.start();
        if (!ok) {
          setMicState(m.state);
          return false;
        }
        if (game.sttProvider) engine.current = new ServerEngine();
        else if (webSpeechAvailable()) engine.current = new WebSpeechEngine();
        else {
          m.stop();
          setError("This browser can't recognize speech. Please use Google Chrome, or ask your teacher to set up the speech service.");
          return false;
        }
      }
      startedAt.current = Date.now();
      setPhase("intro");
      if (game.instructions) await say(game.instructions);
      setPhase("ready");
      return true;
    },
    [game.sttProvider, game.instructions, say],
  );

  /**
   * Runs one spoken question to its end. Returns the support used when answered correctly,
   * null when not answered (needs more practice), "skipped", or "aborted" (activity stopped).
   * In spelling (LETTERS) questions, letters said in several breaths add up: the student keeps
   * spelling without pressing anything, and only a finished or wrong spelling is checked.
   */
  const ask = useCallback(
    async (q: PlayQuestion, o?: { skipPresent?: boolean; initialSupport?: Support; prompt?: () => Promise<void> }): Promise<Support | null | "skipped" | "aborted"> => {
      const myRun = runId.current;
      const alive = () => runId.current === myRun;
      current.current = q;
      supportRef.current = o?.initialSupport ?? "NONE";
      setSupportLevel(supportRef.current);
      setShowHint(false);
      setHeardLetters(null);
      setFeedback(null);
      presented.current.add(q.id);
      const t = (tries.current[`${q.id}:v`] ??= { n: 0, incorrect: 0 });
      let timeouts = 0;
      let spelled = ""; // letters heard so far (LETTERS mode)
      const expectedLetters = q.mode === "LETTERS" ? lettersOf(q.expected) : [];
      const presentIt = o?.prompt ?? (() => present(q));
      if (!o?.skipPresent) await presentIt();

      while (alive()) {
        if (skipFlag.current) {
          skipFlag.current = false;
          return "skipped";
        }
        setPhase("listening");
        const r: EngineResult = await engine.current!.listen(mic.current!, {
          language: q.answerLanguage,
          locale: game.sttLocales[q.answerLanguage] ?? game.sttLocale,
          mode: q.mode,
          reference: game.templateKey === "LISTEN_AND_SPEAK" ? plainText(q.expected) : undefined,
          timeoutMs: 9000,
        });
        if (!alive()) return "aborted";
        if (skipFlag.current) continue;
        if (repeatFlag.current) {
          repeatFlag.current = false;
          await presentIt();
          continue;
        }
        if (r.kind === "cancelled") continue;
        if (r.kind === "interrupted") {
          setPhase("suspended");
          await waitForResume();
          if (!alive()) return "aborted";
          await presentIt();
          continue;
        }
        if (r.kind === "error") {
          setError(r.message);
          setPhase("error");
          await waitForResume();
          if (!alive()) return "aborted";
          setError("");
          continue;
        }
        if (r.kind === "timeout") {
          timeouts++;
          if (timeouts >= 2) {
            // Nobody is answering: stop listening until the student comes back.
            mic.current?.pause();
            setPhase("idle");
            await waitForResume();
            if (!alive()) return "aborted";
            timeouts = 0;
            await presentIt();
          } else await sayPhrase("waiting", "info");
          continue;
        }
        timeouts = 0;

        let alternatives = r.kind === "result" ? r.alternatives : [];
        // Spelling in several breaths: keep listening while what was heard is a correct beginning.
        if (q.mode === "LETTERS" && r.kind === "result" && alternatives[0]) {
          const chunk = parseSpokenLetters(alternatives[0].text);
          const sofar = parseSpokenLetters(`${spelled} ${alternatives[0].text}`);
          const isPrefix = chunk.unknown.length === 0 && chunk.letters.length > 0 && sofar.letters.length < expectedLetters.length && compareLetters(expectedLetters.slice(0, sofar.letters.length), sofar.letters).distance === 0;
          if (isPrefix) {
            spelled = `${spelled} ${alternatives[0].text}`.trim();
            setHeardLetters(sofar.letters);
            continue;
          }
          if (spelled) alternatives = [{ text: `${spelled} ${alternatives[0].text}`.trim(), confidence: alternatives[0].confidence }];
          spelled = "";
        }

        setPhase("thinking");
        t.n++;
        const tooQuiet = r.kind === "too_quiet";
        const provider = r.kind === "result" ? r.provider : engine.current!.name;
        const locale = r.kind === "result" ? r.locale : game.sttLocales[q.answerLanguage];
        let ev: TurnResult;
        try {
          ev = await score(q, { alternatives, tooQuiet, provider, locale, support: supportRef.current, tryNumber: t.n, input: "voice" });
        } catch {
          setError("Your answer could not be saved. Check the internet connection.");
          setPhase("error");
          await waitForResume();
          if (!alive()) return "aborted";
          setError("");
          t.n--;
          continue;
        }
        if (!alive()) return "aborted";
        if (q.mode === "LETTERS") setHeardLetters(parseSpokenLetters(ev.transcript || alternatives[0]?.text || "").letters);
        addDiag({
          at: Date.now(),
          expected: plainText(q.expected),
          transcript: ev.transcript,
          alternatives,
          locale,
          provider,
          confidence: ev.confidence ?? alternatives[0]?.confidence ?? null,
          outcome: ev.outcome,
          reason: tooQuiet ? "Audio too quiet (insufficient input level)." : REASON_TEXT[ev.reason],
          support: supportRef.current,
          input: "voice",
          micState: mic.current?.state ?? "idle",
          noiseFloorDb: mic.current?.noiseFloorDb ?? 0,
          pronunciation: r.kind === "result" ? r.pronunciation : null,
        });

        setPhase("feedback");
        if (ev.outcome === "CORRECT") {
          await sayPhrase("correct", "good");
          return supportRef.current;
        }
        if (ev.outcome === "UNCERTAIN") {
          // Not graded: just ask again.
          await sayPhrase(ev.reason === "word_instead_of_letters" ? "letters" : "uncertain", "unsure");
          continue;
        }
        t.incorrect++;
        if (ev.reason === "english_answer") await sayPhrase("wrongLanguage", "retry");
        const model = q.mode === "PHRASE" ? plainText(q.expected) : lettersOf(q.expected).join(" - ");
        if (ev.endsQuestion) {
          await sayPhrase("listenModel", "info", model);
          if (q.mode === "PHRASE") await say(q.expected, q.modelAudioUrl, q.answerLanguage);
          else await say(spellOut(q.expected), null, "es-419");
          await sayPhrase("next");
          return null;
        }
        if (supportRef.current === "NONE" && q.hint) {
          raiseSupport("HINT");
          setShowHint(true);
          await sayPhrase("tryAgain", "retry");
          await say(q.hint, q.hintAudioUrl);
        } else {
          raiseSupport("MODEL");
          await sayPhrase("listenModel", "retry", model);
          if (q.mode === "PHRASE") await say(q.expected, q.modelAudioUrl, q.answerLanguage);
          else await say(spellOut(q.expected), null, "es-419");
        }
      }
      return "aborted";
    },
    [game, present, say, sayPhrase, score, addDiag, raiseSupport, spellOut],
  );

  /**
   * Checks a typed or drag-and-drop answer. Returns the evaluation plus what to do next:
   * "correct", "retry" (feedback/hint given) or "done" (the answer was shown; move on).
   */
  const check = useCallback(
    async (q: PlayQuestion, text: string, input: "typed" | "choice"): Promise<{ ev: TurnResult; next: "correct" | "retry" | "done"; support: Support }> => {
      presented.current.add(q.id);
      if (current.current?.id !== q.id) {
        current.current = q;
        supportRef.current = "NONE";
        setSupportLevel("NONE");
        setShowHint(false);
      }
      const t = (tries.current[`${q.id}:t`] ??= { n: 0, incorrect: 0 });
      t.n++;
      setPhase("thinking");
      const ev = await score(q, { alternatives: [{ text, confidence: 1 }], tooQuiet: false, provider: input, locale: "", support: supportRef.current, tryNumber: t.n, input });
      addDiag({
        at: Date.now(),
        expected: plainText(input === "choice" ? q.displayText || q.expected : q.expected),
        transcript: text,
        alternatives: [{ text, confidence: 1 }],
        locale: "—",
        provider: input,
        confidence: 1,
        outcome: ev.outcome,
        reason: REASON_TEXT[ev.reason],
        support: supportRef.current,
        input,
        micState: mic.current?.state ?? "idle",
        noiseFloorDb: mic.current?.noiseFloorDb ?? 0,
      });
      setPhase("feedback");
      const support = supportRef.current;
      if (ev.outcome === "CORRECT") {
        await sayPhrase("correct", "good");
        return { ev, next: "correct", support };
      }
      t.incorrect++;
      const help = TYPED_HELP[ev.reason]?.[lang];
      if (ev.endsQuestion) {
        const model = plainText(input === "choice" ? q.displayText || q.expected : q.expected);
        await sayPhrase("listenModel", "info", model);
        await say(q.expected, q.modelAudioUrl, q.answerLanguage);
        return { ev, next: "done", support };
      }
      if (help) {
        setFeedback({ tone: "retry", text: help });
        await say(help);
      } else await sayPhrase("tryAgain", "retry");
      if (q.hint && supportRef.current === "NONE") {
        raiseSupport("HINT");
        setShowHint(true);
        await say(q.hint, q.hintAudioUrl);
      }
      return { ev, next: "retry", support };
    },
    [score, addDiag, sayPhrase, say, lang, raiseSupport],
  );

  const finish = useCallback(async () => {
    mic.current?.stop(); // the microphone is only on during the activity
    try {
      await optsRef.current.onFinish?.({ presented: presented.current.size, durationMs: Date.now() - startedAt.current });
    } catch {
      // Answers are already saved one by one; the summary is recomputed on the next visit.
    }
    setPhase("done");
    setFeedback(null);
    await sayPhrase("done");
  }, [sayPhrase]);

  const resume = useCallback(async () => {
    const m = mic.current;
    if (m && (m.state === "suspended" || m.state === "paused" || m.state === "stopped")) {
      const ok = await m.resume();
      if (!ok) return setMicState(m.state);
    }
    const w = resumeWaiter.current;
    resumeWaiter.current = null;
    w?.();
  }, []);

  /** "Escuchar otra vez": replays the question while listening. */
  const repeat = useCallback(() => {
    if (phase !== "listening") return false;
    repeatFlag.current = true;
    engine.current?.cancel();
    mic.current?.hold();
    return true;
  }, [phase]);

  const skip = useCallback(() => {
    skipFlag.current = true;
    engine.current?.cancel();
    mic.current?.hold();
    speaker.current?.stop();
  }, []);

  /** Stops listening and speaking; the board's current question returns "aborted". */
  const stopAll = useCallback(() => {
    runId.current++;
    skipFlag.current = false;
    repeatFlag.current = false;
    engine.current?.cancel();
    mic.current?.hold();
    speaker.current?.stop();
    resumeWaiter.current = null;
  }, []);

  const stopMic = useCallback(() => {
    stopAll();
    mic.current?.stop();
    setPhase("start");
  }, [stopAll]);

  return {
    game,
    phase,
    setPhase,
    feedback,
    setFeedback,
    micState,
    level,
    error,
    diag,
    results,
    record,
    heardLetters,
    setHeardLetters,
    showHint,
    supportLevel,
    raiseSupport,
    usesMic,
    engineName: engine.current?.name ?? "—",
    start,
    say,
    sayPhrase,
    spellOut,
    present,
    ask,
    check,
    finish,
    resume,
    repeat,
    skip,
    stopAll,
    stopMic,
    micOn: () => !!mic.current && mic.current.state !== "stopped" && mic.current.state !== "idle",
  };
}

export type VoiceSession = ReturnType<typeof useVoiceSession>;
