// What a player needs to run the engine: settings, activity family, noun and the student's
// earlier records. Built on the server (see montessoriSetup in server.ts) and passed as a prop.
import type { MontessoriConfig } from "./config";
import type { SkillEvidence } from "./levels";
import type { NounKey } from "./nouns";
import type { ActivityType, ItemHistory, ProgressLevel } from "./types";

export interface MontessoriSetup {
  config: MontessoriConfig;
  activityType: ActivityType;
  noun: NounKey;
  /** By item (question) id. Empty in teacher previews. */
  history: Record<string, ItemHistory & { evidence?: SkillEvidence; teacherLevel?: ProgressLevel | null }>;
}
