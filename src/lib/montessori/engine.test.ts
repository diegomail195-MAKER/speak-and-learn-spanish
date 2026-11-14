import { describe, expect, it } from "vitest";
import { configSchema, DEFAULT_CONFIG, parseConfig } from "./config";
import { classifyError, FeedbackEngine, linesFor } from "./engine";
import { addResult, computeLevel, EMPTY_EVIDENCE, type SkillEvidence } from "./levels";
import { MESSAGES, pregeneratedLines, renderMessage } from "./messages";
import { recommendation } from "./recommend";
import { activityTypeForTemplate, diffSegment, findConfusion, isShortForm, skillKey } from "./activity";
import { nounFor } from "./nouns";
import type { AnswerEvent } from "./types";

const engine = (over: Partial<ConstructorParameters<typeof FeedbackEngine>[0]> = {}) =>
  new FeedbackEngine({ config: DEFAULT_CONFIG, activityType: "speaking", noun: "animal", targetIsSpanish: true, rng: () => 0, ...over });

const answer = (over: Partial<AnswerEvent> = {}): AnswerEvent => ({
  itemId: "q1",
  outcome: "CORRECT",
  reason: "match",
  input: "voice",
  support: "NONE",
  incorrectSoFar: 0,
  endsQuestion: true,
  hasHint: true,
  hasImage: true,
  model: "Es un perro",
  ...over,
});

describe("Montessori feedback library", () => {
  it("has the 20 numbered situations, each with a stable id and aligned English/Spanish text", () => {
    const numbered = MESSAGES.filter((m) => m.n).map((m) => m.n);
    expect(numbered.sort((a, b) => a! - b!)).toEqual(Array.from({ length: 20 }, (_, i) => i + 1));
    const ids = MESSAGES.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const m of MESSAGES) expect(m.en.length).toBe(m.es.length);
  });

  it("adapts the content: shape, animal, color", () => {
    expect(renderMessage("success.correct", 0, { activityType: "flashcards", noun: "shape" })).toEqual({ en: "You identified the shape correctly.", es: "Identificaste la forma correctamente." });
    expect(renderMessage("success.correct", 0, { activityType: "vocabulary", noun: "animal" })).toEqual({ en: "You identified the animal correctly.", es: "Identificaste el animal correctamente." });
    expect(renderMessage("success.mastery", 0, { activityType: "vocabulary", noun: "color", total: 5 })).toEqual({ en: "You can identify all five colors on your own.", es: "Puedes identificar los cinco colores sin ayuda." });
  });

  it("uses real counts for partial results, with Spanish agreement", () => {
    expect(renderMessage("support.some_recognized", 0, { activityType: "vocabulary", noun: "word", count: 3, total: 5 })).toEqual({
      en: "You recognized three of the five words. Let's revisit the other two.",
      es: "Reconociste tres de las cinco palabras. Repasemos las otras dos.",
    });
    expect(renderMessage("support.some_recognized", 0, { activityType: "vocabulary", noun: "animal", count: 1, total: 2 }).es).toBe("Reconociste uno de los dos animales. Repasemos el otro.");
  });

  it("never uses generic praise as the default", () => {
    for (const m of MESSAGES) for (const t of [...m.en, ...m.es]) expect(t).not.toMatch(/^(good job|great job|wrong|¡muy bien!)/i);
  });

  it("admin overrides replace the text but keep the id", () => {
    const d = engine({ config: parseConfig({ messages: { "success.correct": { en: ["Nice: the {thing}."], es: ["Bien: {el_thing}."] } } }) }).onAnswer(answer());
    expect(d.id).toBe("success.correct");
    expect(d.en).toBe("Nice: the animal.");
    expect(d.es).toBe("Bien: el animal.");
  });

  it("pre-generated lines skip per-answer placeholders", () => {
    const lines = pregeneratedLines({ activityType: "speaking", noun: "animal" });
    expect(lines.some((l) => l.text === "Nombraste el animal correctamente.")).toBe(true);
    expect(lines.some((l) => l.text.includes("{") || l.text.includes("Es un perro"))).toBe(false);
  });
});

describe("Montessori decision rules (Phase 10 scenarios)", () => {
  it("1. correct answer: describes the achievement and advances", () => {
    const d = engine().onAnswer(answer());
    expect(d.id).toBe("success.correct");
    expect(d.action).toBe("advance");
    expect(d.en).toMatch(/animal/);
  });

  it("2. incorrect answer: look again, no answer shown yet", () => {
    const d = engine().onAnswer(answer({ outcome: "INCORRECT", reason: "different_answer", incorrectSoFar: 1, endsQuestion: false, hasHint: false }));
    expect(d.id).toBe("support.look_again");
    expect(d.action).toBe("retry");
    expect(d.model).toBeUndefined();
  });

  it("3. needs a hint: Scenario C, look at the picture with the hint", () => {
    const d = engine().onAnswer(answer({ outcome: "INCORRECT", reason: "different_answer", incorrectSoFar: 1, endsQuestion: false }));
    expect(d.id).toBe("speaking.look_picture");
    expect(d.action).toBe("hint");
    expect(d.es).toBe("Observemos nuevamente la imagen.");
  });

  it("3b. still wrong after the hint: another way; last try: model and move on", () => {
    const e = engine();
    expect(e.onAnswer(answer({ outcome: "INCORRECT", reason: "different_answer", incorrectSoFar: 2, endsQuestion: false, support: "HINT" })).id).toBe("support.another_way");
    const last = e.onAnswer(answer({ outcome: "INCORRECT", reason: "different_answer", incorrectSoFar: 3, endsQuestion: true, support: "HINT" }));
    expect(last.action).toBe("model_and_next");
    expect(last.model).toBe("Es un perro");
  });

  it("4. self-correction: correct after an own mistake, before any help", () => {
    const d = engine().onAnswer(answer({ incorrectSoFar: 1 }));
    expect(d.id).toBe("success.self_corrected");
    expect(d.evidence?.selfCorrected).toBe(true);
    const spell = engine({ activityType: "spelling" }).onAnswer(answer({ input: "typed", incorrectSoFar: 1 }));
    expect(spell.en).toBe("You corrected the spelling yourself.");
  });

  it("4b. not a self-correction when a hint came in between", () => {
    const d = engine().onAnswer(answer({ incorrectSoFar: 1, support: "HINT" }));
    expect(d.evidence?.selfCorrected).toBeUndefined();
  });

  it("5. completes with mistakes: says what was done, not that all was right", () => {
    const ds = engine().onComplete({
      items: [
        { id: "a", label: "perro", result: "NONE" },
        { id: "b", label: "gato", result: "HINT" },
        { id: "c", label: "pato", result: "NONE" },
        { id: "d", label: "vaca", result: null },
        { id: "e", label: "oso", result: null },
      ],
    });
    expect(ds[0].id).toBe("support.some_recognized");
    expect(ds[0].en).toBe("You recognized three of the five animals. Let's revisit the other two.");
    expect(ds[0].itemIds).toEqual(["d", "e"]);
    expect(ds.map((d) => d.id)).not.toContain("success.independent");
  });

  it("6. finishes with no help: completed + independent (once there is enough evidence)", () => {
    const ds = engine().onComplete({ items: [{ id: "a", label: "x", result: "NONE" }, { id: "b", label: "y", result: "NONE" }] });
    expect(ds.map((d) => d.id)).toEqual(["success.completed", "success.independent"]);
    const e = engine();
    const ids = [1, 2, 3].map((i) => e.onAnswer(answer({ itemId: `q${i}` })).id);
    expect(ids).toEqual(["success.correct", "success.correct", "success.independent"]);
  });

  it("7. progress since an earlier session, only when the records show it", () => {
    const withHistory = engine({ history: { q1: { level: "DEVELOPING", neededHelpBefore: true, independentDays: 0 } } });
    expect(withHistory.onAnswer(answer()).id).toBe("success.improved");
    expect(engine().onAnswer(answer()).id).toBe("success.correct");
    // Not with help today.
    expect(withHistory.onAnswer(answer({ itemId: "q1", support: "HINT" })).id).not.toBe("success.improved");
  });

  it("8. needs to repeat vocabulary: still learning this word", () => {
    const d = engine({ activityType: "flashcards" }).onAnswer(answer({ outcome: "INCORRECT", reason: "different_answer", incorrectSoFar: 3, endsQuestion: true, input: "typed", model: "perro" }));
    expect(d.id).toBe("support.still_learning");
    expect(d.en).toBe("You're still learning this word. Let's review it.");
  });

  it("9 & 10. consistent mastery: mastery message and a new challenge", () => {
    const items = ["a", "b", "c"].map((id) => ({ id, label: id, result: "NONE" as const }));
    const ds = engine().onComplete({ items, levelsAfter: { a: "PROFICIENT", b: "EXTENDING", c: "PROFICIENT" } });
    expect(ds.map((d) => d.id)).toEqual(["success.completed", "success.mastery", "challenge.ready"]);
    expect(ds[1].en).toBe("You can identify all three animals on your own.");
    // One level short: no mastery claim.
    const ds2 = engine().onComplete({ items, levelsAfter: { a: "PROFICIENT", b: "PROGRESSING", c: "PROFICIENT" } });
    expect(ds2.map((d) => d.id)).not.toContain("success.mastery");
  });

  it("11. no answer: waiting, then return to the activity; nothing graded", () => {
    const e = engine();
    expect(e.onWaiting().id).toBe("tech.waiting");
    expect(e.onInactivity().en).toBe("Let's return to the activity. Where were you?");
  });

  it("12. recognition fails: never marked incorrect", () => {
    for (const reason of ["no_speech", "low_confidence", "partial_match"]) {
      const d = engine().onAnswer(answer({ outcome: "UNCERTAIN", reason, endsQuestion: false }));
      expect(d.id).toBe("tech.not_heard");
      expect(d.evidence?.graded).toBe(false);
      expect(["silence", "recognition"]).toContain(d.evidence?.errorKind);
    }
    expect(engine().onAnswer(answer({ outcome: "UNCERTAIN", reason: "no_speech" })).es).toBe("No pude escucharte con claridad. Puedes intentarlo nuevamente.");
  });

  it("13. activity reopened: continue where you left off", () => {
    expect(engine().onResume().action).toBe("resume");
  });

  it("Scenario B: short answer counts and asks for the full sentence", () => {
    const d = engine().onAnswer(answer({ shortForm: true }));
    expect(d.id).toBe("speaking.recognized_incomplete");
    expect(d.es).toBe("Reconociste el animal. Ahora vamos a formar una oración completa.");
    expect(d.evidence?.errorKind).toBe("incomplete");
    expect(engine({ config: parseConfig({ conditions: { offerFullSentence: false } }) }).onAnswer(answer({ shortForm: true })).id).toBe("success.correct");
  });

  it("confusing two items: compare them", () => {
    const d = engine().onAnswer(answer({ outcome: "INCORRECT", reason: "different_answer", incorrectSoFar: 1, endsQuestion: false, hasHint: false, confusedWith: { label: "gato", imageUrl: null } }));
    expect(d.id).toBe("support.compare");
    expect(d.es).toBe("Comparemos estos dos animales. ¿Qué diferencias observas?");
    expect(d.evidence?.errorKind).toBe("comprehension");
  });

  it("spelling: the segment needs attention, the word is not shown", () => {
    const d = engine({ activityType: "spelling" }).onAnswer(answer({ input: "typed", outcome: "INCORRECT", reason: "spelling", incorrectSoFar: 1, endsQuestion: false, letterIndex: 7, hasHint: false }));
    expect(d.id).toBe("spelling.look_part");
    expect(diffSegment("maripossa", "mariposa")).toEqual({ start: 7, end: 8 });
  });

  it("persistence and picture strategy are only claimed with evidence", () => {
    expect(engine().onAnswer(answer({ incorrectSoFar: 2, support: "HINT" })).id).toBe("success.persisted");
    expect(engine().onAnswer(answer({ usedPicture: true, support: "MODEL" })).id).toBe("success.used_picture");
    expect(engine().onAnswer(answer({ support: "MODEL" })).id).toBe("success.correct");
    expect(engine({ activityType: "flashcards" }).onAnswer(answer({ outcome: "INCORRECT", reason: "different_answer", incorrectSoFar: 1, endsQuestion: false, pictureClue: true })).id).toBe("support.visual");
  });

  it("answered in English in a Spanish activity", () => {
    expect(engine().onAnswer(answer({ outcome: "INCORRECT", reason: "english_answer", incorrectSoFar: 1, endsQuestion: false })).en).toBe("Let's say it in Spanish.");
  });

  it("memory games: natural turns are not failures", () => {
    const items = ["a", "b"].map((id) => ({ id, label: id, result: "NONE" as const }));
    const ds = engine({ activityType: "memory" }).onComplete({ items, turns: 6 });
    expect(ds.map((d) => d.en)).toEqual(["You matched all the animals.", "You kept looking for the matching pictures."]);
  });

  it("repeated mistakes: another modality; stopped early: the first part", () => {
    const items = ["a", "b", "c", "d"].map((id, i) => ({ id, label: id, result: i === 0 ? ("NONE" as const) : null }));
    expect(engine().onComplete({ items, canAlternative: true }).map((d) => d.id)).toContain("support.different_activity");
    const early = engine().onComplete({ items: [{ id: "a", label: "a", result: "NONE" }, { id: "b", label: "b", result: undefined }, { id: "c", label: "c", result: undefined }], stoppedEarly: true });
    expect(early[0].id).toBe("support.first_part");
    expect(early[0].itemIds).toEqual(["b", "c"]);
  });

  it("varies wording without repeating the same version back to back", () => {
    let n = 0;
    const e = engine({ rng: () => (n++ % 2 ? 0.99 : 0) });
    const texts = [1, 2, 3, 4].map(() => e.message("tech.not_heard").en);
    for (let i = 1; i < texts.length; i++) expect(texts[i]).not.toBe(texts[i - 1]);
  });

  it("per-item silence for memory games, and admin switches", () => {
    expect(engine({ activityType: "memory" }).onAnswer(answer()).display).toBe("silent");
    expect(engine({ config: parseConfig({ activities: { matching: { perItem: "silent" } } }), activityType: "matching" }).onAnswer(answer()).display).toBe("silent");
    const off = engine({ config: parseConfig({ activities: { speaking: { enabled: false } } }) });
    expect(off.enabled).toBe(false);
    expect(off.onAnswer(answer()).display).toBe("silent");
    expect(engine({ config: parseConfig({ disabledMessages: ["success.correct"] }) }).onAnswer(answer()).display).toBe("silent");
  });

  it("15. language setting: English, Spanish or bilingual lines", () => {
    const d = engine().onAnswer(answer());
    expect(linesFor(d, { language: "en", spokenLanguage: "es" }).show.map((l) => l.lang)).toEqual(["en"]);
    expect(linesFor(d, { language: "es", spokenLanguage: "es" }).say.map((l) => l.lang)).toEqual(["es"]);
    expect(linesFor(d, { language: "bilingual", spokenLanguage: "activity" }, "en").say.map((l) => l.lang)).toEqual(["en"]);
    const bi = linesFor(d, { language: "bilingual", spokenLanguage: "es" });
    expect(bi.show.map((l) => l.text)).toEqual(["You named the animal correctly.", "Nombraste el animal correctamente."]);
    expect(bi.say.map((l) => l.lang)).toEqual(["es"]);
    expect(linesFor(d, { language: "bilingual", spokenLanguage: "both" }).say).toHaveLength(2);
  });

  it("16. a new game connects through the same interface", () => {
    const e = new FeedbackEngine({ config: DEFAULT_CONFIG, activityType: "number_tracing", noun: "number", rng: () => 0 });
    expect(e.onAnswer(answer({ input: "choice", hasImage: false })).en).toBe("You traced the number correctly.");
    expect(activityTypeForTemplate("SOMETHING_NEW")).toBe("teacher_created");
    expect(new FeedbackEngine({ config: DEFAULT_CONFIG, activityType: "teacher_created", noun: "word", rng: () => 0 }).onAnswer(answer()).en).toBe("You identified the word correctly.");
  });
});

describe("error kinds", () => {
  it("separates technical problems from learning errors", () => {
    expect(classifyError({ outcome: "UNCERTAIN", reason: "no_speech" })).toBe("silence");
    expect(classifyError({ outcome: "UNCERTAIN", reason: "low_confidence" })).toBe("recognition");
    expect(classifyError({ outcome: "INCORRECT", reason: "english_answer" })).toBe("language");
    expect(classifyError({ outcome: "INCORRECT", reason: "different_answer", input: "voice", score: 0.75 })).toBe("pronunciation");
    expect(classifyError({ outcome: "INCORRECT", reason: "different_answer", input: "voice", score: 0.2 })).toBe("vocabulary");
    expect(classifyError({ outcome: "INCORRECT", reason: "wrong_letter" })).toBe("spelling");
    expect(classifyError({ outcome: "CORRECT", reason: "match" })).toBeUndefined();
  });
});

describe("progress levels", () => {
  const p = DEFAULT_CONFIG.progress;
  const add = (e: SkillEvidence, result: "NONE" | "HINT" | null, day: string, context = "game:1") => addResult(e, { result, hinted: result !== "NONE", selfCorrected: false, day, context });

  it("one correct answer is never Proficient", () => {
    expect(computeLevel(add(EMPTY_EVIDENCE, "NONE", "2026-11-01"), p)).not.toBe("PROFICIENT");
    expect(computeLevel(EMPTY_EVIDENCE, p)).toBe("EXPLORING");
    expect(computeLevel(add(EMPTY_EVIDENCE, "HINT", "2026-11-01"), p)).toBe("DEVELOPING");
  });

  it("Proficient needs a run of independent answers on more than one day; Extending a second activity", () => {
    let e = EMPTY_EVIDENCE;
    for (const d of ["2026-11-01", "2026-11-01", "2026-11-01"]) e = add(e, "NONE", d);
    expect(computeLevel(e, p)).toBe("PROGRESSING"); // same day only
    e = add(e, "NONE", "2026-11-03");
    expect(computeLevel(e, p)).toBe("PROFICIENT");
    e = add(e, "NONE", "2026-11-03", "lib:9");
    expect(computeLevel(e, p)).toBe("EXTENDING");
    // A miss breaks the run.
    expect(computeLevel(add(e, null, "2026-11-04"), p)).toBe("PROGRESSING");
  });

  it("criteria are configurable", () => {
    let e = EMPTY_EVIDENCE;
    for (const d of ["2026-11-01", "2026-11-01"]) e = add(e, "NONE", d);
    expect(computeLevel(e, parseConfig({ progress: { proficientStreak: 2, proficientSessions: 1 } }).progress)).toBe("PROFICIENT");
  });
});

describe("settings", () => {
  it("falls back to defaults and keeps valid sections of a broken row", () => {
    expect(parseConfig(null)).toEqual(DEFAULT_CONFIG);
    const c = parseConfig({ language: "es", conditions: { independenceStreak: 99 }, messages: { "no.such.id": { en: ["x"] } } });
    expect(c.language).toBe("es");
    expect(c.conditions).toEqual(DEFAULT_CONFIG.conditions);
    expect(c.messages).toEqual({});
  });

  it("rejects invalid input from the admin form", () => {
    expect(configSchema.safeParse({ language: "fr" }).success).toBe(false);
    expect(configSchema.safeParse({ progress: { proficientStreak: 1 } }).success).toBe(false);
  });
});

describe("activity helpers", () => {
  it("skill keys are shared across activities and ignore case/accents/punctuation", () => {
    expect(skillKey("es-419", "¡Es un Perro!")).toBe(skillKey("es-419", "es un perro"));
    expect(skillKey("es-419", "  ")).toBeNull();
  });

  it("short answers and confusions", () => {
    expect(isShortForm({ outcome: "CORRECT", matchedAnswer: "perro" }, "Es un perro", [])).toBe(true);
    expect(isShortForm({ outcome: "CORRECT", matchedAnswer: "Es un perro" }, "Es un perro", [])).toBe(false);
    const qs = [{ id: "1", expected: "perro" }, { id: "2", expected: "gato" }];
    expect(findConfusion("gato", qs[0], qs)?.id).toBe("2");
    expect(findConfusion("caballo", qs[0], qs)).toBeNull();
  });

  it("picks the noun from the topic", () => {
    expect(nounFor({ topic: "Farm animals" })).toBe("animal");
    expect(nounFor({ title: "Los colores" })).toBe("color");
    expect(nounFor({ expected: ["Es un perro grande", "Es un gato"] })).toBe("sentence");
    expect(nounFor({})).toBe("word");
  });
});

describe("teacher recommendation", () => {
  it("uses only recorded evidence, no pronouns", () => {
    const r = recommendation("Emma", [
      { label: "círculo", level: "PROFICIENT", attempts: 6 },
      { label: "cuadrado", level: "EXTENDING", attempts: 7 },
      { label: "triángulo", level: "DEVELOPING", attempts: 3, lastActivity: "Shapes flashcards" },
      { label: "rectángulo", level: "PROGRESSING", attempts: 4 },
      { label: "óvalo", level: "EXPLORING", attempts: 0 },
    ])!;
    expect(r.en).toBe("Emma uses “círculo” and “cuadrado” independently. Emma is remembering “rectángulo” with less help. Emma would benefit from additional practice with “triángulo”.");
    expect(r.es).toBe("Emma usa «círculo» y «cuadrado» de manera independiente. Emma recuerda «rectángulo» con menos ayuda. A Emma le ayudaría practicar más «triángulo».");
    expect(r.next).toBe("Shapes flashcards");
    expect(r.en).not.toMatch(/\b(she|he|her|his)\b/i);
    expect(recommendation("Emma", [])).toBeNull();
  });
});
