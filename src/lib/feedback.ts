// Short, varied, respectful feedback (Montessori: self-correction, no "Wrong!"), in the
// activity's language and always spoken by a voice of that language.
import type { AppLanguage } from "@/lib/tts/voices";

type Kinds = "correct" | "tryAgain" | "listenModel" | "uncertain" | "wrongLanguage" | "letters" | "next" | "waiting" | "done" | "listen" | "yourTurn";

export const PHRASES: Record<AppLanguage, Record<Kinds, readonly string[]>> = {
  "es-419": {
    correct: ["¡Muy bien!", "¡Excelente!", "¡Lo lograste!", "¡Buen trabajo!", "¡Así se dice!", "¡Perfecto!"],
    tryAgain: ["¡Inténtalo de nuevo!", "Casi. ¡Inténtalo otra vez!", "¡Vamos a intentarlo otra vez!"],
    listenModel: ["Escucha con atención.", "¡Escucha otra vez!"],
    uncertain: ["No te escuché bien. ¿Puedes repetirlo?", "Habla un poquito más fuerte, por favor."],
    wrongLanguage: ["Dilo en español, por favor."],
    letters: ["Letra por letra, por favor."],
    next: ["¡Vamos con la siguiente!"],
    waiting: ["Te escucho cuando quieras."],
    done: ["¡Terminaste! ¡Buen trabajo!"],
    listen: ["Escucha."],
    yourTurn: ["Ahora tú."],
  },
  "en-US": {
    correct: ["Great job!", "Well done!", "Excellent!", "You got it!", "Perfect!"],
    tryAgain: ["Let's try again!", "Almost. Try again!"],
    listenModel: ["Listen carefully.", "Listen again!"],
    uncertain: ["I didn't hear you well. Can you say it again?", "A little louder, please."],
    wrongLanguage: ["Say it in English, please."],
    letters: ["Letter by letter, please."],
    next: ["Let's go to the next one!"],
    waiting: ["I'm listening whenever you're ready."],
    done: ["You finished! Great job!"],
    listen: ["Listen."],
    yourTurn: ["Your turn."],
  },
  "fr-FR": {
    correct: ["Très bien !", "Bravo !", "Excellent !", "Tu as réussi !", "Parfait !"],
    tryAgain: ["Essaie encore !", "Presque. Essaie encore !"],
    listenModel: ["Écoute bien.", "Écoute encore !"],
    uncertain: ["Je ne t'ai pas bien entendu. Tu peux répéter ?", "Un peu plus fort, s'il te plaît."],
    wrongLanguage: ["Dis-le en français, s'il te plaît."],
    letters: ["Lettre par lettre, s'il te plaît."],
    next: ["On passe à la suivante !"],
    waiting: ["Je t'écoute quand tu veux."],
    done: ["Tu as terminé ! Bravo !"],
    listen: ["Écoute."],
    yourTurn: ["À toi."],
  },
};

export type PhraseKind = Kinds;

export const phrasesFor = (language: AppLanguage): string[] => Object.values(PHRASES[language] ?? PHRASES["es-419"]).flat();

const last = new Map<string, string>();

/** Picks a phrase, never the same one twice in a row. */
export function pick(kind: PhraseKind, language: AppLanguage = "es-419", seed = Math.random()): string {
  const list = (PHRASES[language] ?? PHRASES["es-419"])[kind];
  let p = list[Math.floor(seed * list.length) % list.length];
  const key = `${language}:${kind}`;
  if (list.length > 1 && p === last.get(key)) p = list[(list.indexOf(p) + 1) % list.length];
  last.set(key, p);
  return p;
}
