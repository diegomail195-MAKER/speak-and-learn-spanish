import "server-only";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

/** All active students an assignment reaches, through any recipient type. */
export async function assignmentStudents(assignmentId: string) {
  const recips = await db.assignmentRecipient.findMany({ where: { assignmentId } });
  const or = recips.flatMap((r): Prisma.StudentWhereInput[] => {
    if (r.type === "STUDENT" && r.studentId) return [{ id: r.studentId }];
    if (r.type === "CLASSROOM" && r.classroomId) return [{ classroomId: r.classroomId }];
    if (r.type === "GROUP" && r.groupId) return [{ memberships: { some: { groupId: r.groupId } } }];
    if (r.type === "LEVEL" && r.levelId) return [{ memberships: { some: { group: { levelId: r.levelId } } } }];
    return [];
  });
  if (!or.length) return [];
  return db.student.findMany({ where: { OR: or, active: true }, orderBy: { firstName: "asc" } });
}

export type StudentRow = {
  studentId: string;
  name: string;
  status: "not_started" | "in_progress" | "completed";
  attempts: number;
  lastAt: Date | null;
  presented: number | null;
  independent: number | null;
  guided: number | null;
  needsPractice: number | null;
  uncertain: number | null;
  hints: number | null;
  durationMs: number | null;
};

export async function assignmentReport(assignmentId: string) {
  const a = await db.assignment.findUniqueOrThrow({
    where: { id: assignmentId },
    include: { game: { include: { items: { orderBy: { position: "asc" }, include: { questions: true } } } }, recipients: { include: { classroom: true, level: true, group: { include: { level: true } }, student: true } } },
  });
  const students = await assignmentStudents(assignmentId);
  const attempts = await db.studentAttempt.findMany({
    where: { assignmentId, studentId: { in: students.map((s) => s.id) } },
    include: { responses: { orderBy: { createdAt: "asc" } } },
    orderBy: { startedAt: "desc" },
  });
  const questions = a.game?.items.flatMap((it) => it.questions) ?? [];

  const rows: StudentRow[] = students.map((s) => {
    const mine = attempts.filter((t) => t.studentId === s.id);
    const latestDone = mine.find((t) => t.completedAt);
    const latest = latestDone ?? mine[0];
    const per = (status: "INDEPENDENT" | "GUIDED" | "NEEDS_PRACTICE") => {
      if (!latest) return null;
      const byQ = new Map<string, typeof latest.responses>();
      latest.responses.forEach((r) => byQ.set(r.questionId, [...(byQ.get(r.questionId) ?? []), r]));
      let n = 0;
      byQ.forEach((rs) => {
        const c = rs.find((r) => r.outcome === "CORRECT");
        const st = c ? (c.support === "NONE" ? "INDEPENDENT" : "GUIDED") : rs.some((r) => r.endsQuestion) ? "NEEDS_PRACTICE" : null;
        if (st === status) n++;
      });
      return n;
    };
    return {
      studentId: s.id,
      name: `${s.firstName} ${s.lastInitial ? s.lastInitial + "." : ""}`.trim(),
      status: latestDone ? "completed" : mine.length ? "in_progress" : "not_started",
      attempts: mine.length,
      lastAt: latest ? latest.completedAt ?? latest.responses.at(-1)?.createdAt ?? latest.startedAt : null,
      presented: latest ? new Set(latest.responses.map((r) => r.questionId)).size : null,
      independent: per("INDEPENDENT"),
      guided: per("GUIDED"),
      needsPractice: per("NEEDS_PRACTICE"),
      uncertain: latest ? latest.responses.filter((r) => r.outcome === "UNCERTAIN").length : null,
      hints: latest ? new Set(latest.responses.filter((r) => r.support !== "NONE").map((r) => r.questionId)).size : null,
      durationMs: latest?.durationMs ?? null,
    };
  });

  // Per-question view across the latest attempt of every student.
  const latestIds = new Set(rows.map((r) => attempts.find((t) => t.studentId === r.studentId && t.completedAt)?.id ?? attempts.find((t) => t.studentId === r.studentId)?.id).filter(Boolean));
  const latestResponses = attempts.filter((t) => latestIds.has(t.id)).flatMap((t) => t.responses);
  const questionStats = questions.map((q) => {
    const rs = latestResponses.filter((r) => r.questionId === q.id);
    const byAttempt = new Map<string, typeof rs>();
    rs.forEach((r) => byAttempt.set(r.attemptId, [...(byAttempt.get(r.attemptId) ?? []), r]));
    let independent = 0, guided = 0, practice = 0;
    byAttempt.forEach((x) => {
      const c = x.find((r) => r.outcome === "CORRECT");
      if (c && c.support === "NONE") independent++;
      else if (c) guided++;
      else if (x.some((r) => r.endsQuestion)) practice++;
    });
    return { id: q.id, prompt: q.prompt || q.expectedAnswer, expected: q.expectedAnswer, answered: byAttempt.size, independent, guided, practice, responses: rs };
  });
  return { assignment: a, rows, questionStats, attempts };
}

export const pct = (n: number | null, d: number | null) => (n == null || !d ? null : Math.round((n / d) * 100));

export type VideoCell = {
  watchedPct: number | null; // null = no progress saved yet
  completed: boolean;
  practice: { independent: number; presented: number; completed: boolean } | null;
};

/** Watching and Watch & Practice results for a video or collection assignment. */
export async function videoAssignmentReport(assignmentId: string) {
  const a = await db.assignment.findUniqueOrThrow({
    where: { id: assignmentId },
    include: {
      video: { include: { practiceGame: { select: { id: true, title: true } } } },
      collection: { include: { videos: { orderBy: { position: "asc" }, include: { video: { include: { practiceGame: { select: { id: true, title: true } } } } } } } },
    },
  });
  const videos = a.video ? [a.video] : (a.collection?.videos.map((cv) => cv.video) ?? []);
  const students = await assignmentStudents(assignmentId);
  const sIds = students.map((s) => s.id);
  const [progress, attempts] = await Promise.all([
    db.videoProgress.findMany({ where: { studentId: { in: sIds }, videoId: { in: videos.map((v) => v.id) } } }),
    db.studentAttempt.findMany({ where: { assignmentId, studentId: { in: sIds } }, orderBy: { startedAt: "desc" } }),
  ]);
  const rows = students.map((s) => ({
    studentId: s.id,
    name: `${s.firstName} ${s.lastInitial ? s.lastInitial + "." : ""}`.trim(),
    cells: videos.map((v): VideoCell => {
      const p = progress.find((x) => x.studentId === s.id && x.videoId === v.id);
      const dur = p?.durationSec ?? v.durationSec;
      const mine = v.practiceGameId ? attempts.filter((t) => t.studentId === s.id && t.gameId === v.practiceGameId) : [];
      const t = mine.find((x) => x.completedAt) ?? mine[0];
      return {
        watchedPct: p ? (dur ? Math.min(100, Math.round((p.watchedSec / dur) * 100)) : 0) : null,
        completed: p?.completed ?? false,
        practice: t ? { independent: t.independentCount, presented: t.questionsPresented, completed: !!t.completedAt } : null,
      };
    }),
  }));
  return { assignment: a, videos, rows };
}
