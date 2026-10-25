// How one question went, from its responses. Spoken answers are the skill being practised, so
// when a question has any spoken answer (e.g. Match & Speak: drag, then say it), only the
// spoken answers decide its status.
type R = { outcome: string; support: string; provider: string; endsQuestion: boolean };

export const isVoice = (r: { provider: string }) => r.provider !== "typed" && r.provider !== "choice";

export function questionStatus(rs: R[]): "INDEPENDENT" | "GUIDED" | "NEEDS_PRACTICE" | null {
  const voice = rs.filter(isVoice);
  const use = voice.length ? voice : rs;
  const correct = use.find((r) => r.outcome === "CORRECT");
  if (correct) return correct.support === "NONE" ? "INDEPENDENT" : "GUIDED";
  return use.some((r) => r.endsQuestion) ? "NEEDS_PRACTICE" : null;
}

/** Support level shown to the student when continuing: "NONE" | "HINT"/"MODEL" | null (missed). */
export function questionResult(rs: R[]): "NONE" | "HINT" | "MODEL" | null | undefined {
  const voice = rs.filter(isVoice);
  const use = voice.length ? voice : rs;
  const correct = use.find((r) => r.outcome === "CORRECT");
  if (correct) return correct.support as "NONE" | "HINT" | "MODEL";
  return use.some((r) => r.endsQuestion) ? null : undefined;
}
