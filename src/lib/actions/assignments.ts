"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { ownedClassroom, ownedGroup, ownedLevel, ownedStudent, schoolGame } from "@/lib/access";
import { audit } from "@/lib/audit";
import { requireTeacher } from "@/lib/auth/guards";
import { db } from "@/lib/db";

export type AssignState = { error?: string } | undefined;

const schema = z.object({
  // "game:ID" | "video:ID" | "collection:ID"
  activity: z.string().regex(/^(game|video|collection):\S+$/, "Choose an activity."),
  instructions: z.string().max(1000).default(""),
  startsAt: z.string().optional(),
  dueAt: z.string().optional(),
  maxAttempts: z.string().optional(),
});

export async function createAssignment(_: AssignState, form: FormData): Promise<AssignState> {
  const { user, teacher } = await requireTeacher();
  const parsed = schema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;
  const [kind, activityId] = d.activity.split(":") as ["game" | "video" | "collection", string];
  const target: { gameId?: string; videoId?: string; collectionId?: string } = {};
  if (kind === "game") {
    const game = await schoolGame(user.schoolId, activityId);
    if (game.status !== "PUBLISHED") return { error: "Publish the game before assigning it." };
    target.gameId = game.id;
  } else if (kind === "video") {
    const video = await db.video.findFirst({ where: { id: activityId, schoolId: user.schoolId } });
    if (!video) return { error: "Video not found." };
    if (video.status !== "PUBLISHED") return { error: "Publish the video before assigning it." };
    target.videoId = video.id;
  } else {
    const c = await db.collection.findFirst({ where: { id: activityId, schoolId: user.schoolId }, include: { videos: { include: { video: { select: { status: true } } } } } });
    if (!c) return { error: "Collection not found." };
    if (!c.videos.some((v) => v.video.status === "PUBLISHED")) return { error: "Add at least one published video to the collection first." };
    target.collectionId = c.id;
  }

  // Recipients arrive as "TYPE:id" values; each is ownership-checked.
  const raw = form.getAll("recipient").map(String);
  if (raw.length === 0) return { error: "Choose who should get this activity." };
  const recipients: Array<{ type: "CLASSROOM" | "LEVEL" | "GROUP" | "STUDENT"; classroomId?: string; levelId?: string; groupId?: string; studentId?: string }> = [];
  for (const r of raw) {
    const [type, id] = r.split(":");
    if (type === "CLASSROOM") recipients.push({ type, classroomId: (await ownedClassroom(teacher.id, id)).id });
    else if (type === "LEVEL") recipients.push({ type, levelId: (await ownedLevel(teacher.id, id)).id });
    else if (type === "GROUP") recipients.push({ type, groupId: (await ownedGroup(teacher.id, id)).id });
    else if (type === "STUDENT") recipients.push({ type, studentId: (await ownedStudent(teacher.id, id)).id });
  }
  const startsAt = d.startsAt ? new Date(d.startsAt) : new Date();
  const dueAt = d.dueAt ? new Date(d.dueAt) : null;
  if (dueAt && dueAt < startsAt) return { error: "The due date must be after the start date." };
  const maxAttempts = d.maxAttempts ? Number(d.maxAttempts) : null;

  const a = await db.assignment.create({
    data: {
      schoolId: user.schoolId,
      teacherId: teacher.id,
      ...target,
      instructions: d.instructions.trim(),
      startsAt,
      dueAt,
      maxAttempts: maxAttempts && maxAttempts > 0 ? maxAttempts : null,
      recipients: { create: recipients },
    },
  });
  await audit(user.schoolId, user.id, "assignment.create", "Assignment", a.id, { recipients: raw });
  redirect(`/teacher/assignments/${a.id}`);
}

export async function setAssignmentActive(form: FormData) {
  const { user, teacher } = await requireTeacher();
  const a = await db.assignment.findFirstOrThrow({ where: { id: String(form.get("assignmentId")), teacherId: teacher.id } });
  const active = form.get("active") === "true";
  await db.assignment.update({ where: { id: a.id }, data: { active } });
  await audit(user.schoolId, user.id, active ? "assignment.reopen" : "assignment.close", "Assignment", a.id);
  revalidatePath(`/teacher/assignments/${a.id}`);
  revalidatePath("/teacher/assignments");
}
