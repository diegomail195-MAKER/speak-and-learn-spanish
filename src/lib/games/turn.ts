// Shared by the server (student attempts) and the browser (teacher preview) so both decide
// identically when a question is finished.
import { evaluateAnswer, type Evaluation, type RecognitionAlternative } from "@/lib/speech/evaluate";

export function scoreTurn(opts: {
  alternatives: RecognitionAlternative[];
  tooQuiet?: boolean;
  expected: string;
  accepted: string[];
  mode: "PHRASE" | "LETTERS";
  acceptShortAnswer: boolean;
  incorrectSoFar: number;
  maxTries: number;
}): Evaluation & { endsQuestion: boolean } {
  const ev: Evaluation = opts.tooQuiet
    ? { outcome: "UNCERTAIN", score: 0, reason: "no_speech", transcript: "" }
    : evaluateAnswer(opts.alternatives, { expected: opts.expected, accepted: opts.accepted, mode: opts.mode, acceptShortAnswer: opts.acceptShortAnswer });
  const incorrect = opts.incorrectSoFar + (ev.outcome === "INCORRECT" ? 1 : 0);
  return { ...ev, endsQuestion: ev.outcome === "CORRECT" || (ev.outcome === "INCORRECT" && incorrect >= opts.maxTries) };
}
