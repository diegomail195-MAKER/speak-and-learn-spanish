// Shared shapes between the editor, the API and the player.

export interface GameSettings {
  acceptShortAnswer: boolean;
  voice?: string;
  rate: number;
  /** Incorrect tries before the model answer and moving on. */
  maxTries: number;
  /** AudioAsset ids for the feedback phrases, generated on publish. */
  phraseAudio?: Record<string, string>;
}

export const DEFAULT_SETTINGS: GameSettings = { acceptShortAnswer: true, rate: 0.95, maxTries: 3 };

export type SpellTarget = "firstName" | "lastName" | "word";

export interface EditorQuestion {
  id?: string;
  prompt: string;
  promptAudioId: string | null;
  promptAudioText?: string | null;
  promptAudioUrl?: string | null;
  expectedAnswer: string;
  accepted: string[];
  hint: string;
  supportText: string;
  supportLanguage: "en-US" | "es-419" | "fr-FR";
  supportAudioId: string | null;
  supportAudioText?: string | null;
  supportAudioUrl?: string | null;
  evaluationMode: "PHRASE" | "LETTERS";
  spellTarget?: SpellTarget;
}

export interface EditorItem {
  id?: string;
  imageAssetId: string | null;
  imageUrl?: string | null;
  text: string;
  difficulty: number;
  question: EditorQuestion;
}

export interface EditorGame {
  id: string;
  templateKey: string;
  title: string;
  description: string;
  categoryId: string | null;
  topic: string;
  objective: string;
  level: string;
  instructions: string;
  language: "es-419" | "en-US" | "fr-FR";
  difficulty: number;
  estimatedMinutes: number | null;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  settings: GameSettings;
  items: EditorItem[];
  updatedAt: string;
}

/** What the activity player receives. */
export interface PlayQuestion {
  id: string;
  prompt: string;
  promptAudioUrl: string | null;
  supportText: string;
  supportLanguage: "en-US" | "es-419" | "fr-FR";
  supportAudioUrl: string | null;
  imageUrl: string | null;
  displayText: string;
  expected: string;
  accepted: string[];
  mode: "PHRASE" | "LETTERS";
  hint: string;
  hintAudioUrl: string | null;
  modelAudioUrl: string | null;
}

export interface PlayGame {
  gameId: string;
  title: string;
  instructions: string;
  templateKey: string;
  language: "es-419" | "en-US" | "fr-FR";
  sttLocale: string;
  sttProvider: string | null;
  settings: { acceptShortAnswer: boolean; maxTries: number; showAnswerText: boolean; rate: number };
  phraseAudio: Record<string, string>;
  questions: PlayQuestion[];
}

export const SPELL_TOKENS: Record<Exclude<SpellTarget, "word">, string> = { firstName: "{{firstName}}", lastName: "{{lastName}}" };
