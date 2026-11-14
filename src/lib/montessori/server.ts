import "server-only";
import type { ProgressLevel as DbLevel } from "@prisma/client";
import { assignmentsForStudentWhere } from "@/lib/access";
import { questionResult } from "@/lib/attempts/outcome";
import { HttpError } from "@/lib/http-error";
import { db } from "@/lib/db";
import { SPELL_TOKENS } from "@/lib/games/types";
import { plainText } from "@/lib/text/segments";
import { activityTypeForTemplate, skillKey } from "./activity";
import { DEFAULT_CONFIG, parseConfig, type MontessoriConfig } from "./config";
import { EMPTY_EVIDENCE, addResult, computeLevel, type SkillEvidence } from "./levels";
import { nounFor } from "./nouns";
import type { MontessoriSetup } from "./setup";
import type { ItemHistory, ProgressLevel, Support } from "./types";

// Server side of the Montessori engine: settings, evidence recording and the teacher view.
// Every function that reads student data takes the teacher id and checks class ownership.

const SETTINGS_ID = "platform";

/** Settings → Montessori Feedback. Falls back to defaults if the row (or the table) is missing. */
export async function getMontessoriConfig(): Promise<MontessoriConfig> {
  try {
    const row = await db.montessoriSettings.findUnique({ where: { id: SETTINGS_ID } });
    return parseConfig(row?.config);
  } catch (e) {
    console.error("montessori settings unavailable, using defaults", (e as Error).message);
    return DEFAULT_CONFIG;
  }
}

export async function saveMontessoriConfig(config: MontessoriConfig, userId: string) {
  const clean = parseConfig(config);
  await db.montessoriSettings.upsert({
    where: { id: SETTINGS_ID },
    create: { id: SETTINGS_ID, config: clean, updatedById: userId },
    update: { config: clean, updatedById: userId },
  });
  return clean;
}

const today = () => new Date().toISOString().slice(0, 10);

const evidenceOf = (r: { attempts: number; correct: number; independentCorrect: number; missed: number; hintsUsed: number; selfCorrections: number; streak: number; independentDays: string[]; contexts: string[] }): SkillEvidence => ({
  attempts: r.attempts,
  correct: r.correct,
  independentCorrect: r.independentCorrect,
  missed: r.missed,
  hintsUsed: r.hintsUsed,
  selfCorrections: r.selfCorrections,
  streak: r.streak,
  independentDays: r.independentDays,
  contexts: r.contexts,
});

export interface ClosedItem {
  key: string;
  label: string;
  result: Support | null;
  hinted: boolean;
  selfCorrected: boolean;
}

/** Adds closed items to the student's skill records (one upsert per skill). */
export async function recordSkills(studentId: string, items: ClosedItem[], ctx: { topic: string; activity: string; contextId: string }, config?: MontessoriConfig) {
  const cfg = config ?? (await getMontessoriConfig());
  const day = today();
  for (const it of items) {
    const existing = await db.skillProgress.findUnique({ where: { studentId_skillKey: { studentId, skillKey: it.key } } });
    const ev = addResult(existing ? evidenceOf(existing) : EMPTY_EVIDENCE, { result: it.result, hinted: it.hinted, selfCorrected: it.selfCorrected, day, context: ctx.contextId });
    const level = computeLevel(ev, cfg.progress) as DbLevel;
    const neededHelp = it.result !== "NONE";
    const data = { ...ev, level, label: it.label.slice(0, 120), topic: ctx.topic.slice(0, 80), lastActivity: ctx.activity.slice(0, 120), lastPracticedAt: new Date(), ...(neededHelp ? { lastNeededHelpAt: new Date() } : {}) };
    if (existing) await db.skillProgress.update({ where: { id: existing.id }, data });
    else await db.skillProgress.create({ data: { studentId, skillKey: it.key, ...data } });
  }
}

/** After a voice activity attempt is finished: one closed item per question it touched. */
export async function recordAttemptSkills(attemptId: string, studentId: string) {
  const attempt = await db.studentAttempt.findFirst({
    where: { id: attemptId, studentId },
    include: {
      game: { select: { id: true, title: true, topic: true, language: true } },
      responses: { orderBy: { createdAt: "asc" }, include: { question: { select: { id: true, expectedAnswer: true, answerLanguage: true, item: { select: { text: true } } } } } },
    },
  });
  if (!attempt) return;
  const byQ = new Map<string, typeof attempt.responses>();
  for (const r of attempt.responses) byQ.set(r.questionId, [...(byQ.get(r.questionId) ?? []), r]);
  const items: ClosedItem[] = [];
  for (const rs of byQ.values()) {
    const q = rs[0].question;
    // A student's own name is personal data, never a skill.
    if (q.expectedAnswer === SPELL_TOKENS.firstName || q.expectedAnswer === SPELL_TOKENS.lastName) continue;
    const result = questionResult(rs);
    if (result === undefined) continue; // not finished in this attempt
    const key = skillKey(q.answerLanguage ?? attempt.game.language, q.expectedAnswer);
    if (!key) continue;
    items.push({ key, label: plainText(q.item.text || q.expectedAnswer), result, hinted: rs.some((r) => r.support !== "NONE"), selfCorrected: rs.some((r) => r.selfCorrected) });
  }
  await recordSkills(studentId, items, { topic: attempt.game.topic || attempt.game.title, activity: attempt.game.title, contextId: `game:${attempt.game.id}` });
}

/** Earlier-session records for the items of an activity (for "Last time you needed a clue…"). */
export async function historyFor(studentId: string, items: Array<{ id: string; key: string | null }>): Promise<Record<string, ItemHistory & { evidence: SkillEvidence; teacherLevel: ProgressLevel | null }>> {
  const keys = [...new Set(items.map((i) => i.key).filter((k): k is string => !!k))];
  if (!keys.length) return {};
  let rows: Awaited<ReturnType<typeof db.skillProgress.findMany>> = [];
  try {
    rows = await db.skillProgress.findMany({ where: { studentId, skillKey: { in: keys } } });
  } catch (e) {
    console.error("skill history unavailable", (e as Error).message);
    return {};
  }
  const d = today();
  const out: Record<string, ItemHistory & { evidence: SkillEvidence; teacherLevel: ProgressLevel | null }> = {};
  for (const it of items) {
    const r = rows.find((x) => x.skillKey === it.key);
    if (!r) continue;
    const helpDay = r.lastNeededHelpAt?.toISOString().slice(0, 10);
    // Help on an earlier day, and no independent answer on a later day before today.
    const neededHelpBefore = !!helpDay && helpDay < d && !r.independentDays.some((x) => x > helpDay && x < d);
    out[it.id] = { level: (r.teacherLevel ?? r.level) as ProgressLevel, neededHelpBefore, independentDays: r.independentDays.length, evidence: evidenceOf(r), teacherLevel: r.teacherLevel as ProgressLevel | null };
  }
  return out;
}

// ---------------- Teacher view ----------------

export async function teacherClasses(teacherId: string) {
  return db.classroom.findMany({
    where: { teacherId },
    orderBy: { name: "asc" },
    select: { id: true, name: true, levels: { orderBy: { sortOrder: "asc" }, select: { id: true, name: true, groups: { orderBy: { name: "asc" }, select: { id: true, name: true } } } } },
  });
}

/** Students (of the teacher's own classes) with their skill records, filtered by class/group/topic. */
export async function progressOverview(teacherId: string, f: { classroomId?: string; groupId?: string; topic?: string }) {
  const students = await db.student.findMany({
    where: {
      classroom: { teacherId },
      active: true,
      ...(f.classroomId ? { classroomId: f.classroomId } : {}),
      ...(f.groupId ? { memberships: { some: { groupId: f.groupId, group: { level: { classroom: { teacherId } } } } } } : {}),
    },
    orderBy: [{ firstName: "asc" }, { lastInitial: "asc" }],
    select: {
      id: true,
      firstName: true,
      lastInitial: true,
      classroom: { select: { name: true } },
      memberships: { select: { group: { select: { name: true, level: { select: { name: true } } } } } },
      skillProgress: { where: f.topic ? { topic: f.topic } : {}, orderBy: [{ topic: "asc" }, { label: "asc" }] },
    },
  });
  const topics = await db.skillProgress.findMany({ where: { student: { classroom: { teacherId } } }, distinct: ["topic"], select: { topic: true }, orderBy: { topic: "asc" } });
  return { students, topics: topics.map((t) => t.topic).filter(Boolean) };
}

export async function studentProgress(teacherId: string, studentId: string) {
  const s = await db.student.findFirst({
    where: { id: studentId, classroom: { teacherId } },
    select: {
      id: true,
      firstName: true,
      lastInitial: true,
      classroom: { select: { id: true, name: true } },
      memberships: { select: { group: { select: { name: true, level: { select: { name: true } } } } } },
      skillProgress: { orderBy: [{ topic: "asc" }, { label: "asc" }] },
    },
  });
  if (!s) throw new HttpError(404, "Student not found");
  return s;
}

/** A teacher sets (or clears, with null) the level of one skill and/or writes an observation. */
export async function setTeacherLevel(teacherId: string, userId: string, skillId: string, input: { level: ProgressLevel | null; note: string }) {
  const row = await db.skillProgress.findFirst({ where: { id: skillId, student: { classroom: { teacherId } } } });
  if (!row) throw new HttpError(404, "Record not found");
  return db.skillProgress.update({
    where: { id: row.id },
    data: { teacherLevel: input.level as DbLevel | null, teacherNote: input.note.slice(0, 1000), teacherUpdatedAt: new Date(), teacherUpdatedById: userId },
  });
}

/** Engine setup for a voice activity (student: with history; preview: without). */
export async function montessoriSetup(game: { templateKey: string; title: string; language: string; options: Record<string, unknown>; questions: Array<{ id: string; expected: string; answerLanguage: string }> }, opts: { topic?: string; studentId?: string | null }): Promise<MontessoriSetup> {
  const config = await getMontessoriConfig();
  const activityType = activityTypeForTemplate(game.templateKey, game.options);
  const noun = nounFor({ topic: opts.topic, title: game.title, activityType, expected: game.questions.map((q) => plainText(q.expected)) });
  const history = opts.studentId && game.templateKey !== "SPELL_YOUR_NAME" ? await historyFor(opts.studentId, game.questions.map((q) => ({ id: q.id, key: skillKey(q.answerLanguage, q.expected) }))) : {};
  return { config, activityType, noun, history };
}

/** The student's next unfinished assignment (for "You're ready for a new challenge"). */
export async function nextActivityHref(student: { id: string; classroomId: string; schoolId: string }, excludeAssignmentId: string): Promise<string | null> {
  const list = await db.assignment.findMany({
    where: { ...assignmentsForStudentWhere(student), id: { not: excludeAssignmentId }, OR: [{ gameId: { not: null } }, { topicId: { not: null } }], AND: [{ OR: [{ dueAt: null }, { dueAt: { gte: new Date() } }] }] },
    orderBy: [{ dueAt: "asc" }, { createdAt: "desc" }],
    select: { id: true, gameId: true, topicId: true, attempts: { where: { studentId: student.id, completedAt: { not: null } }, select: { id: true }, take: 1 }, activities: { select: { progress: { where: { studentId: student.id, completedAt: { not: null } }, select: { id: true }, take: 1 } } } },
    take: 30,
  });
  for (const a of list) {
    if (a.gameId && a.attempts.length === 0) return `/play/${a.id}`;
    if (a.topicId && a.activities.some((x) => x.progress.length === 0)) return `/learn/tasks/${a.id}`;
  }
  return null;
}
