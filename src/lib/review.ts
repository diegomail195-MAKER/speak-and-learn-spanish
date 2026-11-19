import { Prisma } from "@prisma/client";
import { assignmentsForTeacherWhere, classroomAccessWhere } from "@/lib/access";
import { db } from "@/lib/db";
import { speakingResult, type SpeakingResult } from "@/lib/library/types";

// Teacher review of speaking work. Two sources:
// - attempts at speaking activities (StudentAttempt + StudentResponse, one row per try);
// - Speaking library steps of topic assignments (ActivityProgress.details, one entry per prompt).
// Work enters the queue when the recognizer was unsure about at least one answer (or the student
// typed it). The teacher decides those answers, can add a note, and marks it reviewed.
// Scope: the teacher's assignments (own or reaching a class they teach) and students of classes
// they own or co-teach.

export type ReviewKey = `a:${string}` | `p:${string}`;

const attemptWhere = (teacherId: string, reviewed: boolean): Prisma.StudentAttemptWhereInput => ({
  completedAt: { not: null },
  reviewedAt: reviewed ? { not: null } : null,
  uncertainCount: reviewed ? undefined : { gt: 0 },
  assignment: assignmentsForTeacherWhere(teacherId),
  student: { classroom: classroomAccessWhere(teacherId) },
});

const progressWhere = (teacherId: string, reviewed: boolean): Prisma.ActivityProgressWhereInput => ({
  completedAt: { not: null },
  reviewedAt: reviewed ? { not: null } : null,
  details: reviewed ? { not: Prisma.DbNull } : { array_contains: [{ outcome: "UNCERTAIN" }] },
  activity: { assignment: assignmentsForTeacherWhere(teacherId) },
  student: { classroom: classroomAccessWhere(teacherId) },
});

export async function pendingReviewCount(teacherId: string) {
  const [a, p] = await Promise.all([db.studentAttempt.count({ where: attemptWhere(teacherId, false) }), db.activityProgress.count({ where: progressWhere(teacherId, false) })]);
  return a + p;
}

export type ReviewRow = {
  key: ReviewKey;
  student: string;
  className: string;
  assignment: string;
  activity: string;
  completedAt: Date;
  unsure: number;
  total: number;
  reviewedAt: Date | null;
  href: string;
};

const studentSel = { firstName: true, lastInitial: true, classroom: { select: { name: true } } } as const;
const nameOf = (s: { firstName: string; lastInitial: string }) => `${s.firstName}${s.lastInitial ? ` ${s.lastInitial}.` : ""}`;

export const parseDetails = (raw: unknown): SpeakingResult[] => {
  const r = speakingResult.array().safeParse(raw);
  return r.success ? r.data : [];
};
const effective = (r: SpeakingResult) => r.teacher ?? r.outcome;

export async function reviewQueue(teacherId: string, { reviewed = false, take = 50 }: { reviewed?: boolean; take?: number } = {}): Promise<ReviewRow[]> {
  const [attempts, progress] = await Promise.all([
    db.studentAttempt.findMany({
      where: attemptWhere(teacherId, reviewed),
      orderBy: reviewed ? { reviewedAt: "desc" } : { completedAt: "asc" },
      take,
      select: { id: true, completedAt: true, reviewedAt: true, uncertainCount: true, questionsPresented: true, student: { select: studentSel }, game: { select: { title: true } }, assignment: { select: { title: true, game: { select: { title: true } } } } },
    }),
    db.activityProgress.findMany({
      where: progressWhere(teacherId, reviewed),
      orderBy: reviewed ? { reviewedAt: "desc" } : { completedAt: "asc" },
      take,
      select: { id: true, completedAt: true, reviewedAt: true, details: true, student: { select: studentSel }, activity: { select: { version: { select: { title: true } }, assignment: { select: { title: true } } } } },
    }),
  ]);
  const rows: ReviewRow[] = [
    ...attempts.map((a) => ({
      key: `a:${a.id}` as ReviewKey,
      student: nameOf(a.student),
      className: a.student.classroom.name,
      assignment: a.assignment?.title || a.assignment?.game?.title || a.game.title,
      activity: a.game.title || "Speaking activity",
      completedAt: a.completedAt!,
      unsure: a.uncertainCount,
      total: a.questionsPresented,
      reviewedAt: a.reviewedAt,
      href: `/teacher/review/a:${a.id}`,
    })),
    ...progress.map((p) => {
      const d = parseDetails(p.details);
      return {
        key: `p:${p.id}` as ReviewKey,
        student: nameOf(p.student),
        className: p.student.classroom.name,
        assignment: p.activity.assignment.title,
        activity: p.activity.version?.title ?? "Speaking",
        completedAt: p.completedAt!,
        unsure: d.filter((r) => r.outcome === "UNCERTAIN" && !r.teacher).length,
        total: d.length,
        reviewedAt: p.reviewedAt,
        href: `/teacher/review/p:${p.id}`,
      };
    }),
  ];
  return rows.sort((x, y) => (reviewed ? +(y.reviewedAt ?? 0) - +(x.reviewedAt ?? 0) : +x.completedAt - +y.completedAt)).slice(0, take);
}

export type ReviewAnswer = { id: string; expected: string; prompt: string; transcript: string; outcome: "CORRECT" | "INCORRECT" | "UNCERTAIN"; teacher: "CORRECT" | "INCORRECT" | null; tries: number };
export type ReviewDetail = Omit<ReviewRow, "href"> & { answers: ReviewAnswer[]; note: string };

/** One piece of work, or null when it isn't in this teacher's scope. */
export async function reviewDetail(teacherId: string, key: string): Promise<ReviewDetail | null> {
  const [src, id] = [key.slice(0, 2), key.slice(2)];
  if (!id) return null;
  if (src === "a:") {
    const a = await db.studentAttempt.findFirst({
      where: { id, completedAt: { not: null }, assignment: assignmentsForTeacherWhere(teacherId), student: { classroom: classroomAccessWhere(teacherId) } },
      select: {
        id: true, completedAt: true, reviewedAt: true, reviewNote: true, uncertainCount: true, questionsPresented: true,
        student: { select: studentSel }, game: { select: { title: true } }, assignment: { select: { title: true } },
        responses: { orderBy: [{ createdAt: "asc" }], select: { id: true, tryNumber: true, outcome: true, transcript: true, endsQuestion: true, teacherOutcome: true, question: { select: { id: true, prompt: true, expectedAnswer: true } } } },
      },
    });
    if (!a) return null;
    // One row per question: its closing response (or the last try when none closed it).
    const byQ = new Map<string, typeof a.responses>();
    for (const r of a.responses) byQ.set(r.question.id, [...(byQ.get(r.question.id) ?? []), r]);
    const answers: ReviewAnswer[] = [...byQ.values()].map((rs) => {
      const last = rs.find((r) => r.endsQuestion) ?? rs[rs.length - 1];
      return { id: last.id, expected: last.question.expectedAnswer, prompt: last.question.prompt, transcript: last.transcript, outcome: last.outcome, teacher: last.teacherOutcome === "CORRECT" || last.teacherOutcome === "INCORRECT" ? last.teacherOutcome : null, tries: rs.length };
    });
    return { key: `a:${a.id}`, student: nameOf(a.student), className: a.student.classroom.name, assignment: a.assignment?.title || a.game.title, activity: a.game.title, completedAt: a.completedAt!, unsure: a.uncertainCount, total: answers.length, reviewedAt: a.reviewedAt, answers, note: a.reviewNote };
  }
  if (src === "p:") {
    const p = await db.activityProgress.findFirst({
      where: { id, completedAt: { not: null }, details: { not: Prisma.DbNull }, activity: { assignment: assignmentsForTeacherWhere(teacherId) }, student: { classroom: classroomAccessWhere(teacherId) } },
      select: { id: true, completedAt: true, reviewedAt: true, reviewNote: true, details: true, student: { select: studentSel }, activity: { select: { version: { select: { title: true } }, assignment: { select: { title: true } } } } },
    });
    if (!p) return null;
    const d = parseDetails(p.details);
    const answers: ReviewAnswer[] = d.map((r, i) => ({ id: String(i), expected: r.say, prompt: "", transcript: r.transcript, outcome: r.outcome, teacher: r.teacher ?? null, tries: r.tries }));
    return { key: `p:${p.id}`, student: nameOf(p.student), className: p.student.classroom.name, assignment: p.activity.assignment.title, activity: p.activity.version?.title ?? "Speaking", completedAt: p.completedAt!, unsure: d.filter((r) => r.outcome === "UNCERTAIN" && !r.teacher).length, total: d.length, reviewedAt: p.reviewedAt, answers, note: p.reviewNote };
  }
  return null;
}

/** Score of Speaking details once the teacher's decisions apply. */
export const speakingScore = (d: SpeakingResult[]) => d.filter((r) => effective(r) === "CORRECT").length;
