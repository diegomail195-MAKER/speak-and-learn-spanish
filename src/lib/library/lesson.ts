// What the guided Topic lesson says, in Spanish then English. Shared by the lesson player (what to
// show and say) and the server (which clips to create with the natural voices).

export type LessonKind = "VIDEO" | "SONG" | "GAME" | "FLASHCARDS" | "PRINTABLE" | "WORKSHEET" | "SPEAKING";
export type Line = { es: string; en: string };

export const LESSON = {
  start: (title: string): Line => ({ es: `Vamos a aprender sobre ${title}.`, en: `Let's learn about ${title}.` }),
  next: { es: "Ahora vamos a nuestra siguiente actividad.", en: "Now let's move on to our next activity." },
  flashcards: { es: "Ahora vamos a practicar con las tarjetas.", en: "Now let's practice with flashcards." },
  game: { es: "Ahora vamos a jugar.", en: "Now let's play a game." },
  speaking: { es: "Ahora vamos a practicar hablando.", en: "Now let's practice speaking." },
  final: { es: "¿Deseas practicar otra vez o seguir a la siguiente tarea?", en: "Would you like to practice again or move on to your next assignment?" },
  /** When there is no other assignment: the exit is My Assignments. */
  finalLast: { es: "¿Deseas practicar otra vez o volver a tus tareas?", en: "Would you like to practice again or go back to your assignments?" },
} as const;

/** The line that presents a step: by type, or the general transition (videos, songs, printables). */
export function stepLine(kind: LessonKind): Line {
  if (kind === "FLASHCARDS") return LESSON.flashcards;
  if (kind === "GAME") return LESSON.game;
  if (kind === "SPEAKING") return LESSON.speaking;
  return LESSON.next;
}

/** Every line of a lesson with this title, for the natural voices (Spanish voice, then English). */
export function lessonClips(title: string): Array<{ text: string; language: "es-419" | "en-US" }> {
  const lines: Line[] = [LESSON.start(title), LESSON.next, LESSON.flashcards, LESSON.game, LESSON.speaking, LESSON.final, LESSON.finalLast];
  return lines.flatMap((l) => [
    { text: l.es, language: "es-419" as const },
    { text: l.en, language: "en-US" as const },
  ]);
}

export const lessonClipKey = (language: string, text: string) => `${language}|${text.trim()}`;

/** The lesson's spoken title: the teacher's title without the bilingual suffix ("Los saludos · Greetings" → "Los saludos"). */
export const spokenTitle = (title: string) => title.split(" · ")[0].trim() || title.trim();
