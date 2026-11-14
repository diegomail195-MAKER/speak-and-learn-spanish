// The five Montessori progress levels, computed from recorded evidence only. A level describes
// what was shown for one skill (word, phrase…), never the child. One correct answer is never
// enough for Proficient: it needs a run of independent answers on more than one day.
import type { MontessoriConfig } from "./config";
import { LEVELS, type ProgressLevel, type Support } from "./types";

/** Evidence kept for one student and one skill (see SkillProgress in prisma/schema.prisma). */
export interface SkillEvidence {
  attempts: number; // items answered (closed), any result
  correct: number; // closed correctly, with or without help
  independentCorrect: number; // closed correctly with no help
  missed: number; // closed without a correct answer
  hintsUsed: number;
  selfCorrections: number;
  /** Independent answers in a row (reset by help or a miss). */
  streak: number;
  /** Distinct days with at least one independent answer. */
  independentDays: string[];
  /** Distinct activities with at least one independent answer. */
  contexts: string[];
}

export const EMPTY_EVIDENCE: SkillEvidence = { attempts: 0, correct: 0, independentCorrect: 0, missed: 0, hintsUsed: 0, selfCorrections: 0, streak: 0, independentDays: [], contexts: [] };

export function computeLevel(e: SkillEvidence, p: MontessoriConfig["progress"]): ProgressLevel {
  const proficient = e.streak >= p.proficientStreak && e.independentDays.length >= p.proficientSessions;
  if (proficient && e.contexts.length >= p.extendingContexts) return "EXTENDING";
  if (proficient) return "PROFICIENT";
  if (e.independentCorrect >= p.progressingIndependent && e.correct >= 2) return "PROGRESSING";
  if (e.correct >= 1) return "DEVELOPING";
  return "EXPLORING";
}

export const levelRank = (l: ProgressLevel) => LEVELS.indexOf(l);
export const atLeast = (l: ProgressLevel, min: ProgressLevel) => levelRank(l) >= levelRank(min);

/** Adds one closed item to the evidence. `result` is the support used when correct, null when missed. */
export function addResult(e: SkillEvidence, r: { result: Support | null; hinted: boolean; selfCorrected: boolean; day: string; context: string }): SkillEvidence {
  const independent = r.result === "NONE";
  return {
    attempts: e.attempts + 1,
    correct: e.correct + (r.result !== null ? 1 : 0),
    independentCorrect: e.independentCorrect + (independent ? 1 : 0),
    missed: e.missed + (r.result === null ? 1 : 0),
    hintsUsed: e.hintsUsed + (r.hinted ? 1 : 0),
    selfCorrections: e.selfCorrections + (r.selfCorrected ? 1 : 0),
    streak: independent ? e.streak + 1 : 0,
    independentDays: independent && !e.independentDays.includes(r.day) ? [...e.independentDays, r.day].slice(-60) : e.independentDays,
    contexts: independent && !e.contexts.includes(r.context) ? [...e.contexts, r.context].slice(-20) : e.contexts,
  };
}

export const LEVEL_LABEL: Record<ProgressLevel, { en: string; es: string }> = {
  EXPLORING: { en: "Exploring", es: "Explorando" },
  DEVELOPING: { en: "Developing", es: "En desarrollo" },
  PROGRESSING: { en: "Progressing", es: "Progresando" },
  PROFICIENT: { en: "Proficient", es: "Competente" },
  EXTENDING: { en: "Extending", es: "Ampliando" },
};
