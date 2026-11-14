// Connects LextroSpeak's activities to the engine: activity type per template, skill keys, and
// small answer helpers shared by the browser and the server.
import { normalizeText } from "@/lib/speech/normalize";
import { plainText } from "@/lib/text/segments";
import type { ActivityType } from "./types";

/** Voice activity templates (src/lib/games/templates.ts) → activity family. */
const TEMPLATE_TYPES: Record<string, ActivityType> = {
  FLASHCARDS: "flashcards",
  SPELL_THE_WORD: "spelling",
  SPELL_YOUR_NAME: "spelling",
  SPIN_THE_WHEEL: "challenge",
  LABEL_THE_DIAGRAM: "drag_drop",
  OPEN_THE_BOX: "challenge",
  LISTEN_AND_SPEAK: "pronunciation",
  SPEAK_AND_ANSWER: "speaking",
  MATCH_AND_SPEAK: "matching",
  IMAGE_AND_VOCABULARY: "vocabulary",
  QUESTION_AND_ANSWER: "speaking",
};

export function activityTypeForTemplate(templateKey: string, options: Record<string, unknown> = {}): ActivityType {
  if (templateKey === "SPELL_THE_WORD" && options.spellMode === "type") return "writing";
  if (templateKey === "LABEL_THE_DIAGRAM" && options.diagramMode === "speak") return "vocabulary";
  return TEMPLATE_TYPES[templateKey] ?? "teacher_created";
}

/** Library games (src/lib/library/types.ts) → activity family. */
export function activityTypeForLibrary(kind: string, gameType?: string): ActivityType {
  if (kind === "FLASHCARDS") return "flashcards";
  if (kind === "GAME") return gameType === "MEMORY" ? "memory" : gameType === "MATCH" ? "matching" : gameType === "LISTEN" ? "listening" : "multiple_choice";
  return "teacher_created";
}

/**
 * One skill per word/phrase and language, shared by every activity that practises it, so
 * consistency and transfer to new activities can be seen. Personal data (a student's own name
 * in "Spell your name") must never be turned into a skill: callers skip those questions.
 */
export function skillKey(language: string, answer: string): string | null {
  const norm = normalizeText(plainText(answer)).slice(0, 120);
  return norm ? `vocab:${language}:${norm}` : null;
}

/** Correct only through the short form ("perro" for "Es un perro"), not the full answer. */
export function isShortForm(ev: { outcome: string; matchedAnswer?: string }, expected: string, accepted: string[]): boolean {
  if (ev.outcome !== "CORRECT" || !ev.matchedAnswer) return false;
  const m = normalizeText(plainText(ev.matchedAnswer));
  return ![expected, ...accepted].some((t) => normalizeText(plainText(t)) === m);
}

/** The part of a typed answer that needs attention: from the first to the last differing letter. */
export function diffSegment(typed: string, expected: string): { start: number; end: number } | null {
  const a = typed.trim();
  const b = plainText(expected).trim();
  if (!a || a.toLowerCase() === b.toLowerCase()) return null;
  const al = a.toLowerCase();
  const bl = b.toLowerCase();
  let s = 0;
  while (s < al.length && s < bl.length && al[s] === bl[s]) s++;
  let e = 0;
  while (e < al.length - s && e < bl.length - s && al[al.length - 1 - e] === bl[bl.length - 1 - e]) e++;
  const end = Math.max(s + 1, al.length - e);
  return { start: Math.min(s, Math.max(0, al.length - 1)), end: Math.min(end, al.length) };
}

/** Did the student name another item of the same activity? (for "Let's compare these two…") */
export function findConfusion<T extends { id: string; expected: string; displayText?: string }>(transcript: string, current: T, all: T[]): T | null {
  const said = normalizeText(transcript);
  if (!said) return null;
  for (const q of all) {
    if (q.id === current.id) continue;
    const names = [q.expected, q.displayText ?? ""].map((x) => normalizeText(plainText(x))).filter(Boolean);
    if (names.some((n) => n === said || (n.length > 2 && said.split(" ").includes(n)))) {
      if (normalizeText(plainText(current.expected)) !== normalizeText(plainText(q.expected))) return q;
    }
  }
  return null;
}
