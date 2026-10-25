// Spanish (Latin American) letter names. Isolated letters are short sounds that general
// transcription engines often mishear, so spelling is scored letter-by-letter here.
import { foldAccents, levenshtein, normalizeText } from "./normalize";

// Multi-word names first so "i griega" wins over "i".
const MULTI: Array<[string[], string]> = [
  [["doble", "uve"], "W"],
  [["i", "latina"], "I"],
  [["i", "griega"], "Y"],
  [["y", "griega"], "Y"],
  [["doble", "ve"], "W"],
  [["doble", "u"], "W"],
  [["doble", "v"], "W"],
  [["uve", "doble"], "W"],
  [["ve", "doble"], "W"],
  [["be", "larga"], "B"],
  [["be", "grande"], "B"],
  [["be", "alta"], "B"],
  [["ve", "corta"], "V"],
  [["ve", "chica"], "V"],
  [["ve", "pequeña"], "V"],
  [["be", "corta"], "V"],
  [["be", "chica"], "V"],
  [["uve"], "V"],
];

const SINGLE: Record<string, string> = {
  a: "A", ah: "A",
  be: "B", b: "B", ve: "V", v: "V",
  ce: "C", c: "C", se: "C", sé: "C",
  de: "D", d: "D", dé: "D",
  e: "E", he: "E",
  efe: "F", f: "F",
  ge: "G", g: "G", je: "G",
  hache: "H", ache: "H", h: "H",
  i: "I", y: "I", hi: "I",
  jota: "J", j: "J", hota: "J",
  ka: "K", k: "K", ca: "K",
  ele: "L", l: "L",
  eme: "M", m: "M",
  ene: "N", n: "N",
  eñe: "Ñ", enie: "Ñ", enye: "Ñ", "ñ": "Ñ",
  o: "O", oh: "O",
  pe: "P", p: "P",
  cu: "Q", q: "Q", ku: "Q",
  erre: "R", ere: "R", r: "R",
  ese: "S", s: "S",
  te: "T", t: "T", té: "T",
  u: "U",
  equis: "X", x: "X",
  ye: "Y",
  zeta: "Z", z: "Z", seta: "Z", ceta: "Z", zeda: "Z",
};

export interface ParsedLetters {
  letters: string[];
  unknown: string[];
}

export function parseSpokenLetters(transcript: string): ParsedLetters {
  const toks = normalizeText(transcript).split(" ").filter(Boolean);
  const letters: string[] = [];
  const unknown: string[] = [];
  let i = 0;
  outer: while (i < toks.length) {
    for (const [seq, letter] of MULTI) {
      if (seq.every((s, k) => foldAccents(toks[i + k] ?? "") === foldAccents(s))) {
        letters.push(letter);
        i += seq.length;
        continue outer;
      }
    }
    const t = toks[i];
    const hit = SINGLE[t] ?? SINGLE[foldAccents(t)];
    if (hit) letters.push(hit);
    else unknown.push(t);
    i++;
  }
  return { letters, unknown };
}

export function lettersOf(word: string): string[] {
  return Array.from(foldAccents(word.normalize("NFC")).toUpperCase()).filter((c) => /[A-ZÑ]/.test(c));
}

// "be" and "ve" sound identical in Latin American Spanish; children rarely add "larga/corta".
const sameSound = (a: string, b: string) => a === b || (a === "B" && b === "V") || (a === "V" && b === "B");

export function compareLetters(expected: string[], said: string[]) {
  const distance = levenshtein(expected, said, sameSound);
  let firstMismatch = -1;
  for (let k = 0; k < Math.max(expected.length, said.length); k++) {
    if (!expected[k] || !said[k] || !sameSound(expected[k], said[k])) {
      firstMismatch = k;
      break;
    }
  }
  return { distance, firstMismatch, score: expected.length ? Math.max(0, 1 - distance / expected.length) : 0 };
}
