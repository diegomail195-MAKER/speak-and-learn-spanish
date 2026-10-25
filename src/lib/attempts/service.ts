import "server-only";
import type { MasteryStatus } from "@prisma/client";
import { HttpError } from "@/lib/auth/guards";
import { db } from "@/lib/db";

/** Recomputes an attempt's counters and the student's mastery for each question it touched. */
export async function finalizeAttempt(attemptId: string, studentId: string, extra?: { durationMs?: number; presented?: number }) {
  const attempt = await db.studentAttempt.findFirst({ where: { id: attemptId, studentId }, include: { responses: { orderBy: { createdAt: "asc" } } } });
  if (!attempt) throw new HttpError(404, "Attempt not found");

  const byQuestion = new Map<string, typeof attempt.responses>();
  for (const r of attempt.responses) byQuestion.set(r.questionId, [...(byQuestion.get(r.questionId) ?? []), r]);

  let independent = 0;
  for (const [questionId, rs] of byQuestion) {
    const correct = rs.find((r) => r.outcome === "CORRECT");
    // Independent mastery only if correct with no hint or model before it.
    const status: MasteryStatus = correct ? (correct.support === "NONE" ? "INDEPENDENT" : "GUIDED") : "NEEDS_PRACTICE";
    if (status === "INDEPENDENT") independent++;
    await db.progressRecord.upsert({
      where: { studentId_questionId: { studentId, questionId } },
      create: {
        studentId,
        questionId,
        status,
        independentCount: status === "INDEPENDENT" ? 1 : 0,
        guidedCount: status === "GUIDED" ? 1 : 0,
        practiceCount: status === "NEEDS_PRACTICE" ? 1 : 0,
      },
      update: {
        status,
        lastSeenAt: new Date(),
        independentCount: { increment: status === "INDEPENDENT" ? 1 : 0 },
        guidedCount: { increment: status === "GUIDED" ? 1 : 0 },
        practiceCount: { increment: status === "NEEDS_PRACTICE" ? 1 : 0 },
      },
    });
  }
  return db.studentAttempt.update({
    where: { id: attempt.id },
    data: {
      completedAt: attempt.completedAt ?? new Date(),
      durationMs: extra?.durationMs ?? attempt.durationMs,
      questionsPresented: Math.max(byQuestion.size, extra?.presented ?? 0),
      correctCount: attempt.responses.filter((r) => r.outcome === "CORRECT").length,
      incorrectCount: attempt.responses.filter((r) => r.outcome === "INCORRECT").length,
      uncertainCount: attempt.responses.filter((r) => r.outcome === "UNCERTAIN").length,
      hintsUsed: [...byQuestion.values()].filter((rs) => rs.some((r) => r.support !== "NONE")).length,
      independentCount: independent,
    },
  });
}

/** Questions already finished in an attempt (to continue an incomplete activity). */
export async function finishedQuestionIds(attemptId: string) {
  const rs = await db.studentResponse.findMany({ where: { attemptId, endsQuestion: true }, select: { questionId: true } });
  return new Set(rs.map((r) => r.questionId));
}
