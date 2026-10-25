// Mixed-language text. A spoken text can switch language inside one sentence:
//   ¿Cómo se dice en español, [en]love[/en]?
//   [en]How do you say[/en] manzana [en]in English?[/en]
// Untagged text is in the field's base language. Tags are set or confirmed by the teacher;
// proposeTags() only suggests them (a word's spelling alone never decides its language).
import type { AppLanguage } from "@/lib/tts/voices";

export type TagCode = "es" | "en" | "fr";
export const TAG_LANG: Record<TagCode, AppLanguage> = { es: "es-419", en: "en-US", fr: "fr-FR" };
export const LANG_TAG: Record<AppLanguage, TagCode> = { "es-419": "es", "en-US": "en", "fr-FR": "fr" };
export const LANG_NAME: Record<AppLanguage, string> = { "es-419": "Español", "en-US": "English", "fr-FR": "Français" };

export interface Segment {
  text: string;
  language: AppLanguage;
}

const TAG_RE = /\[(es|en|fr)\]([\s\S]*?)\[\/\1\]/g;

export const hasTags = (text: string) => /\[(es|en|fr)\][\s\S]*?\[\/(es|en|fr)\]/.test(text);

/** Text without language tags (what is shown on screen and used for answer checking). */
export function plainText(text: string): string {
  return text.replace(TAG_RE, "$2");
}

/** Splits tagged text into language runs. Adjacent runs in the same language are merged. */
export function parseSegments(text: string, base: AppLanguage): Segment[] {
  const out: Segment[] = [];
  const push = (t: string, language: AppLanguage) => {
    if (!t) return;
    const last = out.at(-1);
    if (last && last.language === language) last.text += t;
    else out.push({ text: t, language });
  };
  let i = 0;
  for (const m of text.matchAll(TAG_RE)) {
    push(text.slice(i, m.index), base);
    push(m[2], TAG_LANG[m[1] as TagCode]);
    i = m.index! + m[0].length;
  }
  push(text.slice(i), base);
  return out;
}

/** Runs that are actually spoken: punctuation/space-only runs join the previous run. */
export function speechSegments(text: string, base: AppLanguage): Segment[] {
  const out: Segment[] = [];
  for (const s of parseSegments(text, base)) {
    if (!/[\p{L}\p{N}]/u.test(s.text) && out.length) out[out.length - 1] = { ...out.at(-1)!, text: out.at(-1)!.text + s.text };
    else out.push({ ...s });
  }
  // A leading punctuation-only run (e.g. "¿") belongs to the next run.
  if (out.length > 1 && !/[\p{L}\p{N}]/u.test(out[0].text)) {
    out[1] = { ...out[1], text: out[0].text + out[1].text };
    out.shift();
  }
  return out.map((s) => ({ ...s, text: s.text.trim() })).filter((s) => s.text);
}

/** Wraps [start, end) of the *tagged* text in a language tag (removing tags inside it). */
export function tagRange(text: string, start: number, end: number, lang: AppLanguage, base: AppLanguage): string {
  if (start >= end) return text;
  const inner = plainText(text.slice(start, end));
  const wrapped = lang === base ? inner : `[${LANG_TAG[lang]}]${inner}[/${LANG_TAG[lang]}]`;
  return text.slice(0, start) + wrapped + text.slice(end);
}

export function clearTags(text: string) {
  return plainText(text);
}

/**
 * Replaces tagged runs with spaces of the same length so a checker never touches foreign
 * words, while offsets still match the original text.
 */
export function maskTagged(text: string): string {
  return text.replace(TAG_RE, (m) => " ".repeat(m.length));
}

// ---------- Suggestions ----------

// Small vocabularies of words a Spanish class quotes in another language. They only produce
// *proposals*; the teacher confirms each one.
const EN = new Set(
  "love hello hi goodbye bye please thanks thank you yes no dog cat bird fish horse cow pig duck chicken mouse rabbit bear lion tiger elephant monkey apple banana orange grape strawberry milk water bread cheese juice cookie cake house school teacher book pencil pen table chair door window friend family mother father mom dad brother sister baby boy girl happy sad big small red blue green yellow black white pink purple brown one two three four five six seven eight nine ten good morning afternoon night day sun moon star rain snow tree flower car bus ball toy game play run jump eat drink sleep read write sing dance how what where when who why say said word english spanish french the is are it this that my your name".split(" "),
);
const FR = new Set(
  "bonjour bonsoir salut merci oui non au revoir pomme chat chien maison école ami amie famille mère père frère soeur sœur bébé garçon fille rouge bleu vert jaune noir blanc un deux trois quatre cinq six sept huit neuf dix bonne nuit jour soleil lune fleur arbre livre crayon table chaise porte fenêtre lait eau pain fromage gâteau comment dit-on dire mot français anglais espagnol s'il vous plaît plaît".split(" "),
);
// Words that are also ordinary Spanish words: never proposed unless quoted or in capitals.
const ALSO_SPANISH = new Set(["no", "red", "come", "pan", "son", "me", "a", "is", "dice", "table", "six", "chat", "fin", "sale", "pie", "once", "ten", "mi", "con", "de", "le", "la", "les", "en", "un", "une", "est", "porte", "dire", "mot"]);
const ES_HINT = new Set("manzana perro gato casa escuela hola adiós gracias amor rojo azul verde amarillo uno dos tres libro mesa silla agua leche pan queso familia amigo amiga niño niña mamá papá sol luna flor árbol".split(" "));

export interface TagProposal {
  /** Offsets in the tagged text. */
  start: number;
  end: number;
  word: string;
  language: AppLanguage;
  why: "quoted" | "capitals" | "vocabulary" | "letters";
}

const FUNCTION_WORDS: Partial<Record<AppLanguage, Set<string>>> = {
  "en-US": new Set(["do", "does", "in", "to", "of", "a", "an", "we", "i", "can", "you", "say", "the", "is"]),
  "fr-FR": new Set(["de", "en", "le", "la", "les", "un", "une", "on", "est", "et"]),
  "es-419": new Set(["de", "en", "el", "la", "los", "las", "un", "una", "y", "es"]),
};

const FRENCH_LETTERS = /[àâæçèêëîïôœùûÿ]/i;
const SPANISH_LETTERS = /[ñáíóú¿¡]/i;

function guess(word: string, base: AppLanguage): AppLanguage | null {
  const w = word.toLowerCase();
  if (FRENCH_LETTERS.test(w) || FR.has(w)) return "fr-FR";
  if (EN.has(w)) return "en-US";
  if (SPANISH_LETTERS.test(w) || ES_HINT.has(w)) return "es-419";
  return base === "es-419" ? null : null;
}

/** Suggests language tags for untagged words. Nothing is applied automatically. */
export function proposeTags(text: string, base: AppLanguage): TagProposal[] {
  const out: TagProposal[] = [];
  const masked = maskTagged(text);
  const taken = (s: number, e: number) => out.some((p) => s < p.end && e > p.start);

  // 1. Quoted words or phrases: “love”, "love", «bonjour», 'love'
  for (const m of masked.matchAll(/[“"«‘']\s*([\p{L}][\p{L}'’\- ]{0,40}?)\s*[”"»’']/gu)) {
    const word = m[1];
    const start = m.index! + m[0].indexOf(word);
    const end = start + word.length;
    const lang = guess(word.split(/\s+/)[0], base) ?? (base === "es-419" ? "en-US" : "es-419");
    if (lang !== base) out.push({ start, end, word, language: lang, why: "quoted" });
  }
  // 2. Words in capitals inside a sentence that isn't all capitals: LOVE, BONJOUR
  const letters = masked.replace(/[^\p{L}]/gu, "");
  const mostlyCaps = letters.length > 0 && letters.replace(/[^\p{Lu}]/gu, "").length / letters.length > 0.6;
  if (!mostlyCaps) {
    for (const m of masked.matchAll(/\b\p{Lu}{2,}(?:[ -]\p{Lu}{2,})*\b/gu)) {
      const start = m.index!;
      const end = start + m[0].length;
      if (taken(start, end)) continue;
      const lang = guess(m[0].split(/[ -]/)[0], base) ?? (base === "es-419" ? "en-US" : "es-419");
      if (lang !== base) out.push({ start, end, word: m[0], language: lang, why: "capitals" });
    }
  }
  // 3. Known foreign vocabulary or letters that only exist in another language. Small function
  //    words ("do", "in", "de") join a neighbouring foreign word so phrases stay together.
  const words = [...masked.matchAll(/[\p{L}][\p{L}'’-]*/gu)].map((m) => ({ start: m.index!, end: m.index! + m[0].length, w: m[0].toLowerCase(), raw: m[0], lang: null as AppLanguage | null, strong: false }));
  for (const t of words) {
    if (taken(t.start, t.end)) continue;
    if (ALSO_SPANISH.has(t.w) && base === "es-419") continue;
    const lang = guess(t.w, base);
    if (!lang || lang === base) continue;
    if (base !== "es-419" && lang === "es-419" && !SPANISH_LETTERS.test(t.w) && !ES_HINT.has(t.w)) continue;
    t.lang = lang;
    t.strong = true;
  }
  for (let changed = true; changed; ) {
    changed = false;
    words.forEach((t, k) => {
      if (t.lang || taken(t.start, t.end)) return;
      for (const n of [words[k - 1], words[k + 1]]) {
        if (n?.lang && FUNCTION_WORDS[n.lang]?.has(t.w) && /^[\s]*$/.test(masked.slice(Math.min(n.end, t.end), Math.max(n.start, t.start)))) {
          t.lang = n.lang;
          changed = true;
          return;
        }
      }
    });
  }
  for (const t of words) {
    if (!t.lang || taken(t.start, t.end)) continue;
    out.push({ start: t.start, end: t.end, word: t.raw, language: t.lang, why: FRENCH_LETTERS.test(t.w) || SPANISH_LETTERS.test(t.w) ? "letters" : "vocabulary" });
  }
  // Adjacent proposals in the same language become one run ("how do you say").
  out.sort((a, b) => a.start - b.start);
  const merged: TagProposal[] = [];
  for (const p of out) {
    const last = merged.at(-1);
    const joinable = (x: TagProposal["why"]) => x === "vocabulary" || x === "letters";
    if (last && last.language === p.language && /^\s*$/.test(masked.slice(last.end, p.start)) && (last.why === p.why || (joinable(last.why) && joinable(p.why)))) {
      last.end = p.end;
      last.word = text.slice(last.start, last.end);
    } else merged.push({ ...p });
  }
  return merged;
}
