// Shared by the server (student attempts) and the browser (teacher preview) so both decide
// identically when a question is finished.
import { evaluateAnswer, evaluateTyped, type Evaluation, type RecognitionAlternative } from "@/lib/speech/evaluate";

export function scoreTurn(opts: {
  alternatives: RecognitionAlternative[];
  tooQuiet?: boolean;
  expected: string;
  accepted: string[];
  mode: "PHRASE" | "LETTERS";
  acceptShortAnswer: boolean;
  incorrectSoFar: number;
  maxTries: number;
  /** "voice" (speech recognition) or "typed"/"choice" (keyboard, drag & drop: exact checking). */
  input?: "voice" | "typed" | "choice";
  language?: "es-419" | "en-US" | "fr-FR";
  caseSensitive?: boolean;
}): Evaluation & { endsQuestion: boolean } {
  const input = opts.input ?? "voice";
  const ev: Evaluation =
    input !== "voice"
      ? evaluateTyped(opts.alternatives[0]?.text ?? "", { expected: opts.expected, accepted: input === "typed" ? opts.accepted : [], caseSensitive: opts.caseSensitive })
      : opts.tooQuiet
        ? { outcome: "UNCERTAIN", score: 0, reason: "no_speech", transcript: "" }
        : evaluateAnswer(opts.alternatives, { expected: opts.expected, accepted: opts.accepted, mode: opts.mode, acceptShortAnswer: opts.acceptShortAnswer, language: opts.language });
  const incorrect = opts.incorrectSoFar + (ev.outcome === "INCORRECT" ? 1 : 0);
  return { ...ev, endsQuestion: ev.outcome === "CORRECT" || (ev.outcome === "INCORRECT" && incorrect >= opts.maxTries) };
}
