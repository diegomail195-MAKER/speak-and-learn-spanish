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
