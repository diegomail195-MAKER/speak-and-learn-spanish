import "server-only";
import { db } from "@/lib/db";
import { publishedWhere } from "./service";
import type { Kind } from "./types";

// A Topic lesson is a list of steps in the teacher's order: library resources of the topic and
// the teacher's own activities (games). The five category icons keep their fixed order; only the
// lesson sequence follows the teacher.

export type StepKind = Kind | "SPEAKING";

export interface TopicStep {
  /** "r:<resourceId>" or "g:<gameId>". */
  key: string;
  kind: StepKind;
  title: string;
  resourceId?: string;
  gameId?: string;
  /** Library resources: the published version's content. */
  content?: unknown;
  grades?: string[];
}

/** A teacher's activity in a lesson: flashcards decks are Flashcards; the voice games are Speaking. */
export const gameKind = (templateKey: string): StepKind => (templateKey === "FLASHCARDS" ? "FLASHCARDS" : "SPEAKING");

export const STEP_LABEL: Record<StepKind, string> = {
  VIDEO: "Video",
  SONG: "Music video",
  GAME: "Game",
  FLASHCARDS: "Flashcards",
  PRINTABLE: "Worksheet",
  WORKSHEET: "Worksheet",
  LISTENING: "Listening",
  SPEAKING: "Speaking",
};

/**
 * The topic's steps for this teacher: their saved order first (items that disappeared are
 * skipped), then library resources published later that they didn't remove. `removed` are the
 * library resources the teacher took out (they can add them back).
 */
export async function teacherTopicSteps(teacher: { id: string; schoolId: string }, topicId: string, grade?: "LOWER" | "UPPER" | null, classroomId?: string | null) {
  const [links, plans] = await Promise.all([
    db.topicResource.findMany({
      where: { topicId, resource: { ...publishedWhere, ...(grade ? { grades: { has: grade } } : {}) } },
      orderBy: { position: "asc" },
      include: { resource: { select: { id: true, kind: true, title: true, grades: true, currentVersion: { select: { title: true, content: true } } } } },
    }),
    // The class's confirmed setup when there is one, otherwise the teacher's default order.
    db.topicPlan.findMany({ where: { teacherId: teacher.id, topicId, classroomId: { in: classroomId ? ["", classroomId] : [""] } } }),
  ]);
  const classPlan = classroomId ? plans.find((p) => p.classroomId === classroomId) : undefined;
  const plan = classPlan ?? plans.find((p) => p.classroomId === "");
  const library = new Map<string, TopicStep>(
    links.map(({ resource: r }) => [
      `r:${r.id}`,
      { key: `r:${r.id}`, kind: r.kind as Kind, title: r.currentVersion?.title || r.title, resourceId: r.id, content: r.currentVersion?.content, grades: r.grades },
    ]),
  );
  const gameIds = (plan?.steps ?? []).filter((k) => k.startsWith("g:")).map((k) => k.slice(2));
  const games = gameIds.length
    ? await db.game.findMany({ where: { id: { in: gameIds }, schoolId: teacher.schoolId, status: "PUBLISHED" }, select: { id: true, title: true, templateKey: true } })
    : [];
  const own = new Map<string, TopicStep>(games.map((g) => [`g:${g.id}`, { key: `g:${g.id}`, kind: gameKind(g.templateKey), title: g.title || "Untitled", gameId: g.id }]));
  const hidden = new Set(plan?.hidden ?? []);
  const steps: TopicStep[] = [];
  const seen = new Set<string>();
  for (const k of plan?.steps ?? []) {
    const s = library.get(k) ?? own.get(k);
    if (s && !seen.has(k)) {
      steps.push(s);
      seen.add(k);
    }
  }
  for (const [k, s] of library) if (!seen.has(k) && !hidden.has(k)) steps.push(s);
  const removed = [...library.values()].filter((s) => hidden.has(s.key) && !seen.has(s.key));
  return { steps, removed, saved: !!plan, classSaved: classPlan ? classPlan.updatedAt : null };
}

/** What an assignment step is: a pinned library version or a teacher's activity. */
export function activityStep(a: { id: string; resource: { kind: string } | null; version: { title: string; content: unknown } | null; game: { id: string; title: string; templateKey: string } | null }) {
  if (a.game) return { kind: gameKind(a.game.templateKey), title: a.game.title || "Activity", gameId: a.game.id, content: null as unknown };
  return { kind: (a.resource?.kind ?? "VIDEO") as StepKind, title: a.version?.title ?? "Activity", gameId: null, content: a.version?.content ?? null };
}
