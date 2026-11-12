// Shared shapes between the editor, the API and the player.

export interface GameSettings {
  acceptShortAnswer: boolean;
  voice?: string;
  /** Voices for runs in other languages ("…en español, [en]love[/en]?"). */
  voices?: Partial<Record<"es-419" | "en-US" | "fr-FR", string>>;
  rate: number;
  /** Incorrect tries before the model answer and moving on. */
  maxTries: number;
  /** AudioAsset ids for the feedback phrases, generated on publish. */
  phraseAudio?: Record<string, string>;
  /** Template options (see TemplateDef.options). */
  options?: Record<string, string | number | boolean>;
  /** Label the Diagram: the picture for the whole activity. */
  diagramImageId?: string | null;
}

export type Lang = "es-419" | "en-US" | "fr-FR";

/**
 * Audio attached to a card face or an item. A recording, an uploaded file or saved
 * text-to-speech has a mediaId (MediaAsset of kind AUDIO). Without one, the text is read by the
 * device's own voice in `language` (used when no TTS service is configured).
 */
export interface FaceAudio {
  mediaId?: string | null;
  /** Words read aloud (may differ from the visible text: show a picture, say "rojo"). */
  text: string;
  language: Lang;
  voice?: string | null;
  source: "record" | "upload" | "tts" | "browser";
  /** File name for uploads, shown in the editor. */
  name?: string;
}

/** The back of a flashcard: any mix of text, picture and audio. */
export interface FaceData {
  text?: string;
  imageAssetId?: string | null;
  imageAlt?: string;
  audio?: FaceAudio | null;
}

/** Template-specific item fields. */
export interface ItemData {
  translation?: string;
  translationLanguage?: "es-419" | "en-US" | "fr-FR";
  /** Alt text for the item's (front) picture. */
  imageAlt?: string;
  /** Audio of the item / flashcard front. */
  audio?: FaceAudio | null;
  /** Flashcards: the back face. Kept when the activity switches to one side. */
  back?: FaceData;
  /** Label the Diagram: point position in % of the picture. */
  x?: number;
  y?: number;
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
  /** null = the activity language. */
  answerLanguage: "es-419" | "en-US" | "fr-FR" | null;
}

export interface EditorItem {
  id?: string;
  /** Client-only key, stable across reorders (drag & drop, undo). */
  key?: string;
  imageAssetId: string | null;
  imageUrl?: string | null;
  text: string;
  difficulty: number;
  data: ItemData;
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
  diagramImageUrl?: string | null;
  items: EditorItem[];
  updatedAt: string;
}

/** A face as the player receives it (media resolved to URLs). */
export interface PlayFace {
  text: string;
  imageUrl: string | null;
  imageAlt: string;
  audio: { url: string | null; text: string; language: Lang } | null;
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
  answerLanguage: "es-419" | "en-US" | "fr-FR";
  data: ItemData;
  imageAlt: string;
  /** Audio of the item / flashcard front. */
  audio: PlayFace["audio"];
  /** Flashcards: the back face (null for old cards: the answer and translation are shown). */
  back: PlayFace | null;
}

export interface PlayGame {
  gameId: string;
  title: string;
  instructions: string;
  templateKey: string;
  language: "es-419" | "en-US" | "fr-FR";
  sttLocale: string;
  /** Recognition locale for each answer language. */
  sttLocales: Record<"es-419" | "en-US" | "fr-FR", string>;
  sttProvider: string | null;
  board: "sequence" | "flashcards" | "spell" | "wheel" | "diagram" | "boxes" | "match";
  options: Record<string, string | number | boolean>;
  diagramImageUrl: string | null;
  settings: { acceptShortAnswer: boolean; maxTries: number; showAnswerText: boolean; rate: number };
  phraseAudio: Record<string, string>;
  questions: PlayQuestion[];
}

export const SPELL_TOKENS: Record<Exclude<SpellTarget, "word">, string> = { firstName: "{{firstName}}", lastName: "{{lastName}}" };
