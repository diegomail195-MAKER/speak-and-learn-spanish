// Short, varied, respectful feedback (Montessori: self-correction, no "Wrong!").
export const PHRASES = {
  correct: ["¡Muy bien!", "¡Lo lograste!", "¡Excelente!", "¡Así se dice!", "¡Perfecto!"],
  tryAgain: ["¡Vamos a intentarlo otra vez!", "Casi. ¡Inténtalo otra vez!"],
  listenModel: ["Escucha con atención."],
  uncertain: ["No te escuché bien. ¿Puedes repetirlo?", "Habla un poquito más fuerte, por favor."],
  english: ["Dilo en español, por favor."],
  letters: ["Letra por letra, por favor."],
  next: ["¡Vamos con la siguiente!"],
  waiting: ["Te escucho cuando quieras."],
  done: ["¡Terminaste! ¡Buen trabajo!"],
} as const;

export type PhraseKind = keyof typeof PHRASES;

export const ALL_PHRASES: string[] = Object.values(PHRASES).flat();

export function pick(kind: PhraseKind, seed = Math.random()): string {
  const list = PHRASES[kind];
  return list[Math.floor(seed * list.length) % list.length];
}
