"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { pick, type PhraseKind } from "@/lib/feedback";
import { MicSession, type MicState } from "@/lib/client/mic-session";
import { Speaker } from "@/lib/client/speaker";
import { ServerEngine, WebSpeechEngine, webSpeechAvailable, type EngineResult, type SpeechEngine } from "@/lib/client/speech-engine";
import { scoreTurn } from "@/lib/games/turn";
import type { PlayGame, PlayQuestion } from "@/lib/games/types";
import { REASON_TEXT, type Evaluation } from "@/lib/speech/evaluate";
import { lettersOf, parseSpokenLetters } from "@/lib/speech/letters";

type Support = "NONE" | "HINT" | "MODEL";
type Phase = "start" | "intro" | "speaking" | "listening" | "thinking" | "feedback" | "idle" | "suspended" | "error" | "done";
type Feedback = { tone: "good" | "retry" | "unsure" | "info"; text: string; model?: string } | null;

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
  micState: MicState;
  noiseFloorDb: number;
  pronunciation?: { accuracy: number; fluency: number; completeness: number; overall: number } | null;
}

type ServerTurn = (q: PlayQuestion, body: { alternatives: Array<{ text: string; confidence: number | null }>; tooQuiet: boolean; provider: string; locale: string; support: Support; tryNumber: number }) => Promise<Evaluation & { endsQuestion: boolean }>;

export interface PlayerProps {
  game: PlayGame;
  mode: "preview" | "student";
  startIndex?: number;
  diagnostics?: boolean;
  /** Student mode: server-side scoring + saving. */
  submitTurn?: ServerTurn;
  onFinish?: (summary: { presented: number; durationMs: number }) => Promise<void> | void;
  exitHref: string;
}

const MIC_LABEL: Partial<Record<MicState, string>> = {
  listening: "Te escucho…",
  hearing: "Te escucho…",
  processing: "Pensando…",
  ready: "Micrófono listo",
  paused: "Micrófono en pausa",
  suspended: "Micrófono interrumpido",
};

export function GamePlayer({ game, mode, startIndex = 0, diagnostics = false, submitTurn, onFinish, exitHref }: PlayerProps) {
  const [phase, setPhase] = useState<Phase>("start");
  const [index, setIndex] = useState(startIndex);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [micState, setMicState] = useState<MicState>("idle");
  const [level, setLevel] = useState(0);
  const [error, setError] = useState("");
  const [diag, setDiag] = useState<Diagnostic[]>([]);
  const [results, setResults] = useState<Array<{ id: string; support: Support | null }>>([]);
  const [heardLetters, setHeardLetters] = useState<string[] | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [supportLevel, setSupportLevel] = useState<Support>("NONE");

  const mic = useRef<MicSession | null>(null);
  const speaker = useRef<Speaker | null>(null);
  const engine = useRef<SpeechEngine | null>(null);
  const runId = useRef(0);
  const resumeWaiter = useRef<(() => void) | null>(null);
  const skipFlag = useRef(false);
  const repeatFlag = useRef(false);
  const startedAt = useRef(0);
  const presented = useRef(new Set<string>());
  const rootRef = useRef<HTMLDivElement>(null);

  const q = game.questions[index];

  useEffect(() => {
    speaker.current = new Speaker();
    return () => {
      runId.current++;
      speaker.current?.stop();
      engine.current?.cancel();
      mic.current?.stop();
    };
  }, []);

  // Level meter
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      if (mic.current) setLevel(mic.current.level);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const say = useCallback(async (text: string, url?: string | null, language = game.language) => {
    mic.current?.hold(); // never listen while the app is talking
    await speaker.current?.say(text, language, url, game.settings.rate);
    await new Promise((r) => setTimeout(r, 180)); // let room echo die down
  }, [game.language, game.settings.rate]);

  const sayPhrase = useCallback((kind: PhraseKind) => {
    const text = pick(kind);
    return say(text, game.phraseAudio[text]).then(() => text);
  }, [say, game.phraseAudio]);

  const waitForResume = () => new Promise<void>((r) => (resumeWaiter.current = r));

  const presentQuestion = useCallback(async (qq: PlayQuestion) => {
    setPhase("speaking");
    if (qq.supportText) await say(qq.supportText, qq.supportAudioUrl, qq.supportLanguage);
    if (qq.prompt) await say(qq.prompt, qq.promptAudioUrl);
    else if (game.settings.showAnswerText || game.templateKey === "LISTEN_AND_SPEAK") await say(qq.expected, qq.modelAudioUrl);
  }, [say, game.settings.showAnswerText, game.templateKey]);

  const runQuestion = useCallback(async (qq: PlayQuestion, myRun: number): Promise<Support | null | "aborted"> => {
    const alive = () => runId.current === myRun;
    let support: Support = "NONE";
    let incorrect = 0;
    let tryNumber = 0;
    let timeouts = 0;
    setSupportLevel("NONE");
    setShowHint(false);
    setHeardLetters(null);
    setFeedback(null);
    presented.current.add(qq.id);
    await presentQuestion(qq);

    while (alive()) {
      if (skipFlag.current) {
        skipFlag.current = false;
        return null;
      }
      setPhase("listening");
      const r: EngineResult = await engine.current!.listen(mic.current!, {
        language: game.language,
        locale: game.sttLocale,
        mode: qq.mode,
        reference: game.templateKey === "LISTEN_AND_SPEAK" ? qq.expected : undefined,
        timeoutMs: 9000,
      });
      if (!alive()) return "aborted";
      if (skipFlag.current) continue;
      if (repeatFlag.current) {
        repeatFlag.current = false;
        await presentQuestion(qq);
        continue;
      }
      if (r.kind === "cancelled") continue;
      if (r.kind === "interrupted") {
        setPhase("suspended");
        await waitForResume();
        if (!alive()) return "aborted";
        await presentQuestion(qq);
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
          await presentQuestion(qq);
        } else {
          setFeedback({ tone: "info", text: await sayPhrase("waiting") });
        }
        continue;
      }

      timeouts = 0; // only consecutive silences pause the activity
      setPhase("thinking");
      tryNumber++;
      const alternatives = r.kind === "result" ? r.alternatives : [];
      const tooQuiet = r.kind === "too_quiet";
      const provider = r.kind === "result" ? r.provider : engine.current!.name;
      const locale = r.kind === "result" ? r.locale : game.sttLocale;
      let ev: Evaluation & { endsQuestion: boolean };
      try {
        ev = submitTurn
          ? await submitTurn(qq, { alternatives, tooQuiet, provider, locale, support, tryNumber })
          : scoreTurn({ alternatives, tooQuiet, expected: qq.expected, accepted: qq.accepted, mode: qq.mode, acceptShortAnswer: game.settings.acceptShortAnswer, incorrectSoFar: incorrect, maxTries: game.settings.maxTries });
      } catch {
        setError("Your answer could not be saved. Check the internet connection.");
        setPhase("error");
        await waitForResume();
        if (!alive()) return "aborted";
        setError("");
        tryNumber--;
        continue;
      }
      if (!alive()) return "aborted";
      if (qq.mode === "LETTERS") setHeardLetters(parseSpokenLetters(ev.transcript || alternatives[0]?.text || "").letters);
      setDiag((d) => [
        {
          at: Date.now(),
          expected: qq.expected,
          transcript: ev.transcript,
          alternatives,
          locale,
          provider,
          confidence: ev.confidence ?? alternatives[0]?.confidence ?? null,
          outcome: ev.outcome,
          reason: tooQuiet ? "Audio too quiet (insufficient input level)." : REASON_TEXT[ev.reason],
          support,
          micState: mic.current?.state ?? "idle",
          noiseFloorDb: mic.current?.noiseFloorDb ?? 0,
          pronunciation: r.kind === "result" ? r.pronunciation : null,
        },
        ...d,
      ].slice(0, 30));

      setPhase("feedback");
      if (ev.outcome === "CORRECT") {
        setFeedback({ tone: "good", text: pick("correct") });
        await sayPhrase("correct");
        return support;
      }
      if (ev.outcome === "UNCERTAIN") {
        const kind: PhraseKind = ev.reason === "word_instead_of_letters" ? "letters" : "uncertain";
        setFeedback({ tone: "unsure", text: pick(kind) });
        await sayPhrase(kind);
        continue;
      }
      // INCORRECT
      incorrect++;
      if (ev.reason === "english_answer") {
        setFeedback({ tone: "retry", text: pick("english") });
        await sayPhrase("english");
      }
      if (ev.endsQuestion) {
        setFeedback({ tone: "info", text: "Escucha con atención.", model: qq.expected });
        await sayPhrase("listenModel");
        if (qq.mode === "PHRASE") await say(qq.expected, qq.modelAudioUrl);
        await sayPhrase("next");
        return null; // not answered correctly: needs more practice
      }
      if (incorrect === 1 && qq.hint) {
        support = "HINT";
        setSupportLevel("HINT");
        setShowHint(true);
        setFeedback({ tone: "retry", text: pick("tryAgain") });
        await sayPhrase("tryAgain");
        await say(qq.hint, qq.hintAudioUrl);
      } else {
        support = "MODEL";
        setSupportLevel("MODEL");
        setFeedback({ tone: "retry", text: "Escucha con atención.", model: qq.mode === "PHRASE" ? qq.expected : lettersOf(qq.expected).join(" - ") });
        await sayPhrase("listenModel");
        if (qq.mode === "PHRASE") await say(qq.expected, qq.modelAudioUrl);
        else await say(lettersOf(qq.expected).join(", "), null);
      }
    }
    return "aborted";
  }, [game, presentQuestion, say, sayPhrase, submitTurn]);

  const runFrom = useCallback(async (from: number) => {
    const myRun = ++runId.current;
    for (let i = from; i < game.questions.length; i++) {
      if (runId.current !== myRun) return;
      setIndex(i);
      const res = await runQuestion(game.questions[i], myRun);
      if (res === "aborted") return;
      setResults((r) => [...r.filter((x) => x.id !== game.questions[i].id), { id: game.questions[i].id, support: res }]);
      await new Promise((r) => setTimeout(r, 350));
    }
    if (runId.current !== myRun) return;
    mic.current?.stop(); // the microphone is only on during the activity
    try {
      await onFinish?.({ presented: presented.current.size, durationMs: Date.now() - startedAt.current });
    } catch {
      // Answers are already saved one by one; the summary is recomputed on the next visit.
    }
    setPhase("done");
    await sayPhrase("done");
  }, [game.questions, runQuestion, sayPhrase, onFinish]);

  async function start() {
    setError("");
    const m = mic.current ?? new MicSession();
    mic.current = m;
    m.onChange(() => setMicState(m.state));
    const ok = m.state === "ready" ? true : await m.start();
    if (!ok) {
      setMicState(m.state);
      setPhase("start");
      return;
    }
    if (game.sttProvider) engine.current = new ServerEngine();
    else if (webSpeechAvailable()) engine.current = new WebSpeechEngine();
    else {
      m.stop();
      setError("This browser can't recognize speech. Please use Google Chrome, or ask your teacher to set up the speech service.");
      return;
    }
    startedAt.current = Date.now();
    setPhase("intro");
    if (game.instructions) await say(game.instructions);
    runFrom(index);
  }

  async function resume() {
    const m = mic.current;
    if (m && (m.state === "suspended" || m.state === "paused" || m.state === "stopped")) {
      const ok = await m.resume();
      if (!ok) return setMicState(m.state);
    }
    const w = resumeWaiter.current;
    resumeWaiter.current = null;
    w?.();
  }

  function repeat() {
    if (!q || phase !== "listening") return;
    repeatFlag.current = true;
    engine.current?.cancel();
    mic.current?.hold();
  }

  function skip() {
    skipFlag.current = true;
    engine.current?.cancel();
    mic.current?.hold();
    speaker.current?.stop();
  }

  function stopMic() {
    runId.current++;
    engine.current?.cancel();
    speaker.current?.stop();
    mic.current?.stop();
    resumeWaiter.current = null;
    setPhase("start");
  }

  function toggleFullscreen() {
    if (document.fullscreenElement) document.exitFullscreen();
    else rootRef.current?.requestFullscreen?.().catch(() => undefined);
  }

  const doneCount = results.length;
  const independent = results.filter((r) => r.support === "NONE").length;

  return (
    <div ref={rootRef} className="flex min-h-dvh flex-col bg-paper">
      <header className="flex items-center gap-3 px-4 py-3 sm:px-6">
        <a href={exitHref} className="rounded-full px-3 py-2 text-sm font-bold text-muted hover:bg-paper-2 hover:text-ink" onClick={() => mic.current?.stop()}>
          ✕ <span className="sr-only sm:not-sr-only">Exit</span>
        </a>
        <div className="flex flex-1 items-center justify-center gap-1.5" aria-label={`Question ${Math.min(index + 1, game.questions.length)} of ${game.questions.length}`}>
          {game.questions.map((qq, i) => {
            const r = results.find((x) => x.id === qq.id);
            return <span key={qq.id} className={`h-2.5 rounded-full transition-all ${i === index && phase !== "done" ? "w-7 bg-ink" : r ? (r.support === "NONE" ? "w-2.5 bg-leaf" : "w-2.5 bg-sun") : "w-2.5 bg-line"}`} />;
          })}
        </div>
        <button onClick={toggleFullscreen} className="rounded-full px-3 py-2 text-sm font-bold text-muted hover:bg-paper-2 hover:text-ink" aria-label="Full screen">⛶</button>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center px-4 pb-6 sm:px-6">
        {phase === "start" && (
          <StartScreen game={game} micState={micState} error={error} onStart={start} preview={mode === "preview"} />
        )}

        {phase !== "start" && phase !== "done" && q && (
          <div className="flex w-full flex-1 flex-col items-center">
            {q.imageUrl && (
              <div key={q.id} className="animate-pop-in mt-2 w-full max-w-lg overflow-hidden rounded-[1.75rem] border border-line bg-card p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={q.imageUrl} alt={q.displayText || "Activity image"} className="mx-auto aspect-[4/3] w-full rounded-2xl object-contain" />
              </div>
            )}
            {q.supportText && <p className="mt-5 text-center text-lg text-muted">{q.supportText}</p>}
            {q.prompt && <h1 className="mt-2 text-center font-display text-4xl font-semibold tracking-tight sm:text-5xl">{q.prompt}</h1>}
            {!q.prompt && (game.settings.showAnswerText || game.templateKey === "LISTEN_AND_SPEAK") && (
              <h1 className="mt-5 text-center font-display text-4xl font-semibold tracking-tight sm:text-5xl">{q.expected}</h1>
            )}
            {showHint && q.hint && <p className="mt-3 rounded-full bg-sun-soft px-4 py-1.5 text-center font-semibold text-[#7a5200]">💡 {q.hint}</p>}

            {q.mode === "LETTERS" && heardLetters && (
              <div className="mt-4 flex flex-wrap justify-center gap-1.5" aria-label="Letters heard">
                {heardLetters.map((l, i) => {
                  const exp = lettersOf(q.expected);
                  const ok = exp[i] === l || (exp[i] === "B" && l === "V") || (exp[i] === "V" && l === "B");
                  return <span key={i} className={`grid h-11 w-10 place-items-center rounded-xl font-display text-xl font-semibold ${ok ? "bg-leaf-soft text-leaf" : "bg-coral-soft text-coral-dark"}`}>{l}</span>;
                })}
              </div>
            )}

            <div className="mt-auto flex w-full flex-col items-center gap-4 pt-6">
              <FeedbackBubble feedback={feedback} />
              <MicIndicator phase={phase} micState={micState} level={level} />
              {phase === "suspended" && (
                <div className="text-center">
                  <p className="mb-2 text-ink-2">The microphone stopped. Tap to continue.</p>
                  <Button variant="voice" size="lg" onClick={resume}>Turn the microphone back on</Button>
                </div>
              )}
              {phase === "idle" && (
                <div className="text-center">
                  <p className="mb-2 text-ink-2">¿Sigues ahí? (Are you still there?)</p>
                  <Button variant="voice" size="lg" onClick={resume}>Continuar</Button>
                </div>
              )}
              {phase === "error" && (
                <div className="text-center">
                  <p className="mb-2 font-semibold text-coral-dark">{error}</p>
                  <Button variant="secondary" size="lg" onClick={resume}>Try again</Button>
                </div>
              )}
              <div className="flex flex-wrap justify-center gap-2">
                <Button variant="secondary" onClick={repeat} disabled={phase !== "listening"}>🔊 Escuchar otra vez</Button>
                <Button variant="ghost" onClick={skip}>Siguiente →</Button>
                <Button variant="ghost" onClick={stopMic} aria-label="Stop the microphone">■ Stop mic</Button>
              </div>
            </div>
          </div>
        )}

        {phase === "done" && (
          <div className="animate-pop-in my-auto text-center">
            <p className="font-display text-5xl font-semibold">¡Terminaste!</p>
            <p className="mt-3 text-lg text-ink-2">
              {doneCount > 0 ? <>You answered <strong>{independent}</strong> of {doneCount} on your own.</> : "Activity finished."}
            </p>
            <p className="mt-1 text-sm text-muted">The microphone is off.</p>
            <div className="mt-6 flex justify-center gap-3">
              <a href={exitHref} className="inline-flex h-14 items-center rounded-full bg-coral px-7 text-lg font-bold text-white">Done</a>
            </div>
          </div>
        )}
      </main>

      {diagnostics && <DiagnosticsPanel diag={diag} micState={micState} game={game} engine={engine.current?.name ?? "—"} supportLevel={supportLevel} />}
    </div>
  );
}

function StartScreen({ game, micState, error, onStart, preview }: { game: PlayGame; micState: MicState; error: string; onStart: () => void; preview: boolean }) {
  return (
    <div className="my-auto max-w-md text-center">
      {preview && <p className="mb-3 inline-block rounded-full bg-sky-soft px-3 py-1 text-xs font-bold text-sky">Teacher preview — answers are not saved</p>}
      <h1 className="font-display text-4xl font-semibold">{game.title}</h1>
      {game.instructions && <p className="mt-2 text-lg text-ink-2">{game.instructions}</p>}
      <p className="mt-4 text-sm text-muted">
        {game.questions.length} {game.questions.length === 1 ? "question" : "questions"} · You&apos;ll answer out loud. The microphone listens only during this activity.
      </p>
      {micState === "denied" ? (
        <div className="mt-6 rounded-xl2 bg-coral-soft p-4 text-left text-sm text-coral-dark">
          <p className="font-bold">The microphone is blocked.</p>
          <p className="mt-1">Click the lock icon next to the web address, set Microphone to “Allow”, then press Start again.</p>
        </div>
      ) : micState === "unavailable" ? (
        <p className="mt-6 rounded-xl2 bg-coral-soft p-4 text-sm text-coral-dark">No microphone was found. Plug one in or check the device settings.</p>
      ) : null}
      {error && <p className="mt-6 rounded-xl2 bg-coral-soft p-4 text-sm text-coral-dark">{error}</p>}
      <Button variant="voice" size="lg" className="mt-8 h-16 px-10 text-xl" onClick={onStart} disabled={micState === "requesting"}>
        {micState === "requesting" ? "Allow the microphone…" : "🎤 Start"}
      </Button>
    </div>
  );
}

function FeedbackBubble({ feedback }: { feedback: Feedback }) {
  if (!feedback) return <div className="h-14" />;
  const tone = { good: "bg-leaf text-white", retry: "bg-sun-soft text-[#6b4700]", unsure: "bg-sky-soft text-sky", info: "bg-paper-2 text-ink-2" }[feedback.tone];
  return (
    <div key={feedback.text + (feedback.model ?? "")} className={`animate-pop-in rounded-2xl px-5 py-3 text-center font-display text-2xl font-semibold ${tone}`} role="status" aria-live="polite">
      {feedback.text}
      {feedback.model && <span className="mt-1 block text-lg font-medium">“{feedback.model}”</span>}
    </div>
  );
}

function MicIndicator({ phase, micState, level }: { phase: Phase; micState: MicState; level: number }) {
  const listening = micState === "listening" || micState === "hearing";
  const label = phase === "speaking" || phase === "intro" ? "Escucha…" : MIC_LABEL[micState] ?? "";
  return (
    <div className="flex items-center gap-3 rounded-full border border-line bg-card px-4 py-2" role="status" aria-live="polite">
      <span className={`relative grid h-10 w-10 place-items-center rounded-full ${listening ? "bg-teal text-white" : "bg-paper-2 text-muted"}`}>
        {listening && <span className="absolute inset-0 rounded-full bg-teal/30" style={{ transform: `scale(${1 + level * 0.8})`, transition: "transform 80ms linear" }} />}
        <svg viewBox="0 0 24 24" className="relative h-5 w-5" fill="currentColor" aria-hidden="true"><path d="M12 15a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v6a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-2.08A7 7 0 0 0 19 12z" /></svg>
      </span>
      <span className="min-w-28 font-bold text-ink-2">{label}</span>
      <span className="text-[11px] font-bold uppercase tracking-wider text-teal">{micState !== "stopped" && micState !== "idle" ? "● mic on" : ""}</span>
    </div>
  );
}

function DiagnosticsPanel({ diag, micState, game, engine, supportLevel }: { diag: Diagnostic[]; micState: MicState; game: PlayGame; engine: string; supportLevel: Support }) {
  return (
    <details className="border-t border-line bg-card px-4 py-3 text-xs sm:px-6" open>
      <summary className="cursor-pointer font-bold text-ink-2">Teacher diagnostics</summary>
      <p className="mt-2 text-muted">
        Recognizer: <strong>{engine === "server" ? game.sttProvider : engine === "webspeech" ? "Chrome Web Speech API" : "—"}</strong> · Locale: <strong>{game.sttLocale}</strong> · Mic: <strong>{micState}</strong> · Support now: <strong>{supportLevel}</strong>
      </p>
      <div className="mt-2 max-h-56 overflow-auto">
        <table className="w-full text-left">
          <thead className="text-muted">
            <tr>
              <th className="py-1 pr-3">Expected</th>
              <th className="pr-3">Transcript (alternatives)</th>
              <th className="pr-3">Conf.</th>
              <th className="pr-3">Result</th>
              <th className="pr-3">Reason</th>
              <th className="pr-3">Support</th>
              <th className="pr-3">Noise floor</th>
            </tr>
          </thead>
          <tbody>
            {diag.length === 0 && <tr><td colSpan={7} className="py-2 text-muted">No answers yet.</td></tr>}
            {diag.map((d) => (
              <tr key={d.at} className="border-t border-line align-top">
                <td className="py-1 pr-3">{d.expected}</td>
                <td className="pr-3">
                  <strong>{d.transcript || "—"}</strong>
                  {d.alternatives.length > 1 && <span className="block text-muted">{d.alternatives.slice(1).map((a) => a.text).join(" · ")}</span>}
                  {d.pronunciation && <span className="block text-muted">Pronunciation: {Math.round(d.pronunciation.overall)} (acc {Math.round(d.pronunciation.accuracy)}, flu {Math.round(d.pronunciation.fluency)})</span>}
                </td>
                <td className="pr-3">{d.confidence != null ? d.confidence.toFixed(2) : "n/a"}</td>
                <td className={`pr-3 font-bold ${d.outcome === "CORRECT" ? "text-leaf" : d.outcome === "INCORRECT" ? "text-coral-dark" : "text-sky"}`}>{d.outcome}</td>
                <td className="pr-3">{d.reason}</td>
                <td className="pr-3">{d.support}</td>
                <td className="pr-3">{d.noiseFloorDb.toFixed(0)} dB</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
