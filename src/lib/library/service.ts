import "server-only";
import type { Prisma } from "@prisma/client";
import { assignmentsForStudentWhere } from "@/lib/access";
import { HttpError } from "@/lib/auth/guards";
import type { SessionUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { fileIdsOf, safeContent, type AnyContent, type Kind } from "./types";

// Reads for the library. Published content is what teachers browse and assign; drafts and the
// editor are for administrators only; students only reach the pinned versions assigned to them.

export const publishedWhere = { status: "PUBLISHED" as const, currentVersionId: { not: null } };

export async function libraryTopics(opts: { grade?: "LOWER" | "UPPER"; category?: string; q?: string; includeEmpty?: boolean } = {}) {
  const resWhere: Prisma.LibraryResourceWhereInput = { ...publishedWhere, ...(opts.grade ? { grades: { has: opts.grade } } : {}) };
  const topics = await db.topic.findMany({
    where: {
      status: "PUBLISHED",
      ...(opts.category ? { category: opts.category } : {}),
      ...(opts.q ? { OR: [{ titleEn: { contains: opts.q, mode: "insensitive" } }, { titleEs: { contains: opts.q, mode: "insensitive" } }] } : {}),
    },
    orderBy: [{ sortOrder: "asc" }, { titleEn: "asc" }],
    include: { resources: { where: { resource: resWhere }, orderBy: { position: "asc" }, include: { resource: { select: { id: true, kind: true, title: true, grades: true } } } } },
  });
  return opts.includeEmpty ? topics : topics.filter((t) => t.resources.length > 0);
}

export async function topicCategories() {
  const rows = await db.topic.findMany({ where: { status: "PUBLISHED" }, select: { category: true }, distinct: ["category"], orderBy: { category: "asc" } });
  return rows.map((r) => r.category);
}

/** Content to render for a resource: the current published version (teachers) or the draft (admin preview). */
export async function resourceForPreview(user: SessionUser, resourceId: string, mode: "published" | "draft") {
  const r = await db.libraryResource.findUnique({ where: { id: resourceId }, include: { currentVersion: true } });
  if (!r) throw new HttpError(404, "Not found");
  if (mode === "draft") {
    if (user.role !== "ADMIN") throw new HttpError(403, "Administrators only");
    return { kind: r.kind as Kind, title: r.title, content: safeContent(r.kind as Kind, r.draft) as AnyContent, resource: r };
  }
  if (!r.currentVersion || (r.status === "DRAFT" && user.role !== "ADMIN")) throw new HttpError(404, "Not found");
  return { kind: r.kind as Kind, title: r.currentVersion.title, content: safeContent(r.kind as Kind, r.currentVersion.content) as AnyContent, resource: r };
}

/** An assigned activity, only for a student who received the task. Returns the pinned version. */
export async function activityForStudent(student: { id: string; classroomId: string; schoolId: string }, assignmentId: string, activityId: string) {
  const act = await db.assignmentActivity.findFirst({
    where: { id: activityId, assignmentId, assignment: assignmentsForStudentWhere(student) },
    include: { version: true, resource: { select: { kind: true } }, game: { select: { id: true, title: true, templateKey: true } }, assignment: { select: { id: true, title: true } } },
  });
  if (!act) throw new HttpError(404, "Not found");
  // The next activity of the same task, for "Continue" (student focus mode).
  const next = await db.assignmentActivity.findFirst({ where: { assignmentId, position: { gt: act.position } }, orderBy: { position: "asc" }, select: { id: true } });
  const title = act.version?.title ?? act.game?.title ?? "Activity";
  if (!act.resource || !act.version) return { act, title, nextActivityId: next?.id ?? null, kind: null, content: null };
  return { act, title, nextActivityId: next?.id ?? null, kind: act.resource.kind as Kind, content: safeContent(act.resource.kind as Kind, act.version.content) as AnyContent };
}

/** Resources an administrator can pick with "Add from Library" (everything except archived). */
export async function pickableLibrary() {
  return db.libraryResource.findMany({ where: { status: { not: "ARCHIVED" } }, orderBy: [{ title: "asc" }], select: { id: true, title: true, kind: true, status: true }, take: 1000 });
}

/** Who may download a library file. */
export async function canReadLibraryFile(user: SessionUser, fileId: string): Promise<boolean> {
  if (user.role === "ADMIN") return true;
  if (user.teacher) {
    // Teachers: files of content that was published (archived content may still be assigned).
    return !!(await db.resourceVersion.findFirst({ where: { fileIds: { has: fileId }, resource: { status: { in: ["PUBLISHED", "ARCHIVED"] } } }, select: { id: true } }));
  }
  if (user.student) {
    if (await db.assignmentActivity.findFirst({ where: { version: { fileIds: { has: fileId } }, assignment: assignmentsForStudentWhere(user.student) }, select: { id: true } })) return true;
    // Library resources added to an activity (Game) that was assigned to the student.
    return !!(await db.gameResource.findFirst({
      where: { resource: { status: { in: ["PUBLISHED", "ARCHIVED"] }, currentVersion: { fileIds: { has: fileId } } }, game: { assignments: { some: assignmentsForStudentWhere(user.student) } } },
      select: { gameId: true },
    }));
  }
  return false;
}

/** Every file referenced by content must exist and be fully uploaded. */
export async function assertFilesReady(content: unknown) {
  const ids = fileIdsOf(content);
  if (!ids.length) return ids;
  const n = await db.libraryFile.count({ where: { id: { in: ids }, ready: true } });
  if (n !== ids.length) throw new HttpError(400, "A file in this activity didn't finish uploading. Upload it again.");
  return ids;
}

/** Library › Videos: published topics with their VIDEO and SONG resources and published content, in topic order. */
export async function libraryVideoTopics(opts: { grade?: "LOWER" | "UPPER" | null; slug?: string } = {}) {
  const topics = await db.topic.findMany({
    where: { status: "PUBLISHED", ...(opts.slug ? { slug: opts.slug } : {}) },
    orderBy: [{ sortOrder: "asc" }, { titleEn: "asc" }],
    select: {
      slug: true,
      titleEs: true,
      titleEn: true,
      category: true,
      resources: {
        where: { resource: { ...publishedWhere, kind: { in: ["VIDEO", "SONG"] }, ...(opts.grade ? { grades: { has: opts.grade } } : {}) } },
        orderBy: { position: "asc" },
        select: { resource: { select: { id: true, kind: true, title: true, currentVersion: { select: { title: true, content: true } } } } },
      },
    },
  });
  return topics.map((t) => ({
    slug: t.slug,
    titleEs: t.titleEs,
    titleEn: t.titleEn,
    category: t.category,
    resources: t.resources.map(({ resource: r }) => ({ id: r.id, kind: r.kind as string, title: r.currentVersion?.title || r.title, content: r.currentVersion?.content ?? null })),
  }));
}

/** Topics a resource belongs to (slugs, in topic order). */
export async function topicsOfResource(resourceId: string) {
  const rows = await db.topicResource.findMany({ where: { resourceId, topic: { status: "PUBLISHED" } }, select: { topic: { select: { slug: true, sortOrder: true } } } });
  return rows.map((r) => r.topic).sort((a, b) => a.sortOrder - b.sortOrder).map((t) => t.slug);
}
