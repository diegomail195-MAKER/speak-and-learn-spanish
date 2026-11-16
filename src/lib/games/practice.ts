// "¡Vamos a practicar! Let's practice!": the speaking round after a flashcards deck. Shared by the
// player (what to show and ask) and the server (which clips to create with the natural voice).
// Feedback follows the Montessori feedback library: describe what the student did, no "Wrong!",
// the answer is only given after the last try.
import { plainText } from "@/lib/text/segments";
import type { PlayFace, PlayGame, PlayQuestion } from "./types";

export type Lang = PlayGame["language"];
export type Line = { es: string; en: string };

/** Fixed lines of the speaking round, Spanish and English aligned by position. */
export const PRACTICE = {
  /** Said on the results screen (both languages). */
  invite: { es: "¡Vamos a practicar! Activa el micrófono.", en: "Let's practice! Turn on the microphone." },
  /** Said when the round starts (both languages). */
  start: { es: "Mira cada tarjeta y responde en voz alta.", en: "Look at each card and say the answer out loud." },
  correct: [
    { es: "Así es.", en: "That's right." },
    { es: "Lo dijiste correctamente.", en: "You said it correctly." },
    { es: "Lo hiciste por tu cuenta.", en: "You did it on your own." },
  ],
  /** Correct after a first miss, before the answer was given. */
  corrected: [
    { es: "Seguiste intentándolo hasta encontrarlo.", en: "You kept trying until you found it." },
    { es: "Notaste la diferencia y lo corregiste.", en: "You noticed the difference and corrected it." },
  ],
  /** First miss: look again, the answer is not given. */
  retry: [
    { es: "Observemos este nuevamente.", en: "Let's look at this one again." },
    { es: "Mira este otra vez con calma.", en: "Take another look at this one." },
  ],
  /** Second miss: the answer is given. */
  model: [{ es: "Todavía estás aprendiendo esta palabra. Escucha con atención.", en: "You're still learning this word. Listen carefully." }],
  uncertain: [{ es: "No te escuché bien. ¿Puedes repetirlo?", en: "I didn't hear you well. Can you say it again?" }],
  waiting: [{ es: "Te escucho cuando quieras.", en: "I'm listening whenever you're ready." }],
  done: { es: "Completaste la actividad.", en: "You completed the activity." },
} as const;

export const say = (l: Line, lang: Lang) => (lang === "en-US" ? l.en : l.es);
export const sub = (l: Line, lang: Lang) => (lang === "en-US" ? l.es : l.en);

/** Every fixed line with the language it is spoken in (for the natural voice). */
export function practicePhraseClips(): Array<{ text: string; language: Lang }> {
  const lines: Line[] = [PRACTICE.invite, PRACTICE.start, PRACTICE.done, ...PRACTICE.correct, ...PRACTICE.corrected, ...PRACTICE.retry, ...PRACTICE.model, ...PRACTICE.uncertain, ...PRACTICE.waiting];
  return lines.flatMap((l) => [{ text: l.es, language: "es-419" as Lang }, { text: l.en, language: "en-US" as Lang }]);
}

export const clipKey = (language: string, text: string) => `${language}|${text.trim()}`;

const COLORS_ES = /^(rojo|roja|azul|verde|amarillo|amarilla|naranja|anaranjado|anaranjada|morado|morada|rosado|rosada|rosa|blanco|blanca|negro|negra|gris|café|marrón|violeta|celeste|dorado|dorada|plateado|plateada|lila|turquesa|beige)$/;
const COLORS_EN = /^(red|blue|green|yellow|orange|purple|pink|white|black|gray|grey|brown|violet|gold|silver|turquoise|beige)$/;

/** A rough guess of the language a short card text is written in. */
export function guessLang(text: string, fallback: Lang): Lang {
  const t = plainText(text).toLowerCase().trim();
  if (/[áéíóúñ¿¡]/.test(t) || /^(el|la|los|las|un|una|unos|unas)\s/.test(t) || COLORS_ES.test(t)) return "es-419";
  if (/[àâçèêëîïôûœ]/.test(t) || /^(le|les|une|des)\s/.test(t)) return "fr-FR";
  if (/^(the|a|an)\s/.test(t) || COLORS_EN.test(t)) return "en-US";
  return fallback;
}

/** The teacher's question for a card: its own prompt, "¿Qué color es este?" for colours, else "¿Qué es esto?". */
export function practiceQuestion(answer: string, lang: Lang, prompt?: string): Line & { text: string } {
  if (prompt && plainText(prompt).trim()) return { es: prompt, en: "", text: prompt };
  const word = plainText(answer).toLowerCase().replace(/[.!¡?¿]/g, "").replace(/^(el|la|the)\s+/, "").trim();
  const line = COLORS_ES.test(word) || COLORS_EN.test(word) ? { es: "¿Qué color es este?", en: "What color is this?" } : { es: "¿Qué es esto?", en: "What is this?" };
  return { ...line, text: say(line, lang) };
}

export interface PracticeCard {
  q: PlayQuestion;
  /** What the student sees: a picture and/or words. */
  show: Pick<PlayFace, "text" | "imageUrl" | "imageAlt">;
  /** The question, in the answer's language, and its translation. */
  question: string;
  questionSub: string;
}

const asLang = (l: string | undefined): Lang | undefined => (l === "es-419" || l === "en-US" || l === "fr-FR" ? l : undefined);

/**
 * Turns the deck into speaking questions, the way a teacher would ask them: the card's spoken
 * answer when it has one; otherwise the front is shown and the back is said; a card whose back is
 * only a picture shows that picture and the front's words are said. Cards with nothing to say
 * are left out.
 */
export function practiceCards(game: PlayGame): PracticeCard[] {
  const out: PracticeCard[] = [];
  for (const q of game.questions) {
    const frontText = plainText(q.displayText ?? "");
    const backText = plainText(q.back?.text ?? "");
    const front = { text: q.displayText, imageUrl: q.imageUrl, imageAlt: q.imageAlt };
    let expected = "";
    let answerLanguage: Lang = q.answerLanguage;
    let show = front;
    if (plainText(q.expected)) {
      expected = q.expected;
    } else if (backText && (frontText || q.imageUrl)) {
      expected = q.back!.text;
      answerLanguage = guessLang(backText, q.data.translationLanguage ?? asLang(q.back?.audio?.language) ?? game.language);
      if (q.imageUrl && frontText) show = { ...front, text: "" }; // the picture asks; the front's words would give it away
    } else if (frontText && q.back?.imageUrl) {
      expected = q.displayText;
      answerLanguage = guessLang(frontText, game.language);
      show = { text: "", imageUrl: q.back.imageUrl, imageAlt: q.back.imageAlt };
    } else if (frontText && q.imageUrl) {
      expected = q.displayText;
      answerLanguage = guessLang(frontText, game.language);
      show = { ...front, text: "" };
    }
    if (!plainText(expected)) continue;
    const ask = practiceQuestion(expected, answerLanguage, q.prompt);
    out.push({
      q: {
        ...q,
        expected,
        answerLanguage,
        mode: "PHRASE",
        accepted: q.accepted ?? [],
        supportText: "",
        hint: "",
        audio: null,
        prompt: ask.text,
        promptAudioUrl: q.prompt ? q.promptAudioUrl : null,
        modelAudioUrl: plainText(q.expected) ? q.modelAudioUrl : null,
      },
      show,
      question: ask.text,
      questionSub: q.prompt ? "" : sub(ask, answerLanguage),
    });
  }
  return out;
}

/** Card clips to create with the natural voice: each question and each answer. */
export function practiceCardClips(game: PlayGame): Array<{ text: string; language: Lang }> {
  return practiceCards(game).flatMap((c) => [
    ...(c.q.promptAudioUrl ? [] : [{ text: c.question, language: c.q.answerLanguage }]),
    ...(c.q.modelAudioUrl ? [] : [{ text: c.q.expected, language: c.q.answerLanguage }]),
  ]);
}
