// The Spanish alphabet (27 letters) with letter *names* — the name of a letter ("ce") is not
// its sound inside a word. Regional variants are accepted by the letter recognizer
// (src/lib/speech/letters.ts) whatever the spoken model uses.

export interface Letter {
  upper: string;
  lower: string;
  /** Name used for the spoken model. */
  name: string;
  /** Other names heard in Latin America / Spain. */
  variants: string[];
  examples: string[];
}

export const ALPHABET: Letter[] = [
  { upper: "A", lower: "a", name: "a", variants: [], examples: ["árbol", "avión"] },
  { upper: "B", lower: "b", name: "be", variants: ["be larga", "be grande", "be alta"], examples: ["barco", "ballena"] },
  { upper: "C", lower: "c", name: "ce", variants: [], examples: ["casa", "cielo"] },
  { upper: "D", lower: "d", name: "de", variants: [], examples: ["dedo", "delfín"] },
  { upper: "E", lower: "e", name: "e", variants: [], examples: ["elefante", "estrella"] },
  { upper: "F", lower: "f", name: "efe", variants: [], examples: ["flor", "foca"] },
  { upper: "G", lower: "g", name: "ge", variants: [], examples: ["gato", "girasol"] },
  { upper: "H", lower: "h", name: "hache", variants: [], examples: ["helado", "hoja"] },
  { upper: "I", lower: "i", name: "i", variants: ["i latina"], examples: ["iglesia", "isla"] },
  { upper: "J", lower: "j", name: "jota", variants: [], examples: ["jirafa", "jugo"] },
  { upper: "K", lower: "k", name: "ka", variants: [], examples: ["kiwi", "koala"] },
  { upper: "L", lower: "l", name: "ele", variants: [], examples: ["luna", "león"] },
  { upper: "M", lower: "m", name: "eme", variants: [], examples: ["mano", "mariposa"] },
  { upper: "N", lower: "n", name: "ene", variants: [], examples: ["nube", "nariz"] },
  { upper: "Ñ", lower: "ñ", name: "eñe", variants: [], examples: ["ñandú", "niño"] },
  { upper: "O", lower: "o", name: "o", variants: [], examples: ["oso", "ojo"] },
  { upper: "P", lower: "p", name: "pe", variants: [], examples: ["perro", "pato"] },
  { upper: "Q", lower: "q", name: "cu", variants: [], examples: ["queso", "quince"] },
  { upper: "R", lower: "r", name: "ere", variants: ["erre"], examples: ["ratón", "rosa"] },
  { upper: "S", lower: "s", name: "ese", variants: [], examples: ["sol", "sapo"] },
  { upper: "T", lower: "t", name: "te", variants: [], examples: ["tortuga", "tomate"] },
  { upper: "U", lower: "u", name: "u", variants: [], examples: ["uva", "uno"] },
  { upper: "V", lower: "v", name: "uve", variants: ["ve", "ve corta", "ve chica", "be corta"], examples: ["vaca", "ventana"] },
  { upper: "W", lower: "w", name: "doble uve", variants: ["doble ve", "doble u", "uve doble"], examples: ["wafle", "kiwi"] },
  { upper: "X", lower: "x", name: "equis", variants: [], examples: ["xilófono", "taxi"] },
  { upper: "Y", lower: "y", name: "ye", variants: ["i griega"], examples: ["yoyo", "yate"] },
  { upper: "Z", lower: "z", name: "zeta", variants: [], examples: ["zapato", "zorro"] },
];

/** Regional choice for the spoken names of V, W and Y (what the app *says*). */
export type LetterNameStyle = "rae" | "latam";
export const LETTER_STYLES: Array<{ value: LetterNameStyle; label: string; v: string; w: string; y: string }> = [
  { value: "rae", label: "uve · doble uve · ye (RAE)", v: "uve", w: "doble uve", y: "ye" },
  { value: "latam", label: "ve corta · doble ve · i griega (common in Latin America)", v: "ve corta", w: "doble ve", y: "i griega" },
];

export function letterName(letter: string, style: LetterNameStyle = "rae"): string {
  const L = ALPHABET.find((x) => x.upper === letter.toUpperCase());
  if (!L) return letter;
  const st = LETTER_STYLES.find((s) => s.value === style)!;
  if (L.upper === "V") return st.v;
  if (L.upper === "W") return st.w;
  if (L.upper === "Y") return st.y;
  return L.name;
}
