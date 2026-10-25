// Spanish text normalization used to compare what a child said with what the teacher expects.
// Never compare raw strings: speech engines drop accents, capitalisation and punctuation,
// write numbers as digits and add filler sounds.

const UNITS = [
  "cero", "uno", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve",
  "diez", "once", "doce", "trece", "catorce", "quince", "dieciséis", "diecisiete", "dieciocho", "diecinueve",
  "veinte", "veintiuno", "veintidós", "veintitrés", "veinticuatro", "veinticinco", "veintiséis", "veintisiete", "veintiocho", "veintinueve",
];
const TENS: Record<number, string> = {
  30: "treinta", 40: "cuarenta", 50: "cincuenta", 60: "sesenta", 70: "setenta", 80: "ochenta", 90: "noventa",
};

export function numberToSpanish(n: number): string | null {
  if (!Number.isInteger(n) || n < 0 || n > 1000) return null;
  if (n < 30) return UNITS[n];
  if (n < 100) {
    const t = Math.floor(n / 10) * 10;
    const u = n % 10;
    return u === 0 ? TENS[t] : `${TENS[t]} y ${UNITS[u]}`;
  }
  if (n === 100) return "cien";
  if (n === 1000) return "mil";
  const h = Math.floor(n / 100);
  const rest = n % 100;
  const hundreds = ["", "ciento", "doscientos", "trescientos", "cuatrocientos", "quinientos", "seiscientos", "setecientos", "ochocientos", "novecientos"][h];
  return rest === 0 ? (h === 1 ? "cien" : hundreds) : `${hundreds} ${numberToSpanish(rest)}`;
}

// Hesitation sounds that engines sometimes transcribe. Real words (e.g. "este") are kept.
const FILLERS = new Set(["eh", "ehh", "em", "emm", "mm", "mmm", "um", "umm", "uh", "ah", "ahh", "hmm", "mhm"]);

/** Lowercase, strip punctuation and filler sounds, spell out digits. Keeps accents and ñ. */
export function normalizeText(input: string): string {
  let s = input.normalize("NFC").toLowerCase();
  s = s.replace(/(\d+)/g, (m) => numberToSpanish(Number(m)) ?? m);
  s = s.replace(/[¿?¡!.,;:"“”'‘’()\[\]{}…\-–—/\\*_#@%&+=<>|~^`]/g, " ");
  return s
    .split(/\s+/)
    .filter((t) => t && !FILLERS.has(t))
    .join(" ");
}

/** Removes accents (á→a, ü→u) but keeps ñ, which is a different letter in Spanish. */
export function foldAccents(s: string): string {
  return s
    .replace(/ñ/g, "\u0000")
    .replace(/Ñ/g, "\u0001") // capital Ñ is a letter of its own too
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\u0000/g, "ñ")
    .replace(/\u0001/g, "Ñ");
}

export function tokens(s: string): string[] {
  return foldAccents(normalizeText(s)).split(" ").filter(Boolean);
}

/**
 * Phonetic key for Latin American Spanish: collapses spellings that sound the same
 * (b/v, s/z/ce/ci, ll/y, silent h, qu/k/c, ge/gi/j, rr/r) so transcription spelling
 * differences and seseo do not count as errors.
 */
export function phoneticKey(word: string): string {
  let w = foldAccents(word.toLowerCase());
  w = w.replace(/ch/g, "C"); // keep ch distinct before dropping h
  w = w.replace(/h/g, "");
  w = w.replace(/ll/g, "y");
  w = w.replace(/y$/g, "i");
  w = w.replace(/qu(?=[ei])/g, "k");
  w = w.replace(/gu(?=[ei])/g, "g_");
  w = w.replace(/g(?=[ei])/g, "j");
  w = w.replace(/g_/g, "g");
  w = w.replace(/c(?=[ei])/g, "s");
  w = w.replace(/c/g, "k");
  w = w.replace(/q/g, "k");
  w = w.replace(/z/g, "s");
  w = w.replace(/v/g, "b");
  w = w.replace(/w/g, "u");
  w = w.replace(/x/g, "ks");
  w = w.replace(/ñ/g, "N");
  w = w.replace(/(.)\1+/g, "$1"); // rr→r, ll handled, double vowels
  return w;
}

export function levenshtein<T>(a: readonly T[] | string, b: readonly T[] | string, eq: (x: T, y: T) => boolean = (x, y) => x === y): number {
  const A = typeof a === "string" ? (Array.from(a) as unknown as T[]) : a;
  const B = typeof b === "string" ? (Array.from(b) as unknown as T[]) : b;
  const m = A.length;
  const n = B.length;
  if (m === 0) return n;
  if (n === 0) return m;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) {
      const cost = eq(A[i - 1], B[j - 1]) ? 0 : 1;
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
    }
    prev = cur;
  }
  return prev[n];
}

export function similarity(a: string, b: string): number {
  if (!a && !b) return 1;
  const d = levenshtein(a, b);
  return 1 - d / Math.max(a.length, b.length);
}
