"use client";

// The activity engine shared by every template. One microphone session for the whole activity
// (permission once, stream kept open, VAD armed only while waiting for an answer, disarmed
// while the app speaks), one speaker, one recognizer. Boards (cards, wheel, boxes…) decide
// *which* question comes next; this hook runs the question itself: present → listen → check
// on the server → feedback → hint → model → next.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { pick, type PhraseKind } from "@/lib/feedback";
import { diffSegment, findConfusion, isShortForm } from "@/lib/montessori/activity";
import { FeedbackEngine, linesFor } from "@/lib/montessori/engine";
import { addResult, computeLevel, EMPTY_EVIDENCE } from "@/lib/montessori/levels";
import type { MontessoriSetup } from "@/lib/montessori/setup";
import type { FeedbackDecision, ProgressLevel } from "@/lib/montessori/types";
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
export type Feedback = {
  tone: "good" | "retry" | "unsure" | "info";
  text: string;
  model?: string;
  /** Montessori engine: stable message id and the line(s) to show (English and/or Spanish). */
  id?: string;
  lines?: Array<{ lang: "en" | "es"; text: string }>;
  /** Extra precise help (e.g. "Check the accent mark."). */
  detail?: string;
  /** Typed answer with the part that needs attention. */
  highlight?: { text: string; start: number; end: number };
  /** Two items to compare. */
  compare?: { a: { label: string; imageUrl: string | null }; b: { label: string; imageUrl: string | null } };
} | null;
export type Input = "voice" | "typed" | "choice";
export type TurnResult = Evaluation & { endsQuestion: boolean; selfCorrected?: boolean; shortForm?: boolean };

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
  /** Montessori Intelligent Feedback Engine (absent: the original phrases are used). */
  feedback?: MontessoriSetup;
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
  // Kept in step with `results` synchronously, so finish() right after record() sees the last answer.
  const resultsRef = useRef(results);
  resultsRef.current = results;
  const [heardLetters, setHeardLetters] = useState<string[] | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [supportLevel, setSupportLevel] = useState<Support>("NONE");
  const [usesMic, setUsesMic] = useState(false);
  const usesMicRef = useRef(false);
  usesMicRef.current = usesMic;

  const mic = useRef<MicSession | null>(null);
  const speaker = useRef<Speaker | null>(null);
  const recognizer = useRef<SpeechEngine | null>(null);
  const runId = useRef(0);
  const resumeWaiter = useRef<(() => void) | null>(null);
  const skipFlag = useRef(false);
  const repeatFlag = useRef(false);
  const supportRef = useRef<Support>("NONE");
  const startedAt = useRef(0);
  const presented = useRef(new Set<string>());
  const tries = useRef<Record<string, { n: number; incorrect: number }>>({});
  const current = useRef<PlayQuestion | null>(null);
  const pictureUsed = useRef(false);
  const [summary, setSummary] = useState<FeedbackDecision[] | null>(null);
  const [muted, setMuted] = useState(false);
  const mutedRef = useRef(false);
  mutedRef.current = muted;
  const lastSpoken = useRef<Array<{ lang: "en" | "es"; text: string }>>([]);

  // The engine runs for English and Spanish activities; other languages keep the original phrases.
  const setup = sessionOpts.feedback;
  const engine = useMemo(
    () => (setup && (game.language === "es-419" || game.language === "en-US") ? new FeedbackEngine({ config: setup.config, activityType: setup.activityType, noun: setup.noun, history: setup.history, targetIsSpanish: game.language === "es-419" }) : null),
    // One engine per activity run.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useEffect(() => {
    speaker.current = new Speaker();
    return () => {
      runId.current++;
      speaker.current?.stop();
      recognizer.current?.cancel();
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

  const LANG = { en: "en-US", es: "es-419" } as const;

  /** Says the lines of a decision (or the last one again), unless muted or narration is off. */
  const speakLines = useCallback(
    async (lines: Array<{ lang: "en" | "es"; text: string }>, force = false) => {
      if (!force && (mutedRef.current || !setup?.config.autoNarration)) return;
      for (const l of lines) await say(l.text, game.phraseAudio[l.text], LANG[l.lang]);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [say, game.phraseAudio, setup],
  );

  /** Shows (and, when allowed, says) one engine decision. Silent decisions show nothing. */
  const showDecision = useCallback(
    async (d: FeedbackDecision, extra?: Partial<NonNullable<Feedback>>) => {
      if (d.display === "silent" || !setup) {
        if (extra?.highlight || extra?.detail) setFeedback({ tone: d.tone, text: extra.detail ?? "", ...extra });
        return;
      }
      const { show, say: sayLines } = linesFor(d, setup.config, game.language === "en-US" ? "en" : "es");
      setFeedback({ tone: d.tone, text: show.map((l) => l.text).join(" "), lines: show, id: d.id, model: d.model, ...extra });
      lastSpoken.current = sayLines;
      await speakLines(sayLines);
      if (extra?.detail && !mutedRef.current && setup.config.autoNarration) await say(extra.detail);
    },
    [setup, speakLines, say],
  );

  /** "🔊" on the feedback: replays the message even when narration is off. */
  const replayFeedback = useCallback(async () => {
    if (lastSpoken.current.length) await speakLines(lastSpoken.current, true);
  }, [speakLines]);

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

  const record = useCallback((id: string, support: Support | null) => {
    resultsRef.current = { ...resultsRef.current, [id]: support };
    setResults((r) => ({ ...r, [id]: support }));
  }, []);

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
        if (game.sttProvider) recognizer.current = new ServerEngine();
        else if (webSpeechAvailable()) recognizer.current = new WebSpeechEngine();
        else {
          m.stop();
          setError("This browser can't recognize speech. Please use Google Chrome, or ask your teacher to set up the speech service.");
          return false;
        }
      }
      startedAt.current = Date.now();
      setPhase("intro");
      if (practiceIds.current) {
        setPhase("ready");
        return true;
      }
      if (game.instructions) await say(game.instructions);
      // Reopened unfinished activity: continue from the last step.
      if (engine && Object.keys(optsRef.current.done ?? {}).length > 0) await showDecision(engine.onResume());
      setPhase("ready");
      return true;
    },
    [game.sttProvider, game.instructions, say, engine, showDecision],
  );

  const modelOf = useCallback((q: PlayQuestion) => (q.mode === "PHRASE" ? plainText(q.expected) : lettersOf(q.expected).join(" - ")), []);
  const sayModel = useCallback(
    async (q: PlayQuestion) => {
      if (q.mode === "PHRASE") await say(q.expected, q.modelAudioUrl, q.answerLanguage);
      else await say(spellOut(q.expected), null, "es-419");
    },
    [say, spellOut],
  );

  /**
   * Montessori feedback for one spoken answer. Returns the support used when the question is
   * answered, null when it closes without a correct answer, or "continue" to listen again.
   */
  const montessoriVoice = async (q: PlayQuestion, ev: TurnResult, t: { n: number; incorrect: number }, alternatives: Array<{ text: string; confidence: number | null }>, alive: () => boolean): Promise<Support | null | "continue" | "aborted"> => {
    const fe = engine!;
    const incorrect = ev.outcome === "INCORRECT";
    if (incorrect) t.incorrect++;
    const confused = incorrect ? findConfusion(ev.transcript || alternatives[0]?.text || "", { ...q, expected: q.expected }, game.questions) : null;
    const d = fe.onAnswer({
      itemId: q.id,
      outcome: ev.outcome,
      reason: ev.reason,
      input: "voice",
      support: supportRef.current,
      incorrectSoFar: t.incorrect,
      endsQuestion: ev.endsQuestion,
      hasHint: !!q.hint,
      hasImage: !!q.imageUrl,
      model: modelOf(q),
      shortForm: ev.shortForm ?? isShortForm(ev, q.expected, q.accepted),
      score: ev.score,
      confusedWith: confused ? { label: plainText(confused.displayText || confused.expected), imageUrl: confused.imageUrl } : null,
      usedPicture: pictureUsed.current,
      pictureClue: game.board === "flashcards" && !!q.back?.imageUrl,
    });
    if (ev.outcome === "CORRECT") {
      await showDecision(d);
      if (d.action === "model_optional_retry") await fullSentenceOnce(q, alive);
      return supportRef.current;
    }
    if (ev.outcome === "UNCERTAIN") {
      await showDecision(d);
      return "continue";
    }
    if (ev.endsQuestion) {
      await showDecision(d, { model: modelOf(q) });
      await sayModel(q);
      return null;
    }
    switch (d.action) {
      case "hint":
        raiseSupport("HINT");
        setShowHint(true);
        await showDecision(d);
        if (q.hint) await say(q.hint, q.hintAudioUrl);
        break;
      case "model":
        raiseSupport("MODEL");
        await showDecision(d, { model: modelOf(q) });
        await sayModel(q);
        break;
      case "compare":
        raiseSupport("HINT");
        await showDecision(d, { compare: { a: { label: plainText(q.displayText || q.expected), imageUrl: q.imageUrl }, b: d.compareWith ?? { label: "", imageUrl: null } } });
        break;
      default:
        await showDecision(d);
    }
    return "continue";
  };

  /**
   * After a short answer ("perro"), the full sentence is presented and the student may say it
   * once. This extra try is feedback only: the question already counts as answered.
   */
  const fullSentenceOnce = async (q: PlayQuestion, alive: () => boolean) => {
    await sayModel(q);
    if (!alive() || !recognizer.current || !mic.current) return;
    setPhase("listening");
    const r = await recognizer.current.listen(mic.current, { language: q.answerLanguage, locale: game.sttLocales[q.answerLanguage] ?? game.sttLocale, mode: q.mode, timeoutMs: 6000 });
    if (!alive() || r.kind !== "result") return;
    const ev = scoreTurn({ alternatives: r.alternatives, expected: q.expected, accepted: q.accepted, mode: q.mode, acceptShortAnswer: false, incorrectSoFar: 0, maxTries: 1, input: "voice", language: q.answerLanguage });
    if (ev.outcome === "CORRECT" && !isShortForm(ev, q.expected, q.accepted)) await showDecision(engine!.message("speaking.complete_sentence"));
  };

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
      pictureUsed.current = false;
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
        const r: EngineResult = await recognizer.current!.listen(mic.current!, {
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
          if (engine) void showDecision(engine.onTechnical());
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
            if (engine) void showDecision(engine.onInactivity());
            setPhase("idle");
            await waitForResume();
            if (!alive()) return "aborted";
            timeouts = 0;
            await presentIt();
          } else if (engine) await showDecision(engine.onWaiting());
          else await sayPhrase("waiting", "info");
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
        const provider = r.kind === "result" ? r.provider : recognizer.current!.name;
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
        if (engine) {
          const res = await montessoriVoice(q, ev, t, alternatives, alive);
          if (res === "continue") continue;
          return res;
        }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [game, present, say, sayPhrase, score, addDiag, raiseSupport, spellOut, engine, showDecision],
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
      if (engine) {
        if (ev.outcome === "INCORRECT") t.incorrect++;
        const shown = plainText(input === "choice" ? q.displayText || q.expected : q.expected);
        const seg = input === "typed" && ev.outcome === "INCORRECT" ? diffSegment(text, shown) : null;
        const d = engine.onAnswer({
          itemId: q.id,
          outcome: ev.outcome,
          reason: ev.reason,
          input,
          support,
          incorrectSoFar: t.incorrect,
          endsQuestion: ev.endsQuestion,
          hasHint: !!q.hint,
          hasImage: !!q.imageUrl,
          model: shown,
          letterIndex: seg ? seg.start : undefined,
        });
        if (ev.outcome === "CORRECT") {
          await showDecision(d);
          return { ev, next: "correct", support };
        }
        if (ev.endsQuestion) {
          await showDecision(d, { model: shown });
          await say(q.expected, q.modelAudioUrl, q.answerLanguage);
          return { ev, next: "done", support };
        }
        const help = TYPED_HELP[ev.reason]?.[lang];
        const extra = { ...(seg ? { highlight: { text, ...seg } } : {}), ...(help ? { detail: help } : {}) };
        if (d.action === "hint" && q.hint) {
          raiseSupport("HINT");
          setShowHint(true);
          await showDecision(d, extra);
          await say(q.hint, q.hintAudioUrl);
        } else if (d.action === "model" && input === "typed") {
          // Hear the word again (the spelling itself is not shown before the last try).
          raiseSupport("MODEL");
          await showDecision(d, extra);
          await say(q.expected, q.modelAudioUrl, q.answerLanguage);
        } else await showDecision(d, extra);
        return { ev, next: "retry", support };
      }
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
    [score, addDiag, sayPhrase, say, lang, raiseSupport, engine, showDecision],
  );

  const practiceIds = useRef<string[] | null>(null);

  /** Items of this run with their results, and the levels they reach with today's answers. */
  const completionInput = () => {
    const pool = practiceIds.current ? game.questions.filter((q) => practiceIds.current!.includes(q.id)) : game.questions;
    // Look–flip–listen flashcards have no answer to record.
    const answerable = pool.filter((q) => q.expected.trim().length > 0);
    const res = resultsRef.current;
    const items = answerable.map((q) => ({ id: q.id, label: plainText(q.displayText || q.expected), result: res[q.id] }));
    const levelsAfter: Record<string, ProgressLevel> = {};
    const day = new Date().toISOString().slice(0, 10);
    for (const it of items) {
      const h = setup?.history[it.id];
      if (h?.teacherLevel) levelsAfter[it.id] = h.teacherLevel;
      else if (it.result !== undefined && setup) levelsAfter[it.id] = computeLevel(addResult(h?.evidence ?? EMPTY_EVIDENCE, { result: it.result, hinted: it.result !== "NONE", selfCorrected: false, day, context: `game:${game.gameId}` }), setup.config.progress);
    }
    return { items, stoppedEarly: items.some((i) => i.result === undefined), levelsAfter, canAlternative: usesMicRef.current && game.board !== "flashcards" };
  };

  /** Starts a practice round with only these items (same activity, or as flashcards). */
  const beginPractice = useCallback((ids: string[]) => {
    practiceIds.current = ids;
    const left = { ...resultsRef.current };
    for (const id of ids) delete left[id];
    resultsRef.current = left;
    setResults((r) => {
      const n = { ...r };
      for (const id of ids) delete n[id];
      return n;
    });
    for (const id of ids) {
      delete tries.current[`${id}:v`];
      delete tries.current[`${id}:t`];
    }
    setSummary(null);
    setFeedback(null);
    presented.current = new Set();
  }, []);

  const finish = useCallback(async () => {
    mic.current?.stop(); // the microphone is only on during the activity
    try {
      await optsRef.current.onFinish?.({ presented: presented.current.size, durationMs: Date.now() - startedAt.current });
    } catch {
      // Answers are already saved one by one; the summary is recomputed on the next visit.
    }
    setPhase("done");
    setFeedback(null);
    if (!engine) return void (await sayPhrase("done"));
    const decisions = engine.onComplete(completionInput());
    setSummary(decisions);
    const first = decisions.find((d) => d.display !== "silent");
    if (first && setup) {
      const { say: lines } = linesFor(first, setup.config, game.language === "en-US" ? "en" : "es");
      lastSpoken.current = lines;
      await speakLines(lines);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sayPhrase, engine, setup, speakLines]);

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
    recognizer.current?.cancel();
    mic.current?.hold();
    return true;
  }, [phase]);

  const skip = useCallback(() => {
    skipFlag.current = true;
    recognizer.current?.cancel();
    mic.current?.hold();
    speaker.current?.stop();
  }, []);

  /** Stops listening and speaking; the board's current question returns "aborted". */
  const stopAll = useCallback(() => {
    runId.current++;
    skipFlag.current = false;
    repeatFlag.current = false;
    recognizer.current?.cancel();
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
    engine,
    summary,
    muted,
    setMuted,
    replayFeedback,
    showDecision,
    beginPractice,
    practicing: () => practiceIds.current,
    /** The student opened the picture clue of the current item (e.g. flipped to a picture). */
    markPictureUsed: () => (pictureUsed.current = true),
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
    engineName: recognizer.current?.name ?? "—",
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
