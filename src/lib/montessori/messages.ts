// Montessori feedback library. Each message has a stable id (stored and customized by id, never
// by its visible text), the situation it belongs to, the condition that allows it and the action
// that follows. Variants keep the same pedagogical intention; English and Spanish variants are
// aligned by position so both lines always say the same thing.
import { NOUNS, numEn, numEs, unitFor, type NounKey } from "./nouns";
import type { ActivityType, FeedbackAction, FeedbackLang } from "./types";

export type Token = "model" | "labelEn" | "count" | "total" | "rest";

export interface MessageDef {
  id: string;
  group: "success" | "support" | "activity" | "technical" | "level";
  /** Number in the Montessori feedback library (Phase 2), when it has one. */
  n?: number;
  title: string;
  condition: string;
  action: FeedbackAction;
  en: string[];
  es: string[];
  /** Tokens a variant needs; variants with a missing token are skipped. */
  requires?: Partial<Record<number, Token[]>>;
}

export const MESSAGES: MessageDef[] = [
  // ---------- A. Success ----------
  {
    id: "success.correct", group: "success", n: 1, title: "Correct answer", action: "advance",
    condition: "The student identifies the requested item correctly.",
    en: ["You {verb} the {thing} correctly.", "That's right. You {verb} the {thing}.", "You {verb} the {thing} correctly: {model}."],
    es: ["{Verb} {el_thing} correctamente.", "Así es. {Verb} {el_thing}.", "{Verb} {el_thing} correctamente: {model}."],
    requires: { 2: ["model"] },
  },
  {
    id: "success.completed", group: "success", n: 2, title: "Completes the activity", action: "none",
    condition: "Every step of the activity was finished. Says nothing about accuracy.",
    en: ["You completed the activity.", "You finished all the steps of this activity."],
    es: ["Completaste la actividad.", "Terminaste todos los pasos de esta actividad."],
  },
  {
    id: "success.independent", group: "success", n: 3, title: "Works without help", action: "none",
    condition: "Correct answers with no hints, shown answers or other help (several in a row, or the whole activity).",
    en: ["You did that independently.", "You did that on your own, with no clues."],
    es: ["Lo hiciste de manera independiente.", "Lo hiciste por tu cuenta, sin pistas."],
  },
  {
    id: "success.mastery", group: "success", n: 4, title: "Shows mastery", action: "none",
    condition: "Every item of the activity is Proficient or Extending: consistent, independent answers over several sessions.",
    en: ["You can identify {all} on your own.", "You know {all} without help."],
    es: ["Puedes identificar {all} sin ayuda.", "Conoces {all} sin ayuda."],
  },
  {
    id: "success.improved", group: "success", n: 5, title: "Improves on earlier attempts", action: "advance",
    condition: "The records show help or a miss on an earlier day, and today the answer is correct with no help.",
    en: ["Last time you needed a clue. Today you remembered it yourself.", "Before, you needed help with this one. Today you did it yourself."],
    es: ["La vez pasada necesitaste una pista. Hoy lo recordaste por tu cuenta.", "Antes necesitaste ayuda con este. Hoy lo hiciste por tu cuenta."],
  },
  {
    id: "success.persisted", group: "success", n: 6, title: "Keeps working on a difficulty", action: "advance",
    condition: "Several tries on the same item before getting it right. No feelings are inferred.",
    en: ["That was challenging, and you kept working on it.", "You kept trying until you found it."],
    es: ["Fue un reto y continuaste trabajando.", "Seguiste intentándolo hasta encontrarlo."],
  },
  {
    id: "success.self_corrected", group: "success", n: 7, title: "Self-corrects", action: "advance",
    condition: "An incorrect answer changed into a correct one before any hint or solution was shown.",
    en: ["You noticed the difference and corrected it yourself.", "You found the change and fixed it yourself."],
    es: ["Notaste la diferencia y lo corregiste por tu cuenta.", "Encontraste el cambio y lo corregiste por tu cuenta."],
  },
  {
    id: "success.used_picture", group: "success", n: 8, title: "Uses a strategy", action: "advance",
    condition: "The student opened the picture clue and then answered correctly.",
    en: ["You used the picture to find the answer.", "The picture helped you find the answer."],
    es: ["Utilizaste la imagen para encontrar la respuesta.", "La imagen te ayudó a encontrar la respuesta."],
  },
  // ---------- B. Repetition or support ----------
  {
    id: "support.practice_together", group: "support", n: 9, title: "Needs practice", action: "practice_missed",
    condition: "Items still need guided practice at the end of the activity.",
    en: ["Let's practice this part together."], es: ["Practiquemos esta parte juntos."],
  },
  {
    id: "support.still_learning", group: "support", n: 10, title: "Doesn't remember yet", action: "model_and_next",
    condition: "The last allowed try for a word: the word is shown and said again.",
    en: ["You're still learning this {unit}. Let's review it.", "This {unit} is still new. Let's review it together."],
    es: ["Todavía estás aprendiendo {esta_unit}. Vamos a repasarla.", "{Esta_unit} todavía es nueva. Vamos a repasarla juntos."],
  },
  {
    id: "support.another_way", group: "support", n: 11, title: "Needs a new presentation", action: "model",
    condition: "The same item was missed again after a hint: it is presented another way (model, letters, picture).",
    en: ["Let me show you another way."], es: ["Déjame mostrarte otra manera."],
  },
  {
    id: "support.look_again", group: "support", n: 12, title: "Makes a mistake", action: "retry",
    condition: "First mistake on an item: the student can look again and correct it, without seeing the answer.",
    en: ["Let's look at this one again.", "Take another look at this one."],
    es: ["Observemos este nuevamente.", "Mira este otra vez con calma."],
  },
  {
    id: "support.some_recognized", group: "support", n: 13, title: "Recognizes some answers", action: "practice_missed",
    condition: "The activity ended with some items correct and some missed. Uses the real counts.",
    en: ["You recognized {count} of the {total} {things}. Let's revisit {rest}."],
    es: ["Reconociste {count} {de_los_total}. Repasemos {rest}."],
  },
  {
    id: "support.compare", group: "support", n: 14, title: "Confuses two items", action: "compare",
    condition: "The answer given is another item of the same activity: both are shown side by side.",
    en: ["Let's compare these two {things}. What do you notice?"], es: ["Comparemos {estos_dos}. ¿Qué diferencias observas?"],
  },
  {
    id: "support.visual", group: "support", n: 15, title: "Needs visual support", action: "offer_visual",
    condition: "A mistake on an item that has a picture clue the student hasn't opened.",
    en: ["Would a picture help you remember?"], es: ["¿Te ayudaría una imagen a recordarlo?"],
  },
  {
    id: "support.listen_model", group: "support", n: 16, title: "Needs to hear the model", action: "model",
    condition: "A second mistake on an item: the correct pronunciation is played.",
    en: ["Listen to the {unit} once more.", "Listen carefully to the {unit} once more."],
    es: ["Escucha {la_unit} una vez más.", "Escucha con atención {la_unit} una vez más."],
  },
  {
    id: "support.first_part", group: "support", n: 17, title: "Can't finish the activity", action: "smaller_steps",
    condition: "The activity was stopped before the end: practice continues with a smaller first part.",
    en: ["Let's work on the first part together."], es: ["Trabajemos juntos en la primera parte."],
  },
  {
    id: "support.different_activity", group: "support", n: 18, title: "Repeated mistakes", action: "alternative_activity",
    condition: "Several items missed (admin threshold): the same items are offered in another modality.",
    en: ["Let's try a different activity to practice this."], es: ["Probemos una actividad diferente para practicarlo."],
  },
  {
    id: "challenge.ready", group: "support", n: 19, title: "Already masters the content", action: "challenge",
    condition: "Mastery confirmed (see success.mastery): a more demanding activity is offered.",
    en: ["You're ready for a new challenge."], es: ["Estás listo para un nuevo desafío."],
  },
  {
    id: "focus.return", group: "support", n: 20, title: "Loses focus", action: "resume",
    condition: "No answer twice in a row while the microphone works: listening pauses and the student continues from the same step.",
    en: ["Let's return to the activity. Where were you?"], es: ["Volvamos a la actividad. ¿Dónde habías quedado?"],
  },
  // ---------- Activity-specific (Phase 3) ----------
  {
    id: "speaking.recognized_incomplete", group: "activity", title: "Speaking: partly correct", action: "model_optional_retry",
    condition: "The key word was said without the full sentence (\"Perro\" for \"Es un perro\"). The word counts as known.",
    en: ["You recognized the {thing}. Let's make a complete sentence."], es: ["Reconociste {el_thing}. Ahora vamos a formar una oración completa."],
  },
  {
    id: "speaking.complete_sentence", group: "activity", title: "Speaking: full sentence after the model", action: "advance",
    condition: "After a short answer, the student said the complete sentence.",
    en: ["You made a complete sentence."], es: ["Formaste una oración completa."],
  },
  {
    id: "speaking.look_picture", group: "activity", title: "Speaking: incorrect answer with a picture", action: "hint",
    condition: "Incorrect spoken answer on an item with a picture: look again, with the teacher's hint.",
    en: ["Let's look at the picture again."], es: ["Observemos nuevamente la imagen."],
  },
  {
    id: "speaking.model", group: "activity", title: "Speaking: model after the last try", action: "model_and_next",
    condition: "Still incorrect after the allowed tries: the model is presented and the activity moves on.",
    en: ["This is a {labelEn}. In Spanish, we say: {model}.", "Listen: {model}."],
    es: ["Observa la imagen y escucha: {model}.", "Escucha: {model}."],
    requires: { 0: ["labelEn", "model"], 1: ["model"] },
  },
  {
    id: "speaking.say_in_target", group: "activity", title: "Speaking: answered in English", action: "retry",
    condition: "The answer was in English in a Spanish activity.",
    en: ["Let's say it in Spanish."], es: ["Vamos a decirlo en español."],
  },
  {
    id: "spelling.look_part", group: "activity", title: "Spelling: look at a part of the word", action: "retry_highlight",
    condition: "Typed spelling with a mistake: the part that needs attention is highlighted; the word is not shown.",
    en: ["Look at this part of the word again."], es: ["Observa nuevamente esta parte de la palabra."],
  },
  {
    id: "spelling.self_corrected", group: "activity", title: "Spelling: corrected without the solution", action: "advance",
    condition: "The spelling was corrected before the solution was shown.",
    en: ["You corrected the spelling yourself."], es: ["Corregiste la escritura por tu cuenta."],
  },
  {
    id: "spelling.letter_by_letter", group: "activity", title: "Spelling: whole word instead of letters", action: "retry",
    condition: "The word was said instead of its letters. Not counted as a mistake.",
    en: ["Say it letter by letter, please."], es: ["Dilo letra por letra, por favor."],
  },
  {
    id: "memory.all_matched", group: "activity", title: "Memory: all pairs found", action: "none",
    condition: "Every pair of the memory game was found.",
    en: ["You matched all the {things}."], es: ["Encontraste todas las parejas de {things}."],
  },
  {
    id: "memory.kept_looking", group: "activity", title: "Memory: many turns", action: "none",
    condition: "More turns than pairs: normal in a memory game, never presented as a failure.",
    en: ["You kept looking for the matching pictures."], es: ["Seguiste buscando las imágenes que correspondían."],
  },
  // ---------- Technical (never recorded as academic errors) ----------
  {
    id: "tech.not_heard", group: "technical", title: "Answer not recognized", action: "recover",
    condition: "Silence, noise or low recognition confidence. Never marked incorrect.",
    en: ["I couldn't hear you clearly. You can try again.", "I didn't catch that. You can say it again."],
    es: ["No pude escucharte con claridad. Puedes intentarlo nuevamente.", "No alcancé a escucharte. Puedes decirlo otra vez."],
  },
  {
    id: "tech.waiting", group: "technical", title: "Waiting for an answer", action: "none",
    condition: "No answer yet (first time). Nothing is recorded.",
    en: ["Take your time. I'm listening."], es: ["Tómate tu tiempo. Te escucho."],
  },
  {
    id: "tech.mic", group: "technical", title: "Microphone or device problem", action: "recover",
    condition: "Microphone blocked, missing or interrupted, or the connection failed. Progress is not affected.",
    en: ["The microphone stopped. Your work is saved, and you can continue."], es: ["El micrófono se detuvo. Tu trabajo está guardado y puedes continuar."],
  },
  {
    id: "session.resumed", group: "technical", title: "Activity reopened", action: "resume",
    condition: "An unfinished activity was opened again: it continues from the last step.",
    en: ["Welcome back. Let's continue where you left off."], es: ["Hola de nuevo. Sigamos donde te quedaste."],
  },
  // ---------- Progress levels (Phase 4) ----------
  { id: "level.exploring", group: "level", title: "Level 1 — Exploring", action: "none", condition: "Getting familiar with the words and ideas.", en: ["We're learning these words together."], es: ["Estamos aprendiendo estas palabras juntos."] },
  { id: "level.developing", group: "level", title: "Level 2 — Developing", action: "none", condition: "Recognizes some words with pictures, gestures or help.", en: ["You recognized the word with a picture clue."], es: ["Reconociste la palabra con ayuda de una imagen."] },
  { id: "level.progressing", group: "level", title: "Level 3 — Progressing", action: "none", condition: "Identifies and uses several words; some still need practice.", en: ["You're remembering more words on your own."], es: ["Estás recordando más palabras por tu cuenta."] },
  { id: "level.proficient", group: "level", title: "Level 4 — Proficient", action: "none", condition: "Uses what was learned correctly, consistently and without help.", en: ["You used the phrase independently."], es: ["Utilizaste la frase de manera independiente."] },
  { id: "level.extending", group: "level", title: "Level 5 — Extending", action: "none", condition: "Applies the knowledge in new situations.", en: ["You used the phrase in a new situation."], es: ["Utilizaste la frase en una situación nueva."] },
];

export const MESSAGE_BY_ID: Record<string, MessageDef> = Object.fromEntries(MESSAGES.map((m) => [m.id, m]));

/** Past-tense verb for "You … the animal correctly", by activity. */
const VERBS: Partial<Record<ActivityType, { en: string; es: string }>> = {
  spelling: { en: "spelled", es: "Deletreaste" },
  writing: { en: "wrote", es: "Escribiste" },
  pronunciation: { en: "said", es: "Dijiste" },
  speaking: { en: "named", es: "Nombraste" },
  matching: { en: "matched", es: "Emparejaste" },
  memory: { en: "matched", es: "Emparejaste" },
  drag_drop: { en: "placed", es: "Colocaste" },
  number_tracing: { en: "traced", es: "Trazaste" },
  sentence_building: { en: "built", es: "Formaste" },
};

export interface RenderContext {
  activityType: ActivityType;
  noun: NounKey;
  model?: string;
  labelEn?: string;
  count?: number;
  total?: number;
}

function tokens(ctx: RenderContext) {
  const n = NOUNS[ctx.noun];
  const g = n.gender;
  const v = VERBS[ctx.activityType] ?? { en: "identified", es: "Identificaste" };
  const unit = NOUNS[unitFor(ctx.model ?? "")];
  const total = ctx.total ?? 0;
  const count = ctx.count ?? 0;
  const rest = Math.max(0, total - count);
  const def = (g2: "m" | "f", pl = false) => (pl ? (g2 === "f" ? "las" : "los") : g2 === "f" ? "la" : "el");
  const allEn = total <= 1 ? `the ${n.en}` : total === 2 ? `both ${n.enPlural}` : `all ${numEn(total)} ${n.enPlural}`;
  const allEs = total <= 1 ? `${def(g)} ${n.es}` : total === 2 ? `${g === "f" ? "las dos" : "los dos"} ${n.esPlural}` : `${def(g, true)} ${numEs(total, g, true)} ${n.esPlural}`;
  const restEn = rest === 1 ? "the other one" : `the other ${numEn(rest)}`;
  const restEs = rest === 1 ? (g === "f" ? "la otra" : "el otro") : `${g === "f" ? "las otras" : "los otros"} ${numEs(rest, g, true)}`;
  const en: Record<string, string> = {
    thing: n.en, things: n.enPlural, verb: v.en, unit: unit.en, model: ctx.model ?? "", labelEn: ctx.labelEn ?? "",
    count: numEn(count), total: numEn(total), rest: restEn, all: allEn,
  };
  const es: Record<string, string> = {
    thing: n.es, things: n.esPlural, el_thing: `${def(g)} ${n.es}`, Verb: v.es, model: ctx.model ?? "", labelEn: ctx.labelEn ?? "",
    unit: unit.es, la_unit: `${def(unit.gender)} ${unit.es}`, esta_unit: `${unit.gender === "f" ? "esta" : "este"} ${unit.es}`,
    Esta_unit: `${unit.gender === "f" ? "Esta" : "Este"} ${unit.es}`,
    count: numEs(count, g), de_los_total: `de ${def(g, true)} ${numEs(total, g, true)} ${n.esPlural}`, rest: restEs, all: allEs,
    estos_dos: `${g === "f" ? "estas dos" : "estos dos"} ${n.esPlural}`,
  };
  return { en, es };
}

const fill = (tpl: string, t: Record<string, string>) => tpl.replace(/\{(\w+)\}/g, (_, k: string) => t[k] ?? "").replace(/\s+([.,?!:])/g, "$1").replace(/\s{2,}/g, " ").trim();

const has: Record<Token, (c: RenderContext) => boolean> = {
  model: (c) => !!c.model?.trim(),
  labelEn: (c) => !!c.labelEn?.trim(),
  count: (c) => c.count != null,
  total: (c) => c.total != null,
  rest: (c) => c.total != null && c.count != null,
};

/** Admin overrides: replace the variants of a message, per language. */
export type MessageOverrides = Record<string, { en?: string[]; es?: string[] }>;

/** Indices of the variants usable with this context. */
export function usableVariants(def: MessageDef, ctx: RenderContext, overrides?: MessageOverrides): number[] {
  const o = overrides?.[def.id];
  const len = Math.max(o?.en?.length ?? def.en.length, o?.es?.length ?? def.es.length);
  const out: number[] = [];
  for (let i = 0; i < len; i++) {
    const req = o ? [] : (def.requires?.[i] ?? []);
    if (req.every((r) => has[r](ctx))) out.push(i);
  }
  return out.length ? out : [0];
}

export function renderMessage(id: string, variant: number, ctx: RenderContext, overrides?: MessageOverrides): Record<FeedbackLang, string> {
  const def = MESSAGE_BY_ID[id];
  if (!def) throw new Error(`Unknown feedback message: ${id}`);
  const o = overrides?.[id];
  const en = o?.en?.length ? o.en : def.en;
  const es = o?.es?.length ? o.es : def.es;
  const t = tokens(ctx);
  return { en: fill(en[variant % en.length], t.en), es: fill(es[variant % es.length], t.es) };
}

/**
 * Every feedback line of an activity that can be recorded ahead of time (no per-answer content
 * such as the model answer or counts), so a natural voice can be generated when it is published.
 */
export function pregeneratedLines(ctx: Pick<RenderContext, "activityType" | "noun">, overrides?: MessageOverrides, disabled: string[] = []): Array<{ lang: FeedbackLang; text: string }> {
  const perAnswer = /\{(model|labelEn|count|total|rest|all)\}/;
  const out = new Map<string, { lang: FeedbackLang; text: string }>();
  for (const def of MESSAGES) {
    if (def.group === "level" || def.id.startsWith("memory.") || disabled.includes(def.id)) continue;
    const en = overrides?.[def.id]?.en?.length ? overrides[def.id].en! : def.en;
    const es = overrides?.[def.id]?.es?.length ? overrides[def.id].es! : def.es;
    for (let i = 0; i < Math.max(en.length, es.length); i++) {
      if (perAnswer.test(en[i % en.length]) || perAnswer.test(es[i % es.length])) continue;
      // "word" and "phrase" versions of {unit}.
      for (const model of ["palabra", "una frase"]) {
        const r = renderMessage(def.id, i, { ...ctx, model }, overrides);
        out.set(`en:${r.en}`, { lang: "en", text: r.en });
        out.set(`es:${r.es}`, { lang: "es", text: r.es });
      }
    }
  }
  return [...out.values()];
}
