// What an activity is about ("animal", "color", "shape"…), so feedback can describe the real
// content: "You identified the animal correctly." / "Identificaste el animal correctamente."
import type { ActivityType } from "./types";

export interface Noun {
  en: string;
  enPlural: string;
  es: string;
  esPlural: string;
  gender: "m" | "f";
}

export const NOUNS = {
  animal: { en: "animal", enPlural: "animals", es: "animal", esPlural: "animales", gender: "m" },
  color: { en: "color", enPlural: "colors", es: "color", esPlural: "colores", gender: "m" },
  number: { en: "number", enPlural: "numbers", es: "número", esPlural: "números", gender: "m" },
  shape: { en: "shape", enPlural: "shapes", es: "forma", esPlural: "formas", gender: "f" },
  word: { en: "word", enPlural: "words", es: "palabra", esPlural: "palabras", gender: "f" },
  sentence: { en: "sentence", enPlural: "sentences", es: "oración", esPlural: "oraciones", gender: "f" },
  phrase: { en: "phrase", enPlural: "phrases", es: "frase", esPlural: "frases", gender: "f" },
  letter: { en: "letter", enPlural: "letters", es: "letra", esPlural: "letras", gender: "f" },
  answer: { en: "answer", enPlural: "answers", es: "respuesta", esPlural: "respuestas", gender: "f" },
  food: { en: "food", enPlural: "foods", es: "comida", esPlural: "comidas", gender: "f" },
  fruit: { en: "fruit", enPlural: "fruits", es: "fruta", esPlural: "frutas", gender: "f" },
  day: { en: "day", enPlural: "days", es: "día", esPlural: "días", gender: "m" },
  month: { en: "month", enPlural: "months", es: "mes", esPlural: "meses", gender: "m" },
  bodyPart: { en: "body part", enPlural: "body parts", es: "parte del cuerpo", esPlural: "partes del cuerpo", gender: "f" },
  clothing: { en: "piece of clothing", enPlural: "clothes", es: "prenda", esPlural: "prendas", gender: "f" },
  family: { en: "family member", enPlural: "family members", es: "familiar", esPlural: "familiares", gender: "m" },
  place: { en: "place", enPlural: "places", es: "lugar", esPlural: "lugares", gender: "m" },
  object: { en: "object", enPlural: "objects", es: "objeto", esPlural: "objetos", gender: "m" },
  picture: { en: "picture", enPlural: "pictures", es: "imagen", esPlural: "imágenes", gender: "f" },
  label: { en: "label", enPlural: "labels", es: "etiqueta", esPlural: "etiquetas", gender: "f" },
} satisfies Record<string, Noun>;

export type NounKey = keyof typeof NOUNS;

const TOPIC_RULES: Array<[RegExp, NounKey]> = [
  [/animal|pet|mascota|farm|granja|zoo/i, "animal"],
  [/colou?r/i, "color"],
  [/number|número|numero|count|contar/i, "number"],
  [/shape|forma|figura/i, "shape"],
  [/fruit|fruta/i, "fruit"],
  [/food|comida|alimento/i, "food"],
  [/day|día|dia|week|semana/i, "day"],
  [/month|mes/i, "month"],
  [/body|cuerpo/i, "bodyPart"],
  [/cloth|ropa|prenda/i, "clothing"],
  [/family|familia/i, "family"],
  [/place|lugar|city|ciudad|school|escuela/i, "place"],
  [/alphabet|abecedario|letter|letra/i, "letter"],
  [/sentence|oración|oracion/i, "sentence"],
];

/** Picks the noun from the activity's topic/title, then from the activity type. */
export function nounFor(opts: { topic?: string; title?: string; activityType?: ActivityType; expected?: string[] }): NounKey {
  for (const text of [opts.topic, opts.title]) {
    if (!text) continue;
    for (const [re, key] of TOPIC_RULES) if (re.test(text)) return key;
  }
  if (opts.activityType === "sentence_building") return "sentence";
  if (opts.activityType === "number_tracing") return "number";
  if (opts.activityType === "drag_drop") return "label";
  // Mostly multi-word answers ("Es un perro"): sentences; otherwise words.
  const ex = opts.expected ?? [];
  if (ex.length && ex.filter((e) => e.trim().split(/\s+/).length >= 3).length > ex.length / 2) return "sentence";
  return "word";
}

/** "palabra" for single words, "frase" for longer answers: what "listen to the … once more" refers to. */
export function unitFor(model: string): NounKey {
  return model.trim().split(/\s+/).length > 1 ? "phrase" : "word";
}

const EN_NUM = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve"];
const ES_NUM = ["cero", "uno", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve", "diez", "once", "doce"];

export const numEn = (n: number) => EN_NUM[n] ?? String(n);
/** Spanish number words; "una"/"un" agree with the noun. */
export const numEs = (n: number, g: "m" | "f", beforeNoun = false) => (n === 1 ? (g === "f" ? "una" : beforeNoun ? "un" : "uno") : n === 21 ? (g === "f" ? "veintiuna" : "veintiuno") : (ES_NUM[n] ?? String(n)));
