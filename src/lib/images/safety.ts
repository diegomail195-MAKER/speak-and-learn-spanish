// Child-safety rules for internet image search (no server-only import so they can be unit tested).
// Layers: 1) blocked words in the search and in each result's tags (English + Spanish),
//         2) the provider's own SafeSearch (Pixabay safesearch=true, human-reviewed library),
//         3) optional Google Cloud Vision SafeSearch on every image (GOOGLE_VISION_API_KEY), fail-closed.

const BLOCKED_WORDS = [
  // sexual / nudity
  "sex", "sexy", "sexual", "sexo", "porn", "porno", "pornografia", "xxx", "nude", "nudes", "nudity", "naked", "desnudo", "desnuda", "desnudos", "desnudas",
  "desnudez", "erotic", "erotica", "erotico", "erotismo", "lingerie", "lenceria", "bikini", "bikinis", "topless", "nsfw", "boobs", "tetas", "pechos", "breasts",
  "nipple", "nipples", "pezon", "pezones", "genital", "genitals", "genitales", "pene", "penis", "vagina", "butt", "trasero", "culo", "nalgas", "stripper",
  "striptease", "prostitute", "prostituta", "escort", "fetish", "fetiche", "bdsm", "hentai", "onlyfans", "seductive", "seductora", "sensual", "kiss", "besando",
  "underwear", "ropa interior", "thong", "tanga", "playboy", "orgasm", "orgasmo", "masturbation", "masturbacion", "condom", "condon",
  // violence / gore
  "blood", "bloody", "sangre", "sangriento", "gore", "kill", "killing", "killer", "matar", "asesino", "asesinato", "murder", "homicide", "homicidio",
  "corpse", "cadaver", "dead body", "muerto", "muertos", "suicide", "suicidio", "self harm", "autolesion", "torture", "tortura", "violence", "violencia",
  "violent", "violento", "massacre", "masacre", "terrorist", "terrorista", "terrorism", "terrorismo", "bomb", "bomba", "explosion", "shooting", "tiroteo",
  "gun", "guns", "pistol", "pistola", "rifle", "fusil", "weapon", "weapons", "arma", "armas", "ammo", "municion", "bullet", "bala", "balas", "grenade",
  "granada de mano", "war crime", "beheading", "decapitacion", "decapitado", "execution", "ejecucion", "wound", "herida", "injury", "accident victim",
  "abuse", "abuso", "fight", "pelea", "punch", "golpe", "horror", "terror", "zombie", "zombi", "demon", "demonio", "satan", "satanico", "skull", "calavera",
  // drugs / alcohol / tobacco
  "drug", "drugs", "droga", "drogas", "cocaine", "cocaina", "heroin", "heroina", "marijuana", "marihuana", "cannabis", "weed", "meth", "syringe", "jeringa",
  "cigarette", "cigarro", "cigarrillo", "smoking", "fumar", "vape", "beer", "cerveza", "whisky", "vodka", "drunk", "borracho", "alcohol",
  // hate
  "nazi", "swastika", "esvastica", "kkk", "racist", "racista",
];

/** Lowercase, strip accents and punctuation, so "Desnúdo!" matches "desnudo". */
export function normalize(text: string): string {
  return ` ${text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9ñ]+/g, " ")
    .trim()} `;
}

const NORMALIZED = BLOCKED_WORDS.map((w) => normalize(w));

/** True when the text contains a blocked word or phrase (whole words, so "class" never matches "ass"). */
export function hasBlockedWords(text: string): boolean {
  const t = normalize(text);
  if (/porn|xxx|nsfw|hentai/.test(t)) return true;
  return NORMALIZED.some((w) => t.includes(w));
}

export type Likelihood = "UNKNOWN" | "VERY_UNLIKELY" | "UNLIKELY" | "POSSIBLE" | "LIKELY" | "VERY_LIKELY";
export type SafeSearchAnnotation = Partial<Record<"adult" | "spoof" | "medical" | "violence" | "racy", Likelihood>>;

const RANK: Record<Likelihood, number> = { UNKNOWN: 0, VERY_UNLIKELY: 1, UNLIKELY: 2, POSSIBLE: 3, LIKELY: 4, VERY_LIKELY: 5 };

/**
 * Strict thresholds for children: anything at least "possibly" adult, violent or racy is blocked,
 * and medical images from "likely". A missing annotation counts as unsafe (fail closed).
 */
export function isSafeAnnotation(a: SafeSearchAnnotation | null | undefined): boolean {
  if (!a) return false;
  const r = (k: keyof SafeSearchAnnotation) => RANK[a[k] ?? "UNKNOWN"] ?? 0;
  return r("adult") < RANK.POSSIBLE && r("violence") < RANK.POSSIBLE && r("racy") < RANK.POSSIBLE && r("medical") < RANK.LIKELY;
}
