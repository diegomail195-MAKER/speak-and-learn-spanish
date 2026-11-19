// The LextroSpeak 3D category icons (files in /public/topic-icons). Every access to these
// categories uses the same files: the Library topic rows, the topic lesson, the lesson order
// editor and the students' task rows. Old Printables are shown as Worksheet.
export const KIND_ICON_3D: Record<string, string> = {
  VIDEO: "/topic-icons/videos.webp",
  GAME: "/topic-icons/games.webp",
  FLASHCARDS: "/topic-icons/flashcards.webp",
  SONG: "/topic-icons/music-videos.webp",
  SPEAKING: "/topic-icons/speaking.webp",
  WORKSHEET: "/topic-icons/worksheet.webp",
  PRINTABLE: "/topic-icons/worksheet.webp",
  LISTENING: "/topic-icons/listening.webp",
};

/** Short labels under the access icons (plural, like the category names). */
export const KIND_ACCESS_LABEL: Record<string, string> = {
  VIDEO: "Videos",
  GAME: "Games",
  FLASHCARDS: "Flashcards",
  SONG: "Music",
  SPEAKING: "Speaking",
  PRINTABLE: "Worksheet",
  WORKSHEET: "Worksheet",
  LISTENING: "Listening",
};

/** Fixed order of the category accesses in a topic row. */
export const KIND_ORDER = ["VIDEO", "GAME", "FLASHCARDS", "SONG", "SPEAKING", "WORKSHEET", "LISTENING"];
