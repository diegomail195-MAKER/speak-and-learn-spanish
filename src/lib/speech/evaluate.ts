// Answer evaluation: decides CORRECT / INCORRECT / UNCERTAIN from speech-recognition output.
// This is *recognition scoring* (what was said). Pronunciation assessment (how it was said)
// is a separate, provider-dependent signal and is reported separately when available.
import { compareLetters, lettersOf, parseSpokenLetters } from "./letters";
import { plainText } from "@/lib/text/segments";
import { foldAccents, normalizeText, phoneticKey, similarity, tokens } from "./normalize";

export type Outcome = "CORRECT" | "INCORRECT" | "UNCERTAIN";

export interface RecognitionAlternative {
  text: string;
  /** 0..1 when the engine provides it. */
  confidence?: number | null;
}

export interface AnswerSpec {
  expected: string;
  accepted?: string[];
  mode?: "PHRASE" | "LETTERS";
  /** Accept the key word(s) without the carrier phrase ("perro" for "Es un perro"). */
  acceptShortAnswer?: boolean;
  /** Language the answer must be in (default Spanish). */
  language?: "es-419" | "en-US" | "fr-FR";
}

export interface Evaluation {
  outcome: Outcome;
  score: number;
  reason: EvaluationReason;
  transcript: string;
  matchedAnswer?: string;
  confidence?: number | null;
  /** LETTERS mode: index of first wrong letter, to give a precise hint. */
  letterIndex?: number;
}

export type EvaluationReason =
  | "match"
  | "close_match"
  | "no_speech"
  | "low_confidence"
  | "partial_match"
  | "different_answer"
  | "english_answer"
  | "word_instead_of_letters"
  | "wrong_letter"
  | "unclear_letters"
  // typed answers
  | "empty"
  | "missing_accent"
  | "missing_enye"
  | "wrong_case"
  | "wrong_order"
  | "spelling";

export const REASON_TEXT: Record<EvaluationReason, string> = {
  match: "La respuesta coincide con una respuesta aceptada.",
  close_match: "Coincide fonéticamente (variación de transcripción o pronunciación).",
  no_speech: "No se detectó voz o la transcripción llegó vacía.",
  low_confidence: "El texto coincide pero el motor tiene muy poca confianza.",
  partial_match: "Se parece a la respuesta pero no lo suficiente para decidir.",
  different_answer: "La respuesta es claramente distinta.",
  english_answer: "La respuesta parece estar en inglés.",
  word_instead_of_letters: "Se reconoció una palabra completa en lugar de letras.",
  wrong_letter: "Hay letras que no coinciden.",
  unclear_letters: "No se pudieron identificar suficientes letras.",
  empty: "No escribió nada.",
  missing_accent: "La palabra está bien escrita pero falta o sobra una tilde.",
  missing_enye: "Escribió n en lugar de ñ.",
  wrong_case: "Las letras son correctas pero no las mayúsculas.",
  wrong_order: "Tiene las letras correctas en otro orden.",
  spelling: "Hay letras distintas.",
};

const CORRECT_AT = 0.86;
const MAYBE_AT = 0.65;
const MIN_CONFIDENCE = 0.3;
const CLEAR_AUDIO_CONFIDENCE = 0.75;

// Carrier words that can be dropped when the teacher allows short answers.
const CARRIERS = new Set([
  "es", "son", "un", "una", "unos", "unas", "el", "la", "los", "las", "lo",
  "me", "llamo", "mi", "nombre", "tengo", "soy", "estoy", "esta", "este", "eso", "esto",
]);

const ENGLISH = new Set([
  "the", "is", "it", "its", "it's", "this", "that", "dog", "cat", "bird", "fish", "yes", "hello", "hi",
  "my", "name", "i", "am", "you", "red", "blue", "green", "yellow", "one", "two", "three", "four", "five",
  "what", "and", "of", "to", "he", "she", "they", "house", "school", "teacher", "mom", "dad", "apple", "good", "thank", "thanks",
]);
const SPANISH_HINT = new Set(["es", "un", "una", "el", "la", "yo", "mi", "me", "si", "sí", "de", "y", "que", "con"]);

function phraseKey(s: string): string[] {
  return tokens(s).map(phoneticKey).filter(Boolean);
}

function shortForm(s: string): string | null {
  const t = tokens(s);
  const core = t.filter((w) => !CARRIERS.has(w));
  if (core.length === 0 || core.length === t.length) return null;
  return core.join(" ");
}

/** Best similarity of target within said, allowing the child to add a word or two around it. */
function windowSimilarity(said: string[], target: string[]): number {
  const tgt = target.join(" ");
  let best = similarity(said.join(" "), tgt);
  for (let len = Math.max(1, target.length - 1); len <= target.length + 1; len++) {
    for (let i = 0; i + len <= said.length; i++) {
      const s = similarity(said.slice(i, i + len).join(" "), tgt);
      // Penalise heavily padded answers a little so "no es un perro, es un gato" can't slip through.
      const extra = said.length - len;
      const penalty = extra > 2 ? 0.04 * (extra - 2) : 0;
      best = Math.max(best, s - penalty);
    }
  }
  return best;
}

function looksEnglish(text: string): boolean {
  const t = normalizeText(text).split(" ").filter(Boolean);
  if (!t.length) return false;
  const en = t.filter((w) => ENGLISH.has(w)).length;
  const es = t.filter((w) => SPANISH_HINT.has(w)).length;
  return en / t.length >= 0.5 && es === 0;
}

export function evaluateAnswer(alternatives: RecognitionAlternative[], rawSpec: AnswerSpec): Evaluation {
  // Language tags ("[en]love[/en]") only matter for speech; answers are checked as plain text.
  const spec = { ...rawSpec, expected: plainText(rawSpec.expected), accepted: rawSpec.accepted?.map(plainText) };
  const alts = alternatives.filter((a) => normalizeText(a.text ?? "").length > 0);
  if (alts.length === 0) {
    return { outcome: "UNCERTAIN", score: 0, reason: "no_speech", transcript: "" };
  }
  if (spec.mode === "LETTERS") return evaluateLetters(alts, spec);

  const targets = [spec.expected, ...(spec.accepted ?? [])].filter((t) => normalizeText(t).length > 0);
  if (spec.acceptShortAnswer) {
    for (const t of [...targets]) {
      const sf = shortForm(t);
      if (sf && !targets.includes(sf)) targets.push(sf);
    }
  }

  let best: Evaluation | null = null;
  for (const alt of alts) {
    const said = phraseKey(alt.text);
    for (const target of targets) {
      const exact = tokens(alt.text).join(" ") === tokens(target).join(" ");
      const score = exact ? 1 : windowSimilarity(said, phraseKey(target));
      if (!best || score > best.score) {
        best = {
          outcome: "INCORRECT",
          score,
          reason: exact ? "match" : "close_match",
          transcript: alt.text,
          matchedAnswer: target,
          confidence: alt.confidence ?? null,
        };
      }
    }
  }
  const b = best!;
  const conf = b.confidence;
  const top = alts[0];

  if (b.score >= CORRECT_AT) {
    if (conf != null && conf < MIN_CONFIDENCE) return { ...b, outcome: "UNCERTAIN", reason: "low_confidence" };
    return { ...b, outcome: "CORRECT", reason: b.score === 1 ? "match" : "close_match" };
  }
  if ((spec.language ?? "es-419") === "es-419" && looksEnglish(top.text)) {
    return { ...b, outcome: "INCORRECT", reason: "english_answer", transcript: top.text };
  }
  if (b.score >= MAYBE_AT) {
    if (conf != null && conf >= CLEAR_AUDIO_CONFIDENCE) return { ...b, outcome: "INCORRECT", reason: "different_answer" };
    return { ...b, outcome: "UNCERTAIN", reason: "partial_match" };
  }
  const veryShort = normalizeText(top.text).replace(/\s/g, "").length <= 2;
  if (veryShort || (conf != null && conf < 0.4)) {
    return { ...b, outcome: "UNCERTAIN", reason: "low_confidence", transcript: top.text };
  }
  return { ...b, outcome: "INCORRECT", reason: "different_answer", transcript: top.text };
}

const LEAD_INS = [/^(mi nombre es|me llamo|se deletrea|se escribe|es)\s+/];

function evaluateLetters(alts: RecognitionAlternative[], spec: AnswerSpec): Evaluation {
  const expected = lettersOf(spec.expected);
  let best: Evaluation | null = null;
  for (const alt of alts) {
    let text = normalizeText(alt.text);
    for (const re of LEAD_INS) text = text.replace(re, "");
    const parsed = parseSpokenLetters(text);
    const cmp = compareLetters(expected, parsed.letters);
    const cand: Evaluation = {
      outcome: "INCORRECT",
      score: cmp.score,
      reason: "wrong_letter",
      transcript: alt.text,
      confidence: alt.confidence ?? null,
      letterIndex: cmp.firstMismatch,
      matchedAnswer: spec.expected,
    };
    if (cmp.distance === 0 && parsed.unknown.length === 0) {
      cand.outcome = "CORRECT";
      cand.reason = "match";
    }
    else if (parsed.letters.length < Math.ceil(expected.length / 2)) {
      const saidWholeWord = parsed.unknown.some((u) => similarity(phoneticKey(u), phoneticKey(spec.expected)) >= 0.8);
      cand.outcome = "UNCERTAIN";
      cand.reason = saidWholeWord ? "word_instead_of_letters" : "unclear_letters";
    } else if (cmp.distance === 0) {
      cand.outcome = "CORRECT";
      cand.reason = "close_match";
    }
    const rank = (e: Evaluation) => (e.outcome === "CORRECT" ? 2 : 0) + e.score;
    if (!best || rank(cand) > rank(best)) best = cand;
  }
  return best!;
}

export interface TypedSpec {
  expected: string;
  accepted?: string[];
  /** Capital letters must match (e.g. names, "Lunes" vs "lunes" usually doesn't matter). */
  caseSensitive?: boolean;
}

const cleanTyped = (s: string) => plainText(s).normalize("NFC").trim().replace(/\s+/g, " ").replace(/^[¿¡"“'«\s]+|[?!.,;:"”'»\s]+$/g, "");

/**
 * Typed answers are checked exactly: letters, order, accents and ñ (and capitals when the
 * teacher asks), with a precise reason so the child knows what to fix. Never UNCERTAIN.
 */
export function evaluateTyped(typed: string, spec: TypedSpec): Evaluation {
  const t = cleanTyped(typed);
  if (!t) return { outcome: "INCORRECT", score: 0, reason: "empty", transcript: "" };
  const targets = [spec.expected, ...(spec.accepted ?? [])].map(cleanTyped).filter(Boolean);
  const cmp = (a: string) => (spec.caseSensitive ? a : a.toLowerCase());
  for (const target of targets) {
    if (cmp(t) === cmp(target)) return { outcome: "CORRECT", score: 1, reason: "match", transcript: t, matchedAnswer: target, confidence: 1 };
  }
  const target = targets[0] ?? "";
  const base: Evaluation = { outcome: "INCORRECT", score: 0, reason: "spelling", transcript: t, matchedAnswer: target, confidence: 1 };
  for (const x of targets) {
    if (spec.caseSensitive && t.toLowerCase() === x.toLowerCase()) return { ...base, reason: "wrong_case", score: 0.95, matchedAnswer: x };
    const fa = (s: string) => foldAccents(s.toLowerCase());
    if (fa(t) === fa(x)) return { ...base, reason: "missing_accent", score: 0.9, matchedAnswer: x, letterIndex: firstDiff(t.toLowerCase(), x.toLowerCase()) };
    if (fa(t) === fa(x).replace(/ñ/g, "n")) return { ...base, reason: "missing_enye", score: 0.9, matchedAnswer: x, letterIndex: firstDiff(fa(t), fa(x)) };
  }
  const sorted = (s: string) => [...foldAccents(s.toLowerCase()).replace(/\s/g, "")].sort().join("");
  if (sorted(t) === sorted(target)) return { ...base, reason: "wrong_order", score: 0.7, letterIndex: firstDiff(t.toLowerCase(), target.toLowerCase()) };
  return { ...base, score: similarity(foldAccents(t.toLowerCase()), foldAccents(target.toLowerCase())), letterIndex: firstDiff(t.toLowerCase(), target.toLowerCase()) };
}

function firstDiff(a: string, b: string) {
  const A = [...a];
  const B = [...b];
  for (let i = 0; i < Math.max(A.length, B.length); i++) if (A[i] !== B[i]) return i;
  return -1;
}
