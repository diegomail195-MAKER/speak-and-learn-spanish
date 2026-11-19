"use server";

import type { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { requireAdmin } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { assertFilesReady } from "@/lib/library/service";
import { GAME_TYPES, GRADES, KINDS, emptyContent, parseContent, publishProblem, type AnyContent, type Kind } from "@/lib/library/types";

// Administrator-only operations on the content library. Every action starts with requireAdmin(),
// so a teacher or student calling them directly gets 403.

export type LibState = { error?: string; ok?: boolean; message?: string } | undefined;

const ids = (form: FormData, name: string) => form.getAll(name).map(String).filter(Boolean);

function revalidateLibrary(resourceId?: string) {
  revalidatePath("/admin", "layout");
  revalidatePath("/teacher/library", "layout");
  if (resourceId) revalidatePath(`/admin/content/${resourceId}`);
}

async function syncTopics(tx: Prisma.TransactionClient, resourceId: string, topicIds: string[]) {
  const existing = await tx.topicResource.findMany({ where: { resourceId } });
  const keep = new Set(topicIds);
  await tx.topicResource.deleteMany({ where: { resourceId, topicId: { notIn: topicIds } } });
  for (const topicId of keep) {
    if (existing.some((e) => e.topicId === topicId)) continue;
    const last = await tx.topicResource.aggregate({ where: { topicId }, _max: { position: true } });
    await tx.topicResource.create({ data: { topicId, resourceId, position: (last._max.position ?? -1) + 1 } });
  }
}

const meta = z.object({
  title: z.string().trim().min(2, "Write a title.").max(120),
  description: z.string().trim().max(400).default(""),
});

function readGrades(form: FormData) {
  const g = ids(form, "grades").filter((x): x is (typeof GRADES)[number] => (GRADES as readonly string[]).includes(x));
  return g;
}

/** "Add Content": creates a draft and opens it (upload, editor, preview, publish). */
export async function createResource(_: LibState, form: FormData): Promise<LibState> {
  const { user } = await requireAdmin();
  const m = meta.safeParse(Object.fromEntries(form));
  if (!m.success) return { error: m.error.issues[0].message };
  const kind = z.enum(KINDS).safeParse(form.get("kind"));
  if (!kind.success) return { error: "Choose the type of content." };
  const grades = readGrades(form);
  if (!grades.length) return { error: "Choose at least one grade." };
  const topicIds = ids(form, "topicIds");
  if (!topicIds.length) return { error: "Choose a topic." };
  if ((await db.topic.count({ where: { id: { in: topicIds } } })) !== topicIds.length) return { error: "Unknown topic." };
  const draft = emptyContent(kind.data) as Record<string, unknown>;
  if (kind.data === "GAME") draft.gameType = z.enum(GAME_TYPES).catch("MEMORY").parse(form.get("gameType"));
  const r = await db.$transaction(async (tx) => {
    const r = await tx.libraryResource.create({ data: { kind: kind.data, title: m.data.title, description: m.data.description, grades, status: "DRAFT", draft: draft as Prisma.InputJsonValue, createdById: user.id } });
    await syncTopics(tx, r.id, topicIds);
    return r;
  });
  await audit(user.schoolId, user.id, "library.create", "LibraryResource", r.id, { kind: kind.data });
  revalidateLibrary();
  redirect(`/admin/content/${r.id}`);
}

export async function updateResourceMeta(_: LibState, form: FormData): Promise<LibState> {
  const { user } = await requireAdmin();
  const id = String(form.get("resourceId"));
  const m = meta.safeParse(Object.fromEntries(form));
  if (!m.success) return { error: m.error.issues[0].message };
  const grades = readGrades(form);
  if (!grades.length) return { error: "Choose at least one grade." };
  const topicIds = ids(form, "topicIds");
  await db.$transaction(async (tx) => {
    await tx.libraryResource.update({ where: { id }, data: { title: m.data.title, description: m.data.description, grades } });
    await syncTopics(tx, id, topicIds);
  });
  await audit(user.schoolId, user.id, "library.update_meta", "LibraryResource", id);
  revalidateLibrary(id);
  return { ok: true, message: "Details saved." };
}

/** Saves the editor's content as the draft. Students keep seeing the published version until "Publish". */
export async function saveDraft(resourceId: string, content: unknown): Promise<LibState> {
  const { user } = await requireAdmin();
  const r = await db.libraryResource.findUnique({ where: { id: resourceId } });
  if (!r) return { error: "Not found." };
  let parsed: AnyContent;
  try {
    parsed = parseContent(r.kind as Kind, content) as AnyContent;
  } catch {
    return { error: "Some fields aren't valid. Check the lengths and try again." };
  }
  try {
    await assertFilesReady(parsed);
  } catch (e) {
    return { error: (e as Error).message };
  }
  await db.libraryResource.update({ where: { id: r.id }, data: { draft: parsed as Prisma.InputJsonValue } });
  await audit(user.schoolId, user.id, "library.save_draft", "LibraryResource", r.id);
  revalidatePath(`/admin/content/${r.id}`);
  return { ok: true, message: "Draft saved." };
}

/** New immutable version from the draft. Existing assignments keep the version they pinned. */
export async function publishResource(_: LibState, form: FormData): Promise<LibState> {
  const { user } = await requireAdmin();
  const id = String(form.get("resourceId"));
  const r = await db.libraryResource.findUnique({ where: { id }, include: { topics: true } });
  if (!r) return { error: "Not found." };
  const content = parseContent(r.kind as Kind, r.draft) as AnyContent;
  const problem = publishProblem(r.kind as Kind, content);
  if (problem) return { error: problem };
  if (!r.grades.length) return { error: "Choose at least one grade before publishing." };
  if (!r.topics.length) return { error: "Add it to a topic before publishing." };
  const fileIds = await assertFilesReady(content);
  const last = await db.resourceVersion.aggregate({ where: { resourceId: r.id }, _max: { number: true } });
  const number = (last._max.number ?? 0) + 1;
  await db.$transaction(async (tx) => {
    const v = await tx.resourceVersion.create({ data: { resourceId: r.id, number, title: r.title, content: content as Prisma.InputJsonValue, fileIds } });
    await tx.libraryResource.update({ where: { id: r.id }, data: { status: "PUBLISHED", currentVersionId: v.id } });
  });
  await audit(user.schoolId, user.id, "library.publish", "LibraryResource", r.id, { version: number });
  revalidateLibrary(r.id);
  return { ok: true, message: `Published version ${number}.` };
}

/** Hidden from the library and from new tasks; students who already have it keep access and progress. */
export async function archiveResource(form: FormData) {
  const { user } = await requireAdmin();
  const id = String(form.get("resourceId"));
  await db.libraryResource.update({ where: { id }, data: { status: "ARCHIVED" } });
  await audit(user.schoolId, user.id, "library.archive", "LibraryResource", id);
  revalidateLibrary(id);
}

export async function restoreResource(form: FormData) {
  const { user } = await requireAdmin();
  const id = String(form.get("resourceId"));
  const r = await db.libraryResource.findUniqueOrThrow({ where: { id } });
  await db.libraryResource.update({ where: { id }, data: { status: r.currentVersionId ? "PUBLISHED" : "DRAFT" } });
  await audit(user.schoolId, user.id, "library.restore", "LibraryResource", id);
  revalidateLibrary(id);
}

/** "Delete from Library". Refused while any task uses it: archive instead (keeps students' access). */
export async function deleteResource(_: LibState, form: FormData): Promise<LibState> {
  const { user } = await requireAdmin();
  const id = String(form.get("resourceId"));
  const used = await db.assignmentActivity.count({ where: { resourceId: id } });
  if (used > 0) return { error: `It's in ${used} assigned task${used === 1 ? "" : "s"}. Archive it instead: it disappears from the library and new tasks, and students who have it keep their access and progress.` };
  await db.libraryResource.delete({ where: { id } });
  await audit(user.schoolId, user.id, "library.delete", "LibraryResource", id);
  revalidateLibrary();
  const back = String(form.get("back") ?? "");
  redirect(back.startsWith("/admin") ? back : "/admin/content");
}

/** Copy of the activity as a new draft, placed right after the original in each of its topics. */
export async function duplicateResource(form: FormData) {
  const { user } = await requireAdmin();
  const id = String(form.get("resourceId"));
  const r = await db.libraryResource.findUniqueOrThrow({ where: { id }, include: { topics: true } });
  const copy = await db.$transaction(async (tx) => {
    const c = await tx.libraryResource.create({ data: { kind: r.kind, title: `${r.title} (copy)`.slice(0, 120), description: r.description, grades: r.grades, status: "DRAFT", draft: r.draft as Prisma.InputJsonValue, createdById: user.id } });
    for (const t of r.topics) {
      await tx.topicResource.updateMany({ where: { topicId: t.topicId, position: { gt: t.position } }, data: { position: { increment: 1 } } });
      await tx.topicResource.create({ data: { topicId: t.topicId, resourceId: c.id, position: t.position + 1 } });
    }
    return c;
  });
  await audit(user.schoolId, user.id, "library.duplicate", "LibraryResource", copy.id, { from: id });
  revalidateLibrary();
  redirect(`/admin/content/${copy.id}`);
}

// ---- Topics ----

const topicSchema = z.object({
  titleEn: z.string().trim().min(2, "Write the English title.").max(80),
  titleEs: z.string().trim().min(2, "Write the Spanish title.").max(80),
  category: z.string().trim().min(2, "Write a category.").max(40),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#FF9F5A"),
});

function slugify(s: string) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 50) || "topic";
}

export async function createTopic(_: LibState, form: FormData): Promise<LibState> {
  const { user } = await requireAdmin();
  const p = topicSchema.safeParse(Object.fromEntries(form));
  if (!p.success) return { error: p.error.issues[0].message };
  let slug = slugify(p.data.titleEn);
  for (let i = 2; await db.topic.findUnique({ where: { slug } }); i++) slug = `${slugify(p.data.titleEn)}-${i}`;
  const count = await db.topic.count();
  const t = await db.topic.create({ data: { ...p.data, slug, sortOrder: count, status: "PUBLISHED" } });
  await audit(user.schoolId, user.id, "topic.create", "Topic", t.id);
  revalidateLibrary();
  redirect(`/admin/topics/${t.id}`);
}

export async function updateTopic(_: LibState, form: FormData): Promise<LibState> {
  const { user } = await requireAdmin();
  const id = String(form.get("topicId"));
  const p = topicSchema.safeParse(Object.fromEntries(form));
  if (!p.success) return { error: p.error.issues[0].message };
  await db.topic.update({ where: { id }, data: p.data });
  await audit(user.schoolId, user.id, "topic.update", "Topic", id);
  revalidateLibrary();
  return { ok: true, message: "Topic saved." };
}

async function renumber(tx: Prisma.TransactionClient, topicId: string, order: string[]) {
  for (const [i, resourceId] of order.entries()) await tx.topicResource.update({ where: { topicId_resourceId: { topicId, resourceId } }, data: { position: i } });
}

export async function addToTopic(form: FormData) {
  const { user } = await requireAdmin();
  const topicId = String(form.get("topicId"));
  const resourceId = String(form.get("resourceId"));
  await db.$transaction((tx) => syncTopicAdd(tx, topicId, resourceId));
  await audit(user.schoolId, user.id, "topic.add_resource", "Topic", topicId, { resourceId });
  revalidateLibrary();
}

async function syncTopicAdd(tx: Prisma.TransactionClient, topicId: string, resourceId: string) {
  if (await tx.topicResource.findUnique({ where: { topicId_resourceId: { topicId, resourceId } } })) return;
  const last = await tx.topicResource.aggregate({ where: { topicId }, _max: { position: true } });
  await tx.topicResource.create({ data: { topicId, resourceId, position: (last._max.position ?? -1) + 1 } });
}

/** "Remove from Topic": the resource stays in the library (and in tasks that already have it). */
export async function removeFromTopic(form: FormData) {
  const { user } = await requireAdmin();
  const topicId = String(form.get("topicId"));
  const resourceId = String(form.get("resourceId"));
  await db.$transaction(async (tx) => {
    await tx.topicResource.delete({ where: { topicId_resourceId: { topicId, resourceId } } });
    const rest = await tx.topicResource.findMany({ where: { topicId }, orderBy: { position: "asc" } });
    await renumber(tx, topicId, rest.map((r) => r.resourceId));
  });
  await audit(user.schoolId, user.id, "topic.remove_resource", "Topic", topicId, { resourceId });
  revalidateLibrary();
}

export async function moveInTopic(form: FormData) {
  await requireAdmin();
  const topicId = String(form.get("topicId"));
  const resourceId = String(form.get("resourceId"));
  const dir = form.get("dir") === "up" ? -1 : 1;
  await db.$transaction(async (tx) => {
    const rows = await tx.topicResource.findMany({ where: { topicId }, orderBy: { position: "asc" } });
    const order = rows.map((r) => r.resourceId);
    const i = order.indexOf(resourceId);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= order.length) return;
    [order[i], order[j]] = [order[j], order[i]];
    await renumber(tx, topicId, order);
  });
  revalidateLibrary();
}

/** Puts another resource in the same place. Tasks already assigned keep the original. */
export async function replaceInTopic(form: FormData) {
  const { user } = await requireAdmin();
  const topicId = String(form.get("topicId"));
  const oldId = String(form.get("resourceId"));
  const newId = String(form.get("replacementId"));
  if (!newId || newId === oldId) return;
  await db.$transaction(async (tx) => {
    const old = await tx.topicResource.findUniqueOrThrow({ where: { topicId_resourceId: { topicId, resourceId: oldId } } });
    await tx.topicResource.deleteMany({ where: { topicId, resourceId: newId } });
    await tx.topicResource.delete({ where: { topicId_resourceId: { topicId, resourceId: oldId } } });
    await tx.topicResource.create({ data: { topicId, resourceId: newId, position: old.position } });
    const rest = await tx.topicResource.findMany({ where: { topicId }, orderBy: { position: "asc" } });
    await renumber(tx, topicId, rest.map((r) => r.resourceId));
  });
  await audit(user.schoolId, user.id, "topic.replace_resource", "Topic", topicId, { from: oldId, to: newId });
  revalidateLibrary();
}
