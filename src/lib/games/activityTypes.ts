// The shared registry of activity types: one place that ties each template key to its
// translatable name and description, its 3D icon and its colour tint. Create Activity,
// My Activities, Community, the editor header and the preview strip all read it, so a type
// always shows the same icon and name.
//
// Every type opens the universal editor (src/components/editor/GameEditor) with its
// TemplateDef from ./templates: the key below is the value saved in Game.templateKey.

import type { TemplateKey } from "./templates";

export type ActivityLang = "en" | "es";

export interface ActivityType {
  key: TemplateKey;
  /** File name in /public/activity-icons (without size suffix). */
  icon: string;
  /** Soft background behind thumbnails of this type. */
  tint: string;
  name: Record<ActivityLang, string>;
  description: Record<ActivityLang, string>;
}

/** Recommended order (left to right, row by row in Create Activity). */
export const ACTIVITY_TYPES: ActivityType[] = [
  {
    key: "FLASHCARDS",
    icon: "flashcards",
    tint: "#fde6df",
    name: { en: "Flashcards", es: "Tarjetas" },
    description: { en: "Review words with picture cards.", es: "Repasa palabras con tarjetas ilustradas." },
  },
  {
    key: "SPIN_THE_WHEEL",
    icon: "spin-the-wheel",
    tint: "#fdf0d3",
    name: { en: "Spin the Wheel", es: "Gira la ruleta" },
    description: { en: "Spin and answer a prompt.", es: "Gira y responde a una consigna." },
  },
  {
    key: "MATCH_AND_SPEAK",
    icon: "match-and-speak",
    tint: "#e1ebf8",
    name: { en: "Match & Speak", es: "Relaciona y habla" },
    description: { en: "Match pairs and say the answer.", es: "Une parejas y di la respuesta." },
  },
  {
    key: "SPELL_THE_WORD",
    icon: "spell-the-word",
    tint: "#dff2e5",
    name: { en: "Spell the Word", es: "Deletrea la palabra" },
    description: { en: "Arrange letters to build a word.", es: "Ordena letras para formar una palabra." },
  },
  {
    key: "SPEAK_AND_ANSWER",
    icon: "image-and-speak",
    tint: "#fdf0d3",
    name: { en: "Image & Speak", es: "Mira y habla" },
    description: { en: "Describe a picture aloud.", es: "Describe una imagen en voz alta." },
  },
  {
    key: "LISTEN_AND_SPEAK",
    icon: "listen-and-repeat",
    tint: "#dcf1ee",
    name: { en: "Listen & Repeat", es: "Escucha y repite" },
    description: { en: "Listen, then repeat aloud.", es: "Escucha y repite en voz alta." },
  },
  {
    key: "OPEN_THE_BOX",
    icon: "open-the-box",
    tint: "#f3ede1",
    name: { en: "Open the Box", es: "Abre la caja" },
    description: { en: "Open a box and reveal a challenge.", es: "Abre una caja y descubre un reto." },
  },
  {
    key: "LABEL_THE_DIAGRAM",
    icon: "label-the-diagram",
    tint: "#e1ebf8",
    name: { en: "Label the Diagram", es: "Etiqueta el diagrama" },
    description: { en: "Place labels on a diagram.", es: "Coloca etiquetas en un diagrama." },
  },
  {
    key: "SPELL_YOUR_NAME",
    icon: "spell-your-name",
    tint: "#dff2e5",
    name: { en: "Spell Your Name", es: "Deletrea tu nombre" },
    description: { en: "Practice spelling your name.", es: "Practica cómo deletrear tu nombre." },
  },
  {
    key: "QUESTION_AND_ANSWER",
    icon: "question-and-answer",
    tint: "#dcf1ee",
    name: { en: "Question & Answer", es: "Pregunta y respuesta" },
    description: { en: "Read a question and respond.", es: "Lee una pregunta y responde." },
  },
  {
    key: "IMAGE_AND_VOCABULARY",
    icon: "picture-words",
    tint: "#fde6df",
    name: { en: "Picture Words", es: "Palabras con imágenes" },
    description: { en: "Connect pictures with words.", es: "Relaciona imágenes con palabras." },
  },
];

/**
 * Older names or spellings a saved activity (or a link) may still carry, mapped to the current
 * key. Game.templateKey is a foreign key to GameTemplate, so the database only holds current keys
 * today; this keeps any older value showing the right icon and name instead of a blank.
 */
export const LEGACY_TEMPLATE_KEYS: Record<string, TemplateKey> = {
  LISTEN_AND_REPEAT: "LISTEN_AND_SPEAK",
  IMAGE_AND_SPEAK: "SPEAK_AND_ANSWER",
  PICTURE_AND_SPEAK: "SPEAK_AND_ANSWER",
  PICTURE_WORDS: "IMAGE_AND_VOCABULARY",
  IMAGE_VOCABULARY: "IMAGE_AND_VOCABULARY",
  QUESTION_ANSWER: "QUESTION_AND_ANSWER",
  Q_AND_A: "QUESTION_AND_ANSWER",
  SPELL_WORD: "SPELL_THE_WORD",
  SPELL_NAME: "SPELL_YOUR_NAME",
  SPIN_WHEEL: "SPIN_THE_WHEEL",
  WHEEL: "SPIN_THE_WHEEL",
  OPEN_BOX: "OPEN_THE_BOX",
  LABEL_DIAGRAM: "LABEL_THE_DIAGRAM",
  MATCH_SPEAK: "MATCH_AND_SPEAK",
  FLASHCARD: "FLASHCARDS",
};

const BY_KEY = new Map(ACTIVITY_TYPES.map((t) => [t.key as string, t]));

/** The current key for a saved or legacy key (unchanged when it is already current or unknown). */
export function canonicalTemplateKey(key: string): string {
  const k = String(key ?? "").trim().toUpperCase().replace(/[\s-]+/g, "_").replace(/&/g, "AND");
  return BY_KEY.has(k) ? k : (LEGACY_TEMPLATE_KEYS[k] ?? key);
}

export function activityType(key: string | null | undefined): ActivityType | undefined {
  if (!key) return undefined;
  return BY_KEY.get(key) ?? BY_KEY.get(canonicalTemplateKey(key));
}

export const ICON_SIZES = [80, 160, 240] as const;
/** Generic games icon for keys without their own (planned templates). */
export const FALLBACK_ICON = "/topic-icons/games.webp";

export function activityIconSrc(key: string | null | undefined, size: (typeof ICON_SIZES)[number] = 160): string {
  const t = activityType(key);
  return t ? `/activity-icons/${t.icon}-${size}.webp` : FALLBACK_ICON;
}

export function activityIconSrcSet(key: string | null | undefined): string | undefined {
  const t = activityType(key);
  return t ? ICON_SIZES.map((s) => `/activity-icons/${t.icon}-${s}.webp ${s}w`).join(", ") : undefined;
}

export function activityName(key: string | null | undefined, lang: ActivityLang = "en"): string {
  return activityType(key)?.name[lang] ?? (key ? key.toLowerCase().replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase()) : "Activity");
}

export function activityDescription(key: string | null | undefined, lang: ActivityLang = "en"): string {
  return activityType(key)?.description[lang] ?? "";
}

export function activityTint(key: string | null | undefined): string {
  return activityType(key)?.tint ?? "#fff1de";
}

/** Recommended order, or alphabetical by the name shown in the active language. */
export function sortActivityTypes<T extends { key: string }>(list: T[], sort: "recommended" | "alphabetical", lang: ActivityLang): T[] {
  if (sort === "alphabetical") {
    return [...list].sort((a, b) => activityName(a.key, lang).localeCompare(activityName(b.key, lang), lang, { sensitivity: "base" }));
  }
  const rank = (k: string) => {
    const i = ACTIVITY_TYPES.findIndex((t) => t.key === k);
    return i < 0 ? ACTIVITY_TYPES.length : i;
  };
  return [...list].sort((a, b) => rank(a.key) - rank(b.key));
}
