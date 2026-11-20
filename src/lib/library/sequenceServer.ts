import "server-only";
import { HttpError } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { openSteps } from "./sequence";

/**
 * Throws 403 when the student tries to open a step of a Topic task out of order (a later step
 * than the first one not finished). Steps whose activity no longer exists are skipped, like the
 * lesson does.
 */
export async function assertStepOpen(student: { id: string; schoolId: string }, assignmentId: string, activityId: string) {
  const acts = await db.assignmentActivity.findMany({
    where: { assignmentId },
    orderBy: { position: "asc" },
    select: {
      id: true,
      gameId: true,
      game: { select: { schoolId: true } },
      progress: { where: { studentId: student.id, completedAt: { not: null } }, select: { id: true }, take: 1 },
    },
  });
  const steps = acts.map((a) => ({ id: a.id, done: a.progress.length > 0, skip: !!a.gameId && a.game?.schoolId !== student.schoolId }));
  const open = openSteps(steps);
  if (!open.has(activityId)) throw new HttpError(403, "Finish the earlier steps of this task first.");
  const live = steps.filter((s) => !s.skip);
  return { done: !!live.find((s) => s.id === activityId)?.done, topicCompleted: live.length > 0 && live.every((s) => s.done) };
}
