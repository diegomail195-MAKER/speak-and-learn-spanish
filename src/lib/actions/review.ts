"use server";

import type { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { requireTeacher } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { parseDetails, reviewDetail, speakingScore } from "@/lib/review";

export type ReviewState = { ok?: boolean; error?: string; message?: string } | undefined;

const decision = z.enum(["CORRECT", "INCORRECT"]);

/**
 * Saves the teacher's decisions on a piece of speaking work and marks it reviewed.
 * Form: key ("a:<attemptId>" | "p:<progressId>"), note, and decision:<answerId> = CORRECT | INCORRECT.
 * The work must be in the teacher's scope (reviewDetail checks it on the server).
 */
export async function submitReview(_: ReviewState, form: FormData): Promise<ReviewState> {
  const { user, teacher } = await requireTeacher();
  const key = String(form.get("key") ?? "");
  const note = z.string().trim().max(1000).parse(String(form.get("note") ?? ""));
  const work = await reviewDetail(teacher.id, key);
  if (!work) return { error: "This work isn't available to you." };

  const decisions = new Map<string, "CORRECT" | "INCORRECT">();
  for (const a of work.answers) {
    const v = decision.safeParse(form.get(`decision:${a.id}`));
    if (v.success) decisions.set(a.id, v.data);
  }
  const undecided = work.answers.filter((a) => a.outcome === "UNCERTAIN" && !a.teacher && !decisions.has(a.id));
  if (undecided.length) return { error: `Decide the ${undecided.length === 1 ? "answer" : `${undecided.length} answers`} marked “Unsure” first.` };

  const now = new Date();
  const id = key.slice(2);
  if (key.startsWith("a:")) {
    await db.$transaction(async (tx) => {
      let { correct, incorrect, uncertain } = { correct: 0, incorrect: 0, uncertain: 0 };
      for (const a of work.answers) {
        const final = decisions.get(a.id) ?? a.teacher ?? a.outcome;
        if (decisions.has(a.id)) await tx.studentResponse.update({ where: { id: a.id }, data: { teacherOutcome: decisions.get(a.id) } });
        if (final === "CORRECT") correct++;
        else if (final === "INCORRECT") incorrect++;
        else uncertain++;
      }
      await tx.studentAttempt.update({ where: { id }, data: { reviewedAt: now, reviewedById: user.id, reviewNote: note, correctCount: correct, incorrectCount: incorrect, uncertainCount: uncertain } });
    });
  } else {
    const row = await db.activityProgress.findUniqueOrThrow({ where: { id }, select: { details: true } });
    const details = parseDetails(row.details).map((r, i) => (decisions.has(String(i)) ? { ...r, teacher: decisions.get(String(i)) } : r));
    await db.activityProgress.update({ where: { id }, data: { details: details as Prisma.InputJsonValue, score: speakingScore(details), reviewedAt: now, reviewedById: user.id, reviewNote: note } });
  }
  await audit(user.schoolId, user.id, "review.submit", key.startsWith("a:") ? "StudentAttempt" : "ActivityProgress", id, { decided: decisions.size, note: !!note });
  revalidatePath("/teacher/review");
  revalidatePath("/teacher");
  return { ok: true, message: "Review saved." };
}
