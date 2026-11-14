// Montessori Intelligent Feedback Engine: verifiable rules from learning events to feedback.
//
// One engine instance lives for one activity run (browser). It never invents progress: every
// message is tied to something the activity reported (an answer, a try count, a hint, a picture
// clue) or to the student's server-side records (history). Technical problems never become
// academic errors. Variants rotate so the same sentence is not repeated back to back.
import { activitySetting, type MontessoriConfig } from "./config";
import { atLeast } from "./levels";
import { MESSAGE_BY_ID, renderMessage, usableVariants, type RenderContext } from "./messages";
import type { NounKey } from "./nouns";
import type { ActivityType, AnswerEvent, CompletionItem, ErrorKind, FeedbackDecision, ItemHistory, ProgressLevel } from "./types";

/** Error kind of an answer, from the evaluator's reason (shared by browser and server). */
export function classifyError(e: { outcome: string; reason: string; score?: number; input?: string; shortForm?: boolean; confused?: boolean }): ErrorKind | undefined {
  if (e.outcome === "CORRECT") return e.shortForm ? "incomplete" : undefined;
  switch (e.reason) {
    case "no_speech":
    case "too_quiet":
      return "silence";
    case "low_confidence":
    case "partial_match":
    case "unclear_letters":
      return "recognition";
    case "word_instead_of_letters":
    case "empty":
      return "incomplete";
    case "english_answer":
      return "language";
    case "wrong_letter":
    case "spelling":
    case "missing_accent":
    case "missing_enye":
    case "wrong_case":
    case "wrong_order":
      return "spelling";
    case "different_answer":
      if (e.confused) return "comprehension";
      // Spoken, close to the answer and clearly heard: the word is known, the sounds need work.
      if (e.input === "voice" && (e.score ?? 0) >= 0.7) return "pronunciation";
      return "vocabulary";
    default:
      return e.outcome === "UNCERTAIN" ? "recognition" : "vocabulary";
  }
}

export interface EngineOptions {
  config: MontessoriConfig;
  activityType: ActivityType;
  noun: NounKey;
  /** Records from earlier sessions, by item id. */
  history?: Record<string, ItemHistory>;
  /** Answers in a Spanish activity: "Let's say it in Spanish." */
  targetIsSpanish?: boolean;
  /** For tests. */
  rng?: () => number;
}

export class FeedbackEngine {
  private last = new Map<string, number>();
  private streak = 0;
  private independenceShown = false;
  private improvedShown = new Set<string>();
  private persisted = new Set<string>();
  readonly enabled: boolean;
  readonly perItem: "brief" | "silent";

  constructor(private o: EngineOptions) {
    const a = activitySetting(o.config, o.activityType);
    this.enabled = a.enabled;
    this.perItem = a.perItem;
  }

  get config() {
    return this.o.config;
  }

  /** Builds a decision for a message id, rotating its variants. */
  message(id: string, extra: Partial<RenderContext> & Partial<FeedbackDecision> = {}): FeedbackDecision {
    const def = MESSAGE_BY_ID[id];
    const ctx: RenderContext = { activityType: this.o.activityType, noun: this.o.noun, ...pickCtx(extra) };
    const usable = usableVariants(def, ctx, this.o.config.messages);
    const prev = this.last.get(id);
    const rnd = this.o.rng ?? Math.random;
    let v = usable[Math.floor(rnd() * usable.length) % usable.length];
    if (usable.length > 1 && v === prev) v = usable[(usable.indexOf(v) + 1) % usable.length];
    this.last.set(id, v);
    const text = renderMessage(id, v, ctx, this.o.config.messages);
    const off = !this.enabled || this.o.config.disabledMessages.includes(id);
    return {
      id,
      ...text,
      action: extra.action ?? def.action,
      tone: extra.tone ?? (def.group === "success" ? "good" : def.group === "technical" ? "unsure" : "retry"),
      display: off ? "silent" : (extra.display ?? "inline"),
      ...(extra.model ? { model: extra.model } : {}),
      ...(extra.evidence ? { evidence: extra.evidence } : {}),
      ...(extra.itemIds ? { itemIds: extra.itemIds } : {}),
      ...(extra.compareWith ? { compareWith: extra.compareWith } : {}),
    };
  }

  /** Feedback for one answer. */
  onAnswer(a: AnswerEvent): FeedbackDecision {
    const errorKind = classifyError({ outcome: a.outcome, reason: a.reason, score: a.score, input: a.input, shortForm: a.shortForm, confused: !!a.confusedWith });

    if (a.outcome === "UNCERTAIN") {
      // Silence, noise, low confidence: never graded.
      const id = a.reason === "word_instead_of_letters" ? "spelling.letter_by_letter" : "tech.not_heard";
      return this.message(id, { tone: "unsure", evidence: { errorKind, graded: false } });
    }

    if (a.outcome === "CORRECT") {
      const independent = a.support === "NONE";
      this.streak = independent ? this.streak + 1 : 0;
      const ev = { graded: true, ...(errorKind ? { errorKind } : {}) };
      if (a.shortForm && this.o.config.conditions.offerFullSentence && a.model) {
        return this.message("speaking.recognized_incomplete", { model: a.model, evidence: ev, display: "inline" });
      }
      // Self-correction: a mistake on this item, then right, with no hint or model in between.
      if (a.incorrectSoFar > 0 && independent) {
        return this.message(a.input === "typed" && this.o.activityType === "spelling" ? "spelling.self_corrected" : "success.self_corrected", { evidence: { ...ev, selfCorrected: true } });
      }
      const h = this.o.history?.[a.itemId];
      if (independent && h?.neededHelpBefore && !this.improvedShown.has(a.itemId)) {
        this.improvedShown.add(a.itemId);
        return this.message("success.improved", { evidence: ev });
      }
      if (a.usedPicture) return this.message("success.used_picture", { evidence: ev });
      if (a.incorrectSoFar >= this.o.config.conditions.persistenceTries && !this.persisted.has(a.itemId)) {
        this.persisted.add(a.itemId);
        return this.message("success.persisted", { evidence: ev });
      }
      if (independent && !this.independenceShown && this.streak >= this.o.config.conditions.independenceStreak) {
        this.independenceShown = true;
        return this.message("success.independent", { evidence: ev });
      }
      return this.message("success.correct", { model: a.model, evidence: ev, display: this.perItem === "silent" ? "silent" : "inline" });
    }

    // INCORRECT
    this.streak = 0;
    const ev = { graded: true, errorKind };
    if (a.endsQuestion) {
      // Last allowed try: present the model and move on (no endless chains of tries).
      const id = a.input === "voice" && a.hasImage ? "speaking.model" : "support.still_learning";
      return this.message(id, { model: a.model, evidence: ev, tone: "info" });
    }
    if (a.reason === "english_answer" && this.o.targetIsSpanish) return this.message("speaking.say_in_target", { evidence: ev });
    if (a.incorrectSoFar <= 1) {
      if (a.pictureClue && !a.usedPicture) return this.message("support.visual", { evidence: ev });
      if (a.input === "typed" && a.letterIndex != null && a.letterIndex >= 0) return this.message("spelling.look_part", { evidence: ev });
      // The teacher's hint comes first (Scenario C: "Es un gato" for a dog → look at the picture again).
      if (a.hasHint) return this.message(a.input === "voice" && a.hasImage ? "speaking.look_picture" : "support.look_again", { action: "hint", evidence: ev });
      if (a.confusedWith) return this.message("support.compare", { compareWith: a.confusedWith, evidence: ev });
      return this.message("support.look_again", { action: "retry", evidence: ev });
    }
    if (a.confusedWith && a.support === "NONE") return this.message("support.compare", { compareWith: a.confusedWith, evidence: ev });
    // Missed again: if a hint was already given, present it another way; otherwise the model.
    if (a.support === "HINT") return this.message("support.another_way", { model: a.model, evidence: ev });
    if (a.hasHint && a.support === "NONE") return this.message("support.look_again", { action: "hint", evidence: ev });
    return this.message("support.listen_model", { model: a.model, evidence: ev });
  }

  /** No answer twice in a row while the microphone is fine. */
  onInactivity(): FeedbackDecision {
    return this.message("focus.return", { tone: "info" });
  }

  onWaiting(): FeedbackDecision {
    return this.message("tech.waiting", { tone: "info" });
  }

  onTechnical(): FeedbackDecision {
    return this.message("tech.mic", { tone: "unsure", evidence: { errorKind: "device", graded: false } });
  }

  onResume(): FeedbackDecision {
    return this.message("session.resumed", { tone: "info" });
  }

  /**
   * Messages for the end of an activity (shown at a natural pause, at most two). `levelsAfter`
   * are the levels each item will have with today's answers (server records + this session).
   */
  onComplete(opts: { items: CompletionItem[]; stoppedEarly?: boolean; levelsAfter?: Record<string, ProgressLevel>; turns?: number; canAlternative?: boolean }): FeedbackDecision[] {
    const reached = opts.items.filter((i) => i.result !== undefined);
    const correct = reached.filter((i) => i.result !== null && i.result !== undefined);
    const missed = reached.filter((i) => i.result === null);
    const notReached = opts.items.filter((i) => i.result === undefined);
    const total = opts.items.length;
    const out: FeedbackDecision[] = [];
    const gp = this.o.config.guidedPractice;
    const pause = { display: "pause" as const };

    if (opts.stoppedEarly && notReached.length) {
      const first = [...missed, ...notReached].slice(0, gp.firstPartSize).map((i) => i.id);
      out.push(this.message("support.first_part", { ...pause, itemIds: first, tone: "info" }));
      return out;
    }

    if (this.o.activityType === "memory") {
      out.push(this.message("memory.all_matched", { ...pause, tone: "good" }));
      if ((opts.turns ?? 0) > total) out.push(this.message("memory.kept_looking", { ...pause, tone: "good" }));
      return out;
    }

    if (missed.length === 0) {
      out.push(this.message("success.completed", { ...pause, tone: "good" }));
      const allIndependent = correct.length >= 2 && correct.every((i) => i.result === "NONE");
      const ch = this.o.config.challenge;
      const mastered = allIndependent && !!opts.levelsAfter && correct.every((i) => atLeast(opts.levelsAfter![i.id] ?? "EXPLORING", ch.minLevel));
      if (mastered) {
        out.push(this.message("success.mastery", { ...pause, total: correct.length, tone: "good" }));
        if (ch.enabled) out.push(this.message("challenge.ready", { ...pause, tone: "good" }));
      } else if (allIndependent) out.push(this.message("success.independent", { ...pause, tone: "good" }));
      return out.slice(0, 3);
    }

    // Completed with mistakes: say what was done, never that everything was right.
    const ids = missed.map((i) => i.id);
    if (correct.length > 0) out.push(this.message("support.some_recognized", { ...pause, count: correct.length, total: reached.length, itemIds: gp.offerPracticeMissed ? ids : undefined, action: gp.offerPracticeMissed ? "practice_missed" : "none" }));
    else out.push(this.message("success.completed", { ...pause, tone: "info" }));
    if (missed.length >= this.o.config.conditions.repeatedErrorItems && gp.offerAlternative && opts.canAlternative) {
      out.push(this.message("support.different_activity", { ...pause, itemIds: ids }));
    } else if (correct.length === 0 && gp.offerPracticeMissed) {
      out.push(this.message("support.practice_together", { ...pause, itemIds: ids }));
    }
    return out;
  }
}

function pickCtx(x: Partial<RenderContext>): Partial<RenderContext> {
  const out: Partial<RenderContext> = {};
  if (x.model !== undefined) out.model = x.model;
  if (x.labelEn !== undefined) out.labelEn = x.labelEn;
  if (x.count !== undefined) out.count = x.count;
  if (x.total !== undefined) out.total = x.total;
  return out;
}

/** The text(s) to show and to say for a decision, in the configured language mode. */
export function linesFor(d: Pick<FeedbackDecision, "en" | "es">, c: Pick<MontessoriConfig, "language" | "spokenLanguage">, activityLang: "en" | "es" = "es") {
  const show = c.language === "en" ? [{ lang: "en" as const, text: d.en }] : c.language === "es" ? [{ lang: "es" as const, text: d.es }] : [{ lang: "en" as const, text: d.en }, { lang: "es" as const, text: d.es }];
  const sayLangs = c.language === "bilingual" ? (c.spokenLanguage === "both" ? ["en", "es"] : [c.spokenLanguage === "activity" ? activityLang : c.spokenLanguage]) : [c.language];
  const say = show.filter((l) => sayLangs.includes(l.lang));
  return { show, say };
}
