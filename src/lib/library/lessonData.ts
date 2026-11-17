import "server-only";
import { assignmentsForStudentWhere } from "@/lib/access";
import { finishedQuestions } from "@/lib/attempts/service";
import { db } from "@/lib/db";
import { buildPlayGame, splitSpellingName } from "@/lib/games/service";
import type { PlayGame } from "@/lib/games/types";
import { activityStep, teacherTopicSteps, type StepKind } from "./steps";
import { safeContent, type AnyContent, type Kind } from "./types";

// What the guided Topic lesson plays: one entry per step, in the saved order. Built for a student's
// assignment (with their progress) and for the teacher's Student View (nothing recorded).

export interface LessonStep {
  /** The assignment activity (student) or the step key (Student View). */
  id: string;
  kind: StepKind;
  title: string;
  /** Library resource steps. */
  content: AnyContent | null;
  /** The teacher's activities (Speaking, flashcards decks): the game the real player runs. */
  game: PlayGame | null;
  /** Questions finished in an unfinished attempt of that game. */
  doneQuestions?: Record<string, "NONE" | "HINT" | "MODEL" | null>;
  done: boolean;
}

type StudentRef = { id: string; classroomId: string; schoolId: string; firstName: string; spellingName: string };

async function gameFor(schoolId: string, gameId: string, names: { firstName: string; lastName: string }) {
  return buildPlayGame(schoolId, gameId, names).catch(() => null);
}

/** A student's Topic assignment as a lesson, plus where "Next assignment" goes. */
export async function studentLesson(student: StudentRef, assignmentId: string) {
  const a = await db.assignment.findFirst({
    where: { id: assignmentId, topicId: { not: null }, ...assignmentsForStudentWhere(student) },
    include: {
      topic: true,
      activities: {
        orderBy: { position: "asc" },
        include: {
          resource: { select: { kind: true } },
          version: { select: { title: true, content: true } },
          game: { select: { id: true, title: true, templateKey: true } },
          progress: { where: { studentId: student.id, completedAt: { not: null } }, select: { id: true }, take: 1 },
        },
      },
    },
  });
  if (!a) return null;
  const names = splitSpellingName(student.spellingName, student.firstName);
  const steps: LessonStep[] = [];
  for (const act of a.activities) {
    const s = activityStep(act);
    const done = act.progress.length > 0;
    if (s.gameId) {
      const game = await gameFor(student.schoolId, s.gameId, names);
      if (!game) continue; // the activity was deleted or moved: the rest of the lesson still plays
      if (a.instructions) game.instructions = [a.instructions, game.instructions].filter(Boolean).join(" ");
      if (game.board === "flashcards") game.practiceAudioUrl = `/api/games/${s.gameId}/practice-audio?assignment=${a.id}&activity=${act.id}`;
      const open = await db.studentAttempt.findFirst({ where: { studentId: student.id, assignmentId: a.id, gameId: s.gameId, completedAt: null }, orderBy: { startedAt: "desc" }, select: { id: true } });
      steps.push({ id: act.id, kind: s.kind, title: s.title, content: null, game, doneQuestions: open ? await finishedQuestions(open.id) : {}, done });
    } else {
      steps.push({ id: act.id, kind: s.kind, title: s.title, content: safeContent(s.kind as Kind, s.content) as AnyContent, game: null, done });
    }
  }
  return { assignment: a, steps, nextHref: await nextAssignmentHref(student, a.id) };
}

/** The next thing to do in My Assignments (same order as that page), or null. */
async function nextAssignmentHref(student: StudentRef, currentId: string) {
  const order = [{ dueAt: { sort: "asc" as const, nulls: "last" as const } }, { createdAt: "desc" as const }];
  const tasks = await db.assignment.findMany({
    where: { ...assignmentsForStudentWhere(student), topicId: { not: null }, id: { not: currentId } },
    select: { id: true, activities: { select: { progress: { where: { studentId: student.id, completedAt: { not: null } }, select: { id: true }, take: 1 } } } },
    orderBy: order,
  });
  const task = tasks.find((t) => t.activities.length > 0 && t.activities.some((x) => x.progress.length === 0));
  if (task) return `/learn/tasks/${task.id}`;
  const games = await db.assignment.findMany({
    where: { ...assignmentsForStudentWhere(student), gameId: { not: null } },
    select: { id: true, maxAttempts: true, attempts: { where: { studentId: student.id }, select: { completedAt: true } } },
    orderBy: order,
  });
  const g = games.find((x) => x.attempts.length === 0 || x.attempts.some((t) => !t.completedAt));
  return g ? `/play/${g.id}` : null;
}

/** The teacher's Student View of a topic: the same steps in their saved order, nothing recorded. */
export async function previewLesson(user: { schoolId: string; displayName: string }, teacher: { id: string }, topicId: string, grade?: "LOWER" | "UPPER" | null) {
  const { steps } = await teacherTopicSteps({ id: teacher.id, schoolId: user.schoolId }, topicId, grade);
  const [first, ...rest] = user.displayName.split(/\s+/);
  const names = { firstName: first ?? "", lastName: rest.join(" ") };
  const out: LessonStep[] = [];
  for (const s of steps) {
    if (s.gameId) {
      const game = await gameFor(user.schoolId, s.gameId, names);
      if (!game) continue;
      if (game.board === "flashcards") game.practiceAudioUrl = `/api/games/${s.gameId}/practice-audio`;
      out.push({ id: s.key, kind: s.kind, title: s.title, content: null, game, done: false });
    } else {
      out.push({ id: s.key, kind: s.kind, title: s.title, content: safeContent(s.kind as Kind, s.content) as AnyContent, game: null, done: false });
    }
  }
  return out;
}
