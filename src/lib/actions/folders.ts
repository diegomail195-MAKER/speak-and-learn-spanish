"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { HttpError, requireTeacher } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { FOLDER_COLOR_KEYS } from "@/lib/folders";

// My Activities: folders and moving a teacher's own activities. Every action checks that the
// folder and the activity belong to the signed-in teacher.

const name = z.string().trim().min(1, "Give the folder a name").max(60);
const color = z.enum(FOLDER_COLOR_KEYS);
const optId = z.string().max(40).nullable();

async function ownFolder(teacherId: string, id: string) {
  const f = await db.activityFolder.findFirst({ where: { id, teacherId } });
  if (!f) throw new HttpError(404, "Folder not found");
  return f;
}

async function ownGame(teacherId: string, id: string) {
  const g = await db.game.findFirst({ where: { id, teacherId } });
  if (!g) throw new HttpError(404, "Activity not found");
  return g;
}

const done = () => revalidatePath("/teacher/my-activities");

/** Result of creating or editing a folder. Errors come back as data (not thrown), so the dialog
 * can show them and keep what the teacher typed: thrown messages are hidden in production. */
export type FolderSaveResult = { ok: true; folder: { id: string; name: string; color: string } } | { ok: false; error: string; code: "name" | "color" | "not_found" | "failed" };

function saveError(e: unknown): FolderSaveResult {
  if (e instanceof z.ZodError) {
    const field = e.issues[0]?.path[0];
    return { ok: false, code: field === "color" ? "color" : "name", error: e.issues[0]?.message ?? "Check the folder name" };
  }
  if (e instanceof HttpError && e.status === 404) return { ok: false, code: "not_found", error: e.message };
  console.error("folder save failed", e);
  return { ok: false, code: "failed", error: "The folder could not be saved. Try again." };
}

const folderInput = z.object({ name, color });

export async function createFolder(input: { name: string; color: string; parentId: string | null }): Promise<FolderSaveResult> {
  const { teacher } = await requireTeacher();
  try {
    const data = { ...folderInput.parse({ name: input.name, color: input.color }), parentId: optId.parse(input.parentId) };
    if (data.parentId) await ownFolder(teacher.id, data.parentId);
    const f = await db.activityFolder.create({ data: { ...data, teacherId: teacher.id } });
    done();
    return { ok: true, folder: { id: f.id, name: f.name, color: f.color } };
  } catch (e) {
    return saveError(e);
  }
}

/** Renames a folder and/or changes its colour. Its id, parent and contents stay the same. */
export async function updateFolder(input: { id: string; name: string; color: string }): Promise<FolderSaveResult> {
  const { teacher } = await requireTeacher();
  try {
    const f = await ownFolder(teacher.id, z.string().max(40).parse(input.id));
    const data = folderInput.parse({ name: input.name, color: input.color });
    const u = await db.activityFolder.update({ where: { id: f.id }, data });
    done();
    return { ok: true, folder: { id: u.id, name: u.name, color: u.color } };
  } catch (e) {
    return saveError(e);
  }
}

/** Deletes a folder. What was inside (activities and folders) moves up to the parent folder. */
export async function deleteFolder(input: { id: string }) {
  const { user, teacher } = await requireTeacher();
  const f = await ownFolder(teacher.id, input.id);
  await db.$transaction([
    db.game.updateMany({ where: { folderId: f.id, teacherId: teacher.id }, data: { folderId: f.parentId } }),
    db.activityFolder.updateMany({ where: { parentId: f.id, teacherId: teacher.id }, data: { parentId: f.parentId } }),
    db.activityFolder.delete({ where: { id: f.id } }),
  ]);
  await audit(user.schoolId, user.id, "folder.delete", "ActivityFolder", f.id, { name: f.name });
  done();
}

export async function moveGame(input: { gameId: string; folderId: string | null }) {
  const { teacher } = await requireTeacher();
  const g = await ownGame(teacher.id, input.gameId);
  const folderId = optId.parse(input.folderId);
  if (folderId) await ownFolder(teacher.id, folderId);
  // A move is not an edit: keep updatedAt so open editors are not told about a newer version.
  await db.$executeRaw`UPDATE "Game" SET "folderId" = ${folderId} WHERE "id" = ${g.id}`;
  done();
}

export async function moveFolder(input: { id: string; parentId: string | null }) {
  const { teacher } = await requireTeacher();
  const f = await ownFolder(teacher.id, input.id);
  const parentId = optId.parse(input.parentId);
  if (parentId) {
    // Refuse to put a folder inside itself or inside one of its own subfolders.
    let cursor: string | null = parentId;
    for (let depth = 0; cursor && depth < 50; depth++) {
      if (cursor === f.id) throw new HttpError(400, "A folder can't go inside itself");
      cursor = (await ownFolder(teacher.id, cursor)).parentId;
    }
  }
  await db.activityFolder.update({ where: { id: f.id }, data: { parentId } });
  done();
}

/** Recycle Bin: an activity in the bin is archived (students can't open it); it can be restored. */
export async function trashGame(input: { gameId: string }) {
  const { user, teacher } = await requireTeacher();
  const g = await ownGame(teacher.id, input.gameId);
  await db.game.update({ where: { id: g.id }, data: { status: "ARCHIVED" } });
  await audit(user.schoolId, user.id, "game.archive", "Game", g.id);
  done();
  revalidatePath("/teacher/games");
}

export async function restoreGame(input: { gameId: string }) {
  const { user, teacher } = await requireTeacher();
  const g = await ownGame(teacher.id, input.gameId);
  // Its folder may have been deleted meanwhile (folderId is then null: top level).
  await db.game.update({ where: { id: g.id }, data: { status: "DRAFT" } });
  await audit(user.schoolId, user.id, "game.restore", "Game", g.id);
  done();
  revalidatePath("/teacher/games");
}

export async function emptyBin() {
  const { user, teacher } = await requireTeacher();
  const games = await db.game.findMany({ where: { teacherId: teacher.id, status: "ARCHIVED" }, select: { id: true, title: true } });
  await db.game.deleteMany({ where: { id: { in: games.map((g) => g.id) } } });
  for (const g of games) await audit(user.schoolId, user.id, "game.delete", "Game", g.id, { title: g.title });
  done();
  revalidatePath("/teacher/games");
}
