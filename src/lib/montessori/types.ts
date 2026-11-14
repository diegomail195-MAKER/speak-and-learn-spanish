// Montessori Intelligent Feedback Engine — shared types (browser + server, no I/O).
//
// Every activity (present or future) talks to the engine through LearningEvent objects. The
// engine answers with a FeedbackDecision: which stable message id to show, the text in English
// and Spanish, how to show it (inline, at a pause, or silently) and what the activity should do
// next (retry, hint, model, compare, practice…). Messages are never chosen at random from a
// generic list: each one is tied to a verifiable condition.

export type FeedbackLang = "en" | "es";
/** Admin setting: the language(s) the student sees and hears. */
export type LanguageMode = "en" | "es" | "bilingual";

/** Activity families the engine knows. New activities pick the closest one (or "teacher_created"). */
export const ACTIVITY_TYPES = [
  "speaking",
  "pronunciation",
  "listening",
  "flashcards",
  "memory",
  "matching",
  "multiple_choice",
  "drag_drop",
  "spelling",
  "writing",
  "number_tracing",
  "vocabulary",
  "sentence_building",
  "challenge",
  "teacher_created",
] as const;
export type ActivityType = (typeof ACTIVITY_TYPES)[number];

export const ACTIVITY_LABEL: Record<ActivityType, string> = {
  speaking: "Speaking activities",
  pronunciation: "Pronunciation exercises",
  listening: "Listening activities",
  flashcards: "Flashcards",
  memory: "Memory games",
  matching: "Matching games",
  multiple_choice: "Multiple-choice questions",
  drag_drop: "Drag-and-drop activities",
  spelling: "Spelling games",
  writing: "Writing activities",
  number_tracing: "Number tracing",
  vocabulary: "Interactive vocabulary",
  sentence_building: "Sentence-building games",
  challenge: "Educational challenges",
  teacher_created: "Teacher-created activities",
};

/** Why an answer was not accepted. Technical kinds never count against the student. */
export type ErrorKind =
  | "comprehension"
  | "vocabulary"
  | "pronunciation"
  | "incomplete"
  | "silence"
  | "recognition"
  | "device"
  | "spelling"
  | "language";

export const TECHNICAL_ERRORS: readonly ErrorKind[] = ["silence", "recognition", "device"];

export type Support = "NONE" | "HINT" | "MODEL";
export type Outcome = "CORRECT" | "INCORRECT" | "UNCERTAIN";

/** Montessori progress levels (per skill / content item, never a label for the child). */
export const LEVELS = ["EXPLORING", "DEVELOPING", "PROGRESSING", "PROFICIENT", "EXTENDING"] as const;
export type ProgressLevel = (typeof LEVELS)[number];

/** What the activity should do after the message. */
export type FeedbackAction =
  | "none"
  | "advance" // record and move on
  | "retry" // let the student try again with no new help (self-correction)
  | "retry_highlight" // retry, highlighting the part of the answer that needs attention
  | "hint" // show/say the teacher's hint, then retry
  | "model" // present the model (audio + text), then retry
  | "model_and_next" // present the model, then move on (no endless loops)
  | "model_optional_retry" // short answer accepted: offer the full sentence once
  | "compare" // show the two confused items side by side
  | "offer_visual" // offer the picture clue
  | "practice_missed" // practice only the items that need it
  | "alternative_activity" // practice the same items in another modality
  | "smaller_steps" // work on the first part only
  | "challenge" // offer a more demanding activity
  | "resume" // continue from the last step
  | "recover"; // technical problem: try again, nothing recorded

/** How the message is shown: inline (bubble), at a natural pause (end screen) or not at all. */
export type Display = "inline" | "pause" | "silent";

export interface FeedbackDecision {
  /** Stable message id (never the visible text). */
  id: string;
  en: string;
  es: string;
  display: Display;
  action: FeedbackAction;
  tone: "good" | "retry" | "unsure" | "info";
  /** Model answer to show/say (activity language). */
  model?: string;
  /** Evidence to store with the answer. */
  evidence?: { selfCorrected?: boolean; errorKind?: ErrorKind; graded: boolean };
  /** Items to practice (practice_missed / alternative_activity / smaller_steps). */
  itemIds?: string[];
  /** Compare: the other item the student named. */
  compareWith?: { label: string; imageUrl: string | null };
}

/** One answer, as any activity reports it. */
export interface AnswerEvent {
  itemId: string;
  outcome: Outcome;
  /** Evaluation reason (see src/lib/speech/evaluate.ts). */
  reason: string;
  input: "voice" | "typed" | "choice";
  /** Help the student had received for this item before answering. */
  support: Support;
  /** Incorrect answers for this item so far, including this one when it is incorrect. */
  incorrectSoFar: number;
  /** True when this answer closes the item (correct, or the last allowed try). */
  endsQuestion: boolean;
  hasHint: boolean;
  hasImage: boolean;
  /** Model answer as shown to the student. */
  model: string;
  /** Voice: correct only through the short form ("perro" for "Es un perro"). */
  shortForm?: boolean;
  /** Score 0..1 from the evaluator. */
  score?: number;
  /** Typed answers: index of the first letter to look at. */
  letterIndex?: number;
  /** The student said/typed another item of the same activity. */
  confusedWith?: { label: string; imageUrl: string | null } | null;
  /** The student opened a picture clue before answering. */
  usedPicture?: boolean;
  /** The item has a picture clue the student can open (e.g. the back of a flashcard). */
  pictureClue?: boolean;
}

/** What the platform knows about an item from earlier sessions (server records only). */
export interface ItemHistory {
  level: ProgressLevel;
  /** Help (hint/model) or a miss on an earlier day. */
  neededHelpBefore: boolean;
  independentDays: number;
}

export interface CompletionItem {
  id: string;
  label: string;
  /** Final result: NONE/HINT/MODEL when correct, null when missed, undefined when not reached. */
  result: Support | null | undefined;
}
