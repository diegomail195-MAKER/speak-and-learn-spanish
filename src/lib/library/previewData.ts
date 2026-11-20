import "server-only";
import { HttpError } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { buildPlayGame } from "@/lib/games/service";
import type { LessonStep } from "./lessonData";
import { teacherTopicSteps, type StepKind } from "./steps";
import { safeContent, type AnyContent, type Kind } from "./types";

// Preview (Platform Admin and teachers): the whole topic with free navigation. The outline (titles,
// types and order) is built on the page; each step's content comes from the preview API when it is
// opened, so a resource that fails to load shows an error with "Retry" and the rest stays usable.
// Every request checks the role and the topic again. Nothing here writes student data.

/** "admin": the topic as the administrator built it (drafts included). "teacher": the teacher's lesson order (published content and their own activities). */
export type PreviewScope = "admin" | "teacher";

export interface PreviewOutlineStep {
  key: string;
  kind: StepKind;
  title: string;
}

type Viewer = { id: string; role: string; schoolId: string; displayName: string; teacher: { id: string } | null };

/**
 * Who may preview: administrators any topic in the admin scope (drafts too) and, in the teacher
 * scope, administrators and teachers any published topic (every teacher has the Library's
 * published topics). Students never.
 */
export async function previewTopic(user: Viewer | null, scope: PreviewScope, ref: { id?: string; slug?: string }) {
  if (!user || !user.teacher || (user.role !== "TEACHER" && user.role !== "ADMIN")) throw new HttpError(401, "Teacher sign-in required");
  if (scope === "admin" && user.role !== "ADMIN") throw new HttpError(403, "Administrators only");
  const topic = await db.topic.findFirst({ where: { ...(ref.id ? { id: ref.id } : { slug: ref.slug ?? "" }), ...(scope === "teacher" ? { status: "PUBLISHED" as const } : {}) } });
  if (!topic) throw new HttpError(404, "Topic not found");
  return { topic, teacher: user.teacher };
}

async function adminSteps(topicId: string) {
  const links = await db.topicResource.findMany({
    where: { topicId, resource: { status: { not: "ARCHIVED" } } },
    orderBy: { position: "asc" },
    include: { resource: { include: { currentVersion: { select: { title: true, content: true } } } } },
  });
  return links.map(({ resource: r }) => {
    const usePublished = r.status === "PUBLISHED" && !!r.currentVersion;
    return {
      key: `r:${r.id}`,
      kind: r.kind as StepKind,
      title: (usePublished ? r.currentVersion!.title : r.title) || r.title,
      draft: !usePublished,
      content: usePublished ? r.currentVersion!.content : r.draft,
      gameId: undefined as string | undefined,
    };
  });
}

async function scopeSteps(user: Viewer, scope: PreviewScope, topicId: string, teacherId: string, grade: "LOWER" | "UPPER" | null) {
  if (scope === "admin") return adminSteps(topicId);
  const { steps } = await teacherTopicSteps({ id: teacherId, schoolId: user.schoolId }, topicId, grade);
  return steps.map((s) => ({ key: s.key, kind: s.kind, title: s.title, draft: false, content: s.content, gameId: s.gameId }));
}

/** The topic's steps in the configured order (what Previous/Next and "3 of 7" follow). */
export async function previewOutline(user: Viewer | null, scope: PreviewScope, ref: { id?: string; slug?: string }, grade: "LOWER" | "UPPER" | null = null) {
  const { topic, teacher } = await previewTopic(user, scope, ref);
  const steps = await scopeSteps(user!, scope, topic.id, teacher.id, grade);
  return {
    topic,
    drafts: steps.filter((s) => s.draft).length,
    steps: steps.map((s): PreviewOutlineStep => ({ key: s.key, kind: s.kind, title: s.title })),
  };
}

/** One step's playable content (the real activity's data), after checking access again. */
export async function previewStep(user: Viewer | null, scope: PreviewScope, topicId: string, key: string, grade: "LOWER" | "UPPER" | null = null): Promise<LessonStep> {
  const { topic, teacher } = await previewTopic(user, scope, { id: topicId });
  const steps = await scopeSteps(user!, scope, topic.id, teacher.id, grade);
  const s = steps.find((x) => x.key === key);
  if (!s) throw new HttpError(404, "This resource is no longer in the topic.");
  if (s.gameId) {
    const [first, ...rest] = user!.displayName.split(/\s+/);
    const game = await buildPlayGame(user!.schoolId, s.gameId, { firstName: first ?? "", lastName: rest.join(" ") }).catch(() => null);
    if (!game) throw new HttpError(404, "This activity could not be loaded.");
    if (game.board === "flashcards") game.practiceAudioUrl = `/api/games/${s.gameId}/practice-audio`;
    return { id: s.key, kind: s.kind, title: s.title, content: null, game, done: false };
  }
  return { id: s.key, kind: s.kind, title: s.title, content: safeContent(s.kind as Kind, s.content) as AnyContent, game: null, done: false };
}
