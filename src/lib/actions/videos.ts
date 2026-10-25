"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { HttpError, requireTeacher } from "@/lib/auth/guards";
import { db } from "@/lib/db";

async function schoolVideo(schoolId: string, id: string) {
  const v = await db.video.findFirst({ where: { id, schoolId } });
  if (!v) throw new HttpError(404, "Video not found");
  return v;
}

export async function setVideoStatus(form: FormData) {
  const { user } = await requireTeacher();
  const v = await schoolVideo(user.schoolId, String(form.get("videoId")));
  const status = z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).parse(form.get("status"));
  await db.video.update({ where: { id: v.id }, data: { status } });
  await audit(user.schoolId, user.id, `video.${status.toLowerCase()}`, "Video", v.id);
  revalidatePath("/teacher/videos");
}

export async function deleteVideo(form: FormData) {
  const { user } = await requireTeacher();
  const v = await schoolVideo(user.schoolId, String(form.get("videoId")));
  if (form.get("confirm") !== "DELETE") throw new Error("Confirmation required");
  await db.video.delete({ where: { id: v.id } });
  await audit(user.schoolId, user.id, "video.delete", "Video", v.id, { title: v.title });
  revalidatePath("/teacher/videos");
}

export async function createCollection(form: FormData) {
  const { user } = await requireTeacher();
  const d = z.object({ title: z.string().trim().min(1).max(120), description: z.string().max(1000).default("") }).parse(Object.fromEntries(form));
  const c = await db.collection.create({ data: { schoolId: user.schoolId, ...d } });
  await audit(user.schoolId, user.id, "collection.create", "Collection", c.id);
  redirect(`/teacher/videos/collections/${c.id}`);
}

async function schoolCollection(schoolId: string, id: string) {
  const c = await db.collection.findFirst({ where: { id, schoolId }, include: { videos: { orderBy: { position: "asc" } } } });
  if (!c) throw new HttpError(404, "Collection not found");
  return c;
}

export async function addToCollection(form: FormData) {
  const { user } = await requireTeacher();
  const c = await schoolCollection(user.schoolId, String(form.get("collectionId")));
  const v = await schoolVideo(user.schoolId, String(form.get("videoId")));
  if (!c.videos.some((x) => x.videoId === v.id)) {
    await db.collectionVideo.create({ data: { collectionId: c.id, videoId: v.id, position: c.videos.length } });
  }
  revalidatePath(`/teacher/videos/collections/${c.id}`);
}

export async function removeFromCollection(form: FormData) {
  const { user } = await requireTeacher();
  const c = await schoolCollection(user.schoolId, String(form.get("collectionId")));
  await db.collectionVideo.deleteMany({ where: { collectionId: c.id, videoId: String(form.get("videoId")) } });
  const rest = c.videos.filter((x) => x.videoId !== form.get("videoId"));
  await db.$transaction(rest.map((x, i) => db.collectionVideo.update({ where: { collectionId_videoId: { collectionId: c.id, videoId: x.videoId } }, data: { position: i } })));
  revalidatePath(`/teacher/videos/collections/${c.id}`);
}

export async function moveInCollection(form: FormData) {
  const { user } = await requireTeacher();
  const c = await schoolCollection(user.schoolId, String(form.get("collectionId")));
  const i = c.videos.findIndex((x) => x.videoId === form.get("videoId"));
  const j = i + (form.get("dir") === "up" ? -1 : 1);
  if (i < 0 || j < 0 || j >= c.videos.length) return;
  const order = [...c.videos];
  [order[i], order[j]] = [order[j], order[i]];
  await db.$transaction(order.map((x, k) => db.collectionVideo.update({ where: { collectionId_videoId: { collectionId: c.id, videoId: x.videoId } }, data: { position: k } })));
  revalidatePath(`/teacher/videos/collections/${c.id}`);
}

export async function deleteCollection(form: FormData) {
  const { user } = await requireTeacher();
  const c = await schoolCollection(user.schoolId, String(form.get("collectionId")));
  if (form.get("confirm") !== "yes") throw new Error("Confirmation required");
  await db.collection.delete({ where: { id: c.id } });
  await audit(user.schoolId, user.id, "collection.delete", "Collection", c.id);
  redirect("/teacher/videos/collections");
}
