// Topic classification shared by the admin forms, filters and server actions.

/** Languages a topic can teach (ISO codes). */
export const TOPIC_LANGUAGES = ["es", "en", "fr"] as const;
export type TopicLanguage = (typeof TOPIC_LANGUAGES)[number];

export const LANGUAGE_LABEL: Record<string, string> = { es: "Spanish", en: "English", fr: "French" };

export const TOPIC_STATUS_LABEL: Record<string, string> = { PUBLISHED: "Published", DRAFT: "Draft", ARCHIVED: "Archived" };
