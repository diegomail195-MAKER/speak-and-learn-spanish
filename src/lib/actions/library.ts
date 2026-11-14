"use server";

import type { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { requireAdmin } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { assertFilesReady } from "@/lib/library/service";
import { GAME_TYPES, GRADES, KINDS, UPLOAD_FOR, emptyContent, parseContent, publicUrl, publishProblem, youtubeIdFrom, type AnyContent, type Kind } from "@/lib/library/types";

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

// ---- Library: "Add Content" (Add Link, Upload File, or build with the editors) ----

const fileInput = z.object({ fileId: z.string().min(1), name: z.string().max(200).default(""), mime: z.string().max(100).default("") });

/**
 * "Save" on Add Content. A link or an uploaded file is saved and published right away, so it can
 * be added to topics and activities ("Add from Library"). Flashcards, games and generated sheets
 * open the editor as a draft.
 */
export async function addLibraryContent(_: LibState, form: FormData): Promise<LibState> {
  const { user } = await requireAdmin();
  const title = z.string().trim().min(2, "Write a title.").max(120).safeParse(form.get("title"));
  if (!title.success) return { error: title.error.issues[0].message };
  const kind = z.enum(KINDS).safeParse(form.get("kind"));
  if (!kind.success) return { error: "Choose the type of content." };
  const method = z.enum(["link", "upload", "build"]).safeParse(form.get("method"));
  if (!method.success) return { error: "Choose how to add it: Add Link, Upload File or the editor." };
  const grades = readGrades(form);
  const topicIds = ids(form, "topicIds");
  if (topicIds.length && (await db.topic.count({ where: { id: { in: topicIds } } })) !== topicIds.length) return { error: "Unknown topic." };
  const description = z.string().trim().max(400).catch("").parse(form.get("description") ?? "");

  const draft = emptyContent(kind.data) as Record<string, unknown>;
  if (method.data === "link") {
    const url = publicUrl(String(form.get("url") ?? ""));
    if (!url) return { error: "Paste a public link that starts with https:// or http://" };
    draft.link = { url };
    if (kind.data === "VIDEO") draft.youtubeId = youtubeIdFrom(url);
  } else if (method.data === "upload") {
    const accept = UPLOAD_FOR[kind.data];
    if (!accept) return { error: "This type is built with the editor or saved as a link." };
    let file: z.infer<typeof fileInput>;
    try {
      file = fileInput.parse(JSON.parse(String(form.get("file") ?? "null")));
    } catch {
      return { error: "Upload the file first." };
    }
    const row = await db.libraryFile.findUnique({ where: { id: file.fileId } });
    if (!row?.ready) return { error: "The file didn't finish uploading. Upload it again." };
    if (!accept.test(row.mimeType)) return { error: `That file doesn't fit a ${kind.data.toLowerCase()}. Use: ${accept.label}.` };
    draft.file = { fileId: row.id, name: row.originalName, mime: row.mimeType };
  } else {
    if (kind.data === "GAME") draft.gameType = z.enum(GAME_TYPES).catch("MEMORY").parse(form.get("gameType"));
  }

  const content = parseContent(kind.data, draft) as AnyContent;
  const publishNow = method.data !== "build";
  const fileIds = publishNow ? await assertFilesReady(content) : [];
  const r = await db.$transaction(async (tx) => {
    const r = await tx.libraryResource.create({
      data: { kind: kind.data, title: title.data, description, grades: grades.length ? grades : [...GRADES], status: "DRAFT", draft: content as Prisma.InputJsonValue, createdById: user.id },
    });
    if (topicIds.length) await syncTopics(tx, r.id, topicIds);
    if (publishNow) {
      const v = await tx.resourceVersion.create({ data: { resourceId: r.id, number: 1, title: title.data, content: content as Prisma.InputJsonValue, fileIds } });
      await tx.libraryResource.update({ where: { id: r.id }, data: { status: "PUBLISHED", currentVersionId: v.id } });
    }
    return r;
  });
  await audit(user.schoolId, user.id, "library.create", "LibraryResource", r.id, { kind: kind.data, method: method.data });
  revalidateLibrary();
  redirect(publishNow ? `/admin/content?saved=${r.id}` : `/admin/content/${r.id}`);
}

// ---- Grades ----

const gradeKey = (name: string) => name.normalize("NFC").trim().replace(/\s+/g, " ").toLowerCase();

/** "Add Grade" → "Save Grade". The name must have content and be unique (ignoring case and spaces). */
export async function createGrade(_: LibState, form: FormData): Promise<LibState> {
  const { user } = await requireAdmin();
  const name = String(form.get("name") ?? "").normalize("NFC").trim().replace(/\s+/g, " ");
  if (!name) return { error: "Write the grade name." };
  if (name.length > 60) return { error: "Use 60 characters or fewer." };
  const nameKey = gradeKey(name);
  if (await db.grade.findUnique({ where: { nameKey } })) return { error: `“${name}” already exists.` };
  const count = await db.grade.count();
  try {
    const g = await db.grade.create({ data: { name, nameKey, sortOrder: count } });
    await audit(user.schoolId, user.id, "grade.create", "Grade", g.id);
  } catch {
    return { error: `“${name}” already exists.` };
  }
  revalidateLibrary();
  return { ok: true, message: `Grade “${name}” saved.` };
}

async function readGradeId(form: FormData): Promise<string | null | false> {
  const raw = String(form.get("gradeId") ?? "");
  if (!raw) return null;
  return (await db.grade.findUnique({ where: { id: raw }, select: { id: true } })) ? raw : false;
}

// ---- "Add from Library" on topics and activities ----

async function existingResources(resourceIds: string[]) {
  const unique = [...new Set(resourceIds.filter(Boolean))].slice(0, 100);
  const found = await db.libraryResource.findMany({ where: { id: { in: unique }, status: { not: "ARCHIVED" } }, select: { id: true } });
  const ok = new Set(found.map((f) => f.id));
  return unique.filter((id) => ok.has(id));
}

/** Links library resources to a topic (the same resource can be in many topics; nothing is copied). */
export async function addResourcesToTopic(topicId: string, resourceIds: string[]): Promise<LibState> {
  const { user } = await requireAdmin();
  if (!(await db.topic.findUnique({ where: { id: topicId }, select: { id: true } }))) return { error: "Unknown topic." };
  const valid = await existingResources(resourceIds);
  await db.$transaction(async (tx) => { for (const id of valid) await syncTopicAdd(tx, topicId, id); });
  await audit(user.schoolId, user.id, "topic.add_from_library", "Topic", topicId, { resourceIds: valid });
  revalidateLibrary();
  revalidatePath(`/admin/topics/${topicId}`);
  return { ok: true, message: `Added ${valid.length}.` };
}

/** Links library resources to an activity (Game) of the administrator's school. */
export async function addResourcesToGame(gameId: string, resourceIds: string[]): Promise<LibState> {
  const { user } = await requireAdmin();
  const game = await db.game.findFirst({ where: { id: gameId, schoolId: user.schoolId }, select: { id: true } });
  if (!game) return { error: "Unknown activity." };
  const valid = await existingResources(resourceIds);
  await db.$transaction(async (tx) => {
    for (const resourceId of valid) {
      if (await tx.gameResource.findUnique({ where: { gameId_resourceId: { gameId, resourceId } } })) continue;
      const last = await tx.gameResource.aggregate({ where: { gameId }, _max: { position: true } });
      await tx.gameResource.create({ data: { gameId, resourceId, position: (last._max.position ?? -1) + 1 } });
    }
  });
  await audit(user.schoolId, user.id, "game.add_from_library", "Game", gameId, { resourceIds: valid });
  revalidatePath(`/teacher/games/${gameId}/edit`);
  return { ok: true, message: `Added ${valid.length}.` };
}

/** Removes a resource from an activity. It stays in the library and in every topic that has it. */
export async function removeFromGame(form: FormData) {
  const { user } = await requireAdmin();
  const gameId = String(form.get("gameId"));
  const resourceId = String(form.get("resourceId"));
  const game = await db.game.findFirst({ where: { id: gameId, schoolId: user.schoolId }, select: { id: true } });
  if (!game) return;
  await db.gameResource.deleteMany({ where: { gameId, resourceId } });
  await audit(user.schoolId, user.id, "game.remove_resource", "Game", gameId, { resourceId });
  revalidatePath(`/teacher/games/${gameId}/edit`);
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
  const gradeId = await readGradeId(form);
  if (gradeId === false) return { error: "Unknown grade." };
  const count = await db.topic.count();
  const resourceIds = await existingResources(ids(form, "resourceIds"));
  const t = await db.$transaction(async (tx) => {
    const t = await tx.topic.create({ data: { ...p.data, gradeId, slug, sortOrder: count, status: "PUBLISHED" } });
    for (const id of resourceIds) await syncTopicAdd(tx, t.id, id);
    return t;
  });
  await audit(user.schoolId, user.id, "topic.create", "Topic", t.id, { resourceIds });
  revalidateLibrary();
  redirect(`/admin/topics/${t.id}`);
}

export async function updateTopic(_: LibState, form: FormData): Promise<LibState> {
  const { user } = await requireAdmin();
  const id = String(form.get("topicId"));
  const p = topicSchema.safeParse(Object.fromEntries(form));
  if (!p.success) return { error: p.error.issues[0].message };
  const gradeId = await readGradeId(form);
  if (gradeId === false) return { error: "Unknown grade." };
  await db.topic.update({ where: { id }, data: { ...p.data, gradeId } });
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
