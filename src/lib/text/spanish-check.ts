// Offline Spanish writing checks for teachers typing on US keyboards.
// Produces *suggestions* only; nothing is changed without the teacher accepting it.
// When LANGUAGETOOL_API_URL is configured, its results are merged in (see /api/text/check).

export interface Suggestion {
  offset: number;
  length: number;
  original: string;
  replacement: string;
  message: string;
  kind: "spelling" | "accent" | "punctuation" | "grammar";
  source: "builtin" | "languagetool";
}

// Words that are always written with an accent / ñ / ü (no unaccented homograph in common use).
const ALWAYS: Record<string, string> = {
  nino: "niño", nina: "niña", ninos: "niños", ninas: "niñas", senor: "señor", senora: "señora", senorita: "señorita",
  manana: "mañana", espanol: "español", espanola: "española", pequeno: "pequeño", pequena: "pequeña", sueno: "sueño", otono: "otoño",
  montana: "montaña", arana: "araña", pina: "piña", muneca: "muñeca", banera: "bañera", companero: "compañero", companera: "compañera",
  cumpleanos: "cumpleaños", anos: "años", pinguino: "pingüino", pinguinos: "pingüinos", cigueña: "cigüeña", verguenza: "vergüenza",
  adios: "adiós", tambien: "también", despues: "después", aqui: "aquí", alli: "allí", ahi: "ahí", jamas: "jamás", ademas: "además",
  arbol: "árbol", lapiz: "lápiz", raton: "ratón", leon: "león", camion: "camión", avion: "avión", corazon: "corazón", cancion: "canción",
  leccion: "lección", numero: "número", numeros: "números", musica: "música", pajaro: "pájaro", telefono: "teléfono", sabado: "sábado",
  miercoles: "miércoles", dia: "día", dias: "días", rapido: "rápido", facil: "fácil", dificil: "difícil", ingles: "inglés",
  frances: "francés", japones: "japonés", azucar: "azúcar", platano: "plátano", maiz: "maíz", jamon: "jamón", limon: "limón", melon: "melón",
  sandia: "sandía", tiburon: "tiburón", murcielago: "murciélago", camaleon: "camaleón", buho: "búho", delfin: "delfín",
  estomago: "estómago", oido: "oído", mama: "mamá", papa: "papá", bebe: "bebé", sofa: "sofá", cafe: "café",
  util: "útil", ultimo: "último", proximo: "próximo", rapidamente: "rápidamente", tia: "tía", tio: "tío",
  matematicas: "matemáticas", educacion: "educación", fisica: "física", region: "región", estacion: "estación",
  television: "televisión", habitacion: "habitación", informacion: "información",
};
// Note: "mamá/papá/bebé" are listed because in a kids' Spanish class they almost always mean the family words.

// Question words take an accent in direct questions.
const QUESTION_WORDS: Record<string, string> = {
  como: "cómo", que: "qué", donde: "dónde", cuando: "cuándo", cual: "cuál", cuales: "cuáles", quien: "quién", quienes: "quiénes",
  cuanto: "cuánto", cuanta: "cuánta", cuantos: "cuántos", cuantas: "cuántas", adonde: "adónde",
};
// Verb forms that only need the accent in the context below.
const ESTAR = { esta: "está", estas: "estás", estan: "están" };
const AFTER_ESTAR = /^(feliz|triste|bien|mal|cansad[oa]s?|content[oa]s?|enojad[oa]s?|enferm[oa]s?|aqu[ií]|all[ií]|en|muy|listo|lista|sentad[oa]|abierta|abierto|cerrad[oa]|lloviendo|nublado|soleado|haciendo|jugando|comiendo|durmiendo|leyendo)$/i;

const WORD = /[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+/g;

function matchCase(original: string, replacement: string) {
  if (original === original.toUpperCase() && original.length > 1) return replacement.toUpperCase();
  if (original[0] === original[0].toUpperCase()) return replacement[0].toUpperCase() + replacement.slice(1);
  return replacement;
}

export function checkSpanish(text: string, keepWords: Iterable<string> = []): Suggestion[] {
  const keep = new Set([...keepWords].map((w) => w.toLowerCase()));
  const out: Suggestion[] = [];
  const words = [...text.matchAll(WORD)].map((m) => ({ w: m[0], i: m.index! }));
  const trimmed = text.trim();
  const firstWord = words[0]?.w.toLowerCase();
  const isQuestion = /\?\s*$/.test(trimmed) || /^¿/.test(trimmed) || (!!firstWord && firstWord in QUESTION_WORDS && !/[.!]\s*$/.test(trimmed));

  words.forEach(({ w, i }, k) => {
    const lw = w.toLowerCase();
    if (keep.has(lw)) return;
    if (ALWAYS[lw] && ALWAYS[lw] !== lw) {
      out.push({ offset: i, length: w.length, original: w, replacement: matchCase(w, ALWAYS[lw]), message: `“${ALWAYS[lw]}” se escribe con tilde o ñ.`, kind: lw.includes("n") && ALWAYS[lw].includes("ñ") ? "spelling" : "accent", source: "builtin" });
    } else if (isQuestion && k === 0 && QUESTION_WORDS[lw]) {
      out.push({ offset: i, length: w.length, original: w, replacement: matchCase(w, QUESTION_WORDS[lw]), message: "Las palabras interrogativas llevan tilde en las preguntas.", kind: "accent", source: "builtin" });
    } else if (lw in ESTAR) {
      const next = words[k + 1]?.w;
      // "¿Cómo estás?", "¿Dónde está mi lápiz?" vs. demonstrative "esta casa".
      const verbInQuestion = isQuestion && (!next || /^(t[uú]|usted|ustedes|el|él|la|mi|tu|su|mis|tus|sus|hoy)$/i.test(next));
      if ((next && AFTER_ESTAR.test(next)) || verbInQuestion) {
        const rep = ESTAR[lw as keyof typeof ESTAR];
        out.push({ offset: i, length: w.length, original: w, replacement: matchCase(w, rep), message: `Verbo estar: “${rep}”.`, kind: "accent", source: "builtin" });
      }
    }
  });

  if (isQuestion && trimmed) {
    if (!trimmed.startsWith("¿")) {
      const lead = text.length - text.trimStart().length;
      out.push({ offset: lead, length: 0, original: "", replacement: "¿", message: "En español las preguntas empiezan con “¿”.", kind: "punctuation", source: "builtin" });
    }
    if (!trimmed.endsWith("?")) {
      out.push({ offset: text.trimEnd().length, length: 0, original: "", replacement: "?", message: "Cierra la pregunta con “?”.", kind: "punctuation", source: "builtin" });
    }
  } else if (/!\s*$/.test(trimmed) && !trimmed.startsWith("¡")) {
    const lead = text.length - text.trimStart().length;
    out.push({ offset: lead, length: 0, original: "", replacement: "¡", message: "Las exclamaciones empiezan con “¡”.", kind: "punctuation", source: "builtin" });
  } else if (words.length >= 3 && /^[A-ZÁÉÍÓÚÑ]/.test(trimmed) && !/[.!?…:;]\s*$/.test(trimmed)) {
    out.push({ offset: text.trimEnd().length, length: 0, original: "", replacement: ".", message: "Termina la oración con un punto.", kind: "punctuation", source: "builtin" });
  }
  return out.sort((a, b) => a.offset - b.offset);
}

export function applySuggestion(text: string, s: Suggestion): string {
  return text.slice(0, s.offset) + s.replacement + text.slice(s.offset + s.length);
}

/** Applies several suggestions right-to-left so offsets stay valid. */
export function applyAll(text: string, list: Suggestion[]): string {
  return [...list].sort((a, b) => b.offset - a.offset).reduce(applySuggestion, text);
}
