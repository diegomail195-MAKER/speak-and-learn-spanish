// The guided Topic lesson is a sequence: a student may open the steps they finished and the first
// one they haven't, never a later one. Shared by the pages, the progress action and the attempts
// API so a direct URL follows the same order as the lesson.

export type SequenceStep = { id: string; done: boolean; /** Steps the lesson skips (their activity is gone). */ skip?: boolean };

/**
 * Ids of the steps the student may open now: every finished step (wherever it is, so progress
 * made before keeps working) and the first unfinished one.
 */
export function openSteps(steps: SequenceStep[]): Set<string> {
  const open = new Set<string>();
  let current = false;
  for (const s of steps) {
    if (s.skip) continue;
    if (s.done) open.add(s.id);
    else if (!current) {
      open.add(s.id);
      current = true;
    }
  }
  return open;
}

/**
 * Where a student lands when they open a Topic lesson, possibly with ?step=N (1-based) on the URL.
 * Before the topic is completed the lesson always opens the current step (the first one not
 * finished); a link to another step shows why it didn't open. Once every step is finished, a step
 * on the URL opens as a repeat.
 */
export function lessonEntry(steps: Array<{ done: boolean }>, stepParam: string | undefined): { startAt: number | null; notice: string | null } {
  if (stepParam === undefined || stepParam === "") return { startAt: null, notice: null };
  const n = Number(stepParam);
  if (!Number.isInteger(n) || n < 1 || n > steps.length) return { startAt: null, notice: null };
  const want = n - 1;
  const current = steps.findIndex((s) => !s.done);
  if (current < 0) return { startAt: want, notice: null };
  if (want === current) return { startAt: null, notice: null };
  if (want > current)
    return { startAt: null, notice: `Esa actividad todavía está bloqueada: termina primero esta. · That activity is still locked: finish this one first.` };
  return { startAt: null, notice: `Podrás repetir esa actividad cuando termines el Topic. · You can repeat that activity once you finish the Topic.` };
}
