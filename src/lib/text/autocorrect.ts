// Autocorrect for teachers typing Spanish, English or French on any keyboard.
// When a word is finished (space, punctuation or leaving the field) it is fixed in place:
// accents and ñ / ç ("nino" → "niño", "ecole" → "école"), ¿ and ¡ in Spanish, the space before
// ? ! : ; in French, and contractions in English ("dont" → "don't"). Backspace right after a
// correction undoes it. Accent maps come from Hunspell word lists (scripts/build-accent-maps.mjs)
// and only hold unambiguous words, so "como", "esta" or "si" are never changed out of context.

import { ALWAYS, QUESTION_WORDS } from "./spanish-check";

export type Lang = "es" | "en" | "fr";
export type AccentMap = Record<string, string>;

export const toLang = (l: string | undefined | null): Lang => (l?.startsWith("fr") ? "fr" : l?.startsWith("en") ? "en" : "es");

const maps: Partial<Record<Lang, AccentMap>> = { en: {} };
const loading: Partial<Record<Lang, Promise<AccentMap>>> = {};

/** Loads a language's accent map once (separate chunks, fetched the first time it's needed). */
export function loadMap(lang: Lang): Promise<AccentMap> {
  if (maps[lang]) return Promise.resolve(maps[lang]!);
  loading[lang] ??= (lang === "fr" ? import("./accents-fr.json") : import("./accents-es.json")).then((m) => (maps[lang] = (m.default ?? m) as AccentMap));
  return loading[lang]!;
}
export const mapIfLoaded = (lang: Lang) => maps[lang];

const EN_FIX: Record<string, string> = {
  i: "I", im: "I'm", ive: "I've", ill: "I'll", id: "I'd", dont: "don't", doesnt: "doesn't", didnt: "didn't", cant: "can't", couldnt: "couldn't",
  wouldnt: "wouldn't", shouldnt: "shouldn't", isnt: "isn't", arent: "aren't", wasnt: "wasn't", werent: "weren't", hasnt: "hasn't",
  havent: "haven't", hadnt: "hadn't", youre: "you're", youve: "you've", youll: "you'll", theyre: "they're", theyve: "they've",
  thats: "that's", whats: "what's", wheres: "where's", whos: "who's", hows: "how's", lets: "let's", theres: "there's", heres: "here's",
};
// Spanish words the dictionary lists as ambiguous but that almost always mean the accented word in class.
const ES_EXTRA: Record<string, string> = { ...ALWAYS, pinguino: "pingüino", pinguinos: "pingüinos", cigueña: "cigüeña", cigüena: "cigüeña" };
// French: "ca" is listed as ambiguous (ça / çà) but in class it is always "ça".
const FR_EXTRA: Record<string, string> = { ca: "ça" };

const ES_MARKERS = /\b(el|la|los|las|es|un|una|que|de|y|en|con|por|para|mi|tu|su|muy|hola|qué|cómo|está|son|del|al|este|esta|gracias)\b|[ñ¿¡áíóú]/giu;
const EN_MARKERS = /\b(the|is|are|a|an|and|of|to|in|my|your|what|how|this|that|it|you|he|she|we|they|with|for|do|does|color|colour)\b/giu;
const FR_MARKERS = /\b(le|la|les|un|une|des|et|est|de|du|en|avec|pour|mon|ton|son|très|bonjour|merci|je|tu|il|elle|nous|vous|ce|cette|quel|quelle)\b|[çœèêàâîôûù]/giu;

/** The language being written: from the words typed so far, or the field's language. */
export function detectLang(text: string, fallback: Lang): Lang {
  const score = (re: RegExp) => (text.match(re) ?? []).length;
  const s: Record<Lang, number> = { es: score(ES_MARKERS), en: score(EN_MARKERS), fr: score(FR_MARKERS) };
  s[fallback] += 0.5; // ties go to the field's language
  const best = (Object.keys(s) as Lang[]).sort((a, b) => s[b] - s[a])[0];
  return s[best] >= 1.5 ? best : fallback;
}

function matchCase(original: string, replacement: string) {
  if (original.length > 1 && original === original.toUpperCase()) return replacement.toUpperCase();
  if (original[0] !== original[0].toLowerCase()) return replacement[0].toUpperCase() + replacement.slice(1);
  return replacement;
}

/** The corrected spelling of one word, or null when it is fine. */
export function fixWord(word: string, lang: Lang, map: AccentMap | undefined): string | null {
  const lw = word.toLowerCase();
  if (lang === "en") return EN_FIX[lw] ? (lw === "i" ? "I" : matchCase(word, EN_FIX[lw])) : null;
  const hit = (lang === "es" ? ES_EXTRA[lw] : FR_EXTRA[lw]) ?? map?.[lw];
  return hit && hit !== lw ? matchCase(word, hit) : null;
}

const WORD_END = /([\p{L}']+)$/u;
const BOUNDARY = /^[\s.,;:!?¿¡)"»…]$/u;

export type Correction = { start: number; original: string; replacement: string };
export type Result = { value: string; caret: number; corrections: Correction[] };

/**
 * Applies autocorrect after `typed` was inserted at `caret` (caret is after the typed text).
 * `skip` holds what the teacher undid (lower-case words, or the inserted ¿ ¡ / no-break space), which is left alone.
 */
export function afterInput(value: string, caret: number, typed: string, lang: Lang, map: AccentMap | undefined, skip: Set<string> = new Set()): Result {
  const corrections: Correction[] = [];
  if (!typed || !BOUNDARY.test(typed.slice(-1))) return { value, caret, corrections };
  let v = value;
  let c = caret;
  const before = v.slice(0, c - typed.length);
  const m = before.match(WORD_END);
  if (m) {
    const start = before.length - m[1].length;
    const rep = skip.has(m[1].toLowerCase()) ? null : fixWord(m[1], lang, map);
    if (rep) {
      v = v.slice(0, start) + rep + v.slice(start + m[1].length);
      c += rep.length - m[1].length;
      corrections.push({ start, original: m[1], replacement: rep });
    }
  }
  const ch = typed.slice(-1);
  if (lang === "es" && (ch === "?" || ch === "!")) {
    // Opening ¿ / ¡ at the start of the sentence, and the accent on a leading question word.
    const open = ch === "?" ? "¿" : "¡";
    const head = v.slice(0, c - 1);
    const sentenceStart = Math.max(head.lastIndexOf(". "), head.lastIndexOf("? "), head.lastIndexOf("! "), head.lastIndexOf("\n")) + 1;
    let s = sentenceStart;
    while (s < head.length && /\s/.test(head[s])) s++;
    const sentence = head.slice(s);
    if (!sentence.includes(open) && sentence.trim() && !skip.has(open)) {
      v = v.slice(0, s) + open + v.slice(s);
      c += 1;
      corrections.push({ start: s, original: "", replacement: open });
    }
    if (ch === "?") {
      const q = v.slice(s).match(/^¿?([\p{L}]+)/u);
      const w = q?.[1];
      if (w && QUESTION_WORDS[w.toLowerCase()] && !skip.has(w.toLowerCase())) {
        const at = s + (v[s] === "¿" ? 1 : 0);
        const rep = matchCase(w, QUESTION_WORDS[w.toLowerCase()]);
        v = v.slice(0, at) + rep + v.slice(at + w.length);
        c += rep.length - w.length;
        corrections.push({ start: at, original: w, replacement: rep });
      }
    }
  }
  if (lang === "fr" && /[?!:;]/.test(ch)) {
    // French puts a (no-break) space before ? ! : ;
    const i = c - 1;
    if (i > 0 && /[\p{L}\d»)]/u.test(v[i - 1]) && !skip.has("\u00a0")) {
      v = v.slice(0, i) + " " + v.slice(i);
      c += 1;
      corrections.push({ start: i, original: "", replacement: " " });
    }
  }
  return { value: v, caret: c, corrections };
}

/** Corrects the last word when the teacher leaves the field (no boundary was typed after it). */
export function onLeave(value: string, lang: Lang, map: AccentMap | undefined, skip: Set<string> = new Set()): Result {
  const m = value.match(WORD_END);
  if (!m) return { value, caret: value.length, corrections: [] };
  const start = value.length - m[1].length;
  const rep = skip.has(m[1].toLowerCase()) ? null : fixWord(m[1], lang, map);
  if (!rep) return { value, caret: value.length, corrections: [] };
  return { value: value.slice(0, start) + rep, caret: start + rep.length, corrections: [{ start, original: m[1], replacement: rep }] };
}
