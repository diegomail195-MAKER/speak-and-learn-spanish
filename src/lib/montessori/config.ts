// Admin settings for the Montessori Intelligent Feedback Engine (Settings → Montessori Feedback).
// Stored as JSON (one row) and always read through parseConfig(), so a missing or partial row,
// or a row written by an older version, falls back to safe defaults.
import { z } from "zod";
import { ACTIVITY_TYPES, LEVELS, type ActivityType } from "./types";
import { MESSAGE_BY_ID } from "./messages";

const activitySettings = z.object({
  enabled: z.boolean().default(true),
  /** Per-answer feedback: "brief" description, or "silent" (feedback only at the end). */
  perItem: z.enum(["brief", "silent"]).optional(),
});

const variants = z.array(z.string().trim().min(1).max(200)).max(5);

export const configSchema = z.object({
  language: z.enum(["en", "es", "bilingual"]).default("bilingual"),
  /** Which line is read aloud in bilingual mode ("activity": the language the activity teaches). */
  spokenLanguage: z.enum(["activity", "en", "es", "both"]).default("activity"),
  /** Read feedback aloud automatically (voice activities). Students can always replay or mute. */
  autoNarration: z.boolean().default(true),
  voices: z.object({ en: z.string().max(60).default(""), es: z.string().max(60).default("") }).default({}),
  activities: z.record(z.enum(ACTIVITY_TYPES), activitySettings).default({}),
  /** Custom texts, by stable message id. */
  messages: z.record(z.string().max(60), z.object({ en: variants.optional(), es: variants.optional() })).default({}),
  /** Message ids switched off by the admin (their action still happens, silently). */
  disabledMessages: z.array(z.string().max(60)).max(80).default([]),
  conditions: z
    .object({
      /** Correct answers in a row with no help before "You did that independently." */
      independenceStreak: z.number().int().min(2).max(10).default(3),
      /** Tries on one item before "That was challenging, and you kept working on it." */
      persistenceTries: z.number().int().min(2).max(6).default(2),
      /** Missed items (in one activity) before offering a different activity. */
      repeatedErrorItems: z.number().int().min(2).max(10).default(3),
      /** Ask again for the full sentence after a short spoken answer. */
      offerFullSentence: z.boolean().default(true),
    })
    .default({}),
  guidedPractice: z
    .object({
      /** Offer "practice the missed items" at the end of an activity. */
      offerPracticeMissed: z.boolean().default(true),
      /** Offer the same items as flashcards (another modality) after repeated mistakes. */
      offerAlternative: z.boolean().default(true),
      /** Items in "Let's work on the first part together." */
      firstPartSize: z.number().int().min(1).max(10).default(3),
    })
    .default({}),
  progress: z
    .object({
      /** Correct, independent answers in a row needed for Proficient. */
      proficientStreak: z.number().int().min(2).max(10).default(3),
      /** Different days with independent answers needed for Proficient. */
      proficientSessions: z.number().int().min(1).max(10).default(2),
      /** Different activities with independent answers needed for Extending. */
      extendingContexts: z.number().int().min(2).max(6).default(2),
      /** Independent answers needed for Progressing. */
      progressingIndependent: z.number().int().min(1).max(10).default(1),
    })
    .default({}),
  challenge: z
    .object({
      /** Offer a new challenge once every item of the activity is at least this level. */
      minLevel: z.enum(LEVELS).default("PROFICIENT"),
      enabled: z.boolean().default(true),
    })
    .default({}),
});

export type MontessoriConfig = z.infer<typeof configSchema>;

export const DEFAULT_CONFIG: MontessoriConfig = configSchema.parse({});

/** Reads stored settings, dropping anything invalid (never throws). */
export function parseConfig(raw: unknown): MontessoriConfig {
  const r = configSchema.safeParse(raw ?? {});
  if (r.success) return cleanMessages(r.data);
  // Keep every valid top-level section of a partly invalid row.
  const obj = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(configSchema.shape) as Array<keyof typeof configSchema.shape>) {
    const part = configSchema.shape[key].safeParse(obj[key]);
    if (part.success) out[key] = part.data;
  }
  return cleanMessages(configSchema.parse(out));
}

/** Unknown message ids are ignored (e.g. a message removed in a later version). */
function cleanMessages(c: MontessoriConfig): MontessoriConfig {
  const messages = Object.fromEntries(Object.entries(c.messages).filter(([id]) => MESSAGE_BY_ID[id]));
  return { ...c, messages, disabledMessages: c.disabledMessages.filter((id) => MESSAGE_BY_ID[id]) };
}

export function activitySetting(c: MontessoriConfig, t: ActivityType): { enabled: boolean; perItem: "brief" | "silent" } {
  const a = c.activities[t];
  return { enabled: a?.enabled ?? true, perItem: a?.perItem ?? defaultPerItem(t) };
}

/** Memory games: finding pairs is not interrupted; feedback comes at the end. */
export function defaultPerItem(t: ActivityType): "brief" | "silent" {
  return t === "memory" ? "silent" : "brief";
}
