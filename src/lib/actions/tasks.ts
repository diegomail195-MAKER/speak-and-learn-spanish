"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ownedClassroom } from "@/lib/access";
import { audit } from "@/lib/audit";
import { requireStudent, requireTeacher } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { activityForStudent } from "@/lib/library/service";
import { dedupeRecipients } from "@/lib/tasks";

const taskSchema = z.object({
  classroomId: z.string().min(1),
  groupIds: z.array(z.string()).max(50).default([]),
  studentIds: z.array(z.string()).max(300).default([]),
  topicId: z.string().min(1, "Choose a topic."),
  resourceIds: z.array(z.string()).min(1, "Select at least one activity.").max(40),
  dueAt: z.string().optional(),
  instructions: z.string().trim().max(1000).default(""),
});

export type TaskResult = { error?: string; assignmentId?: string };

/**
 * Assign Task: one assignment with the topic's chosen activities, each pinned to its current
 * published version. A student picked individually who is also in a picked group is only
 * added once (through the group).
 */
export async function createTopicTask(input: unknown): Promise<TaskResult> {
  const { user, teacher } = await requireTeacher();
  const parsed = taskSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;
  const classroom = await ownedClassroom(teacher.id, d.classroomId);
  if (!d.groupIds.length && !d.studentIds.length) return { error: "Choose a group or at least one student." };

  const groups = await db.group.findMany({ where: { id: { in: d.groupIds }, level: { classroomId: classroom.id } }, include: { memberships: { select: { studentId: true } } } });
  if (groups.length !== new Set(d.groupIds).size) return { error: "A group isn't in this class." };
  const students = await db.student.count({ where: { id: { in: d.studentIds }, classroomId: classroom.id } });
  if (students !== new Set(d.studentIds).size) return { error: "A student isn't in this class." };
  const rec = dedupeRecipients(groups.map((g) => ({ id: g.id, memberIds: g.memberships.map((m) => m.studentId) })), d.studentIds);
  if (rec.studentCount === 0) return { error: "The chosen group has no students yet." };

  const topic = await db.topic.findFirst({ where: { id: d.topicId, status: "PUBLISHED" } });
  if (!topic) return { error: "Topic not found." };
  const links = await db.topicResource.findMany({
    where: { topicId: topic.id, resourceId: { in: d.resourceIds }, resource: { status: "PUBLISHED", currentVersionId: { not: null } } },
    include: { resource: { select: { id: true, currentVersionId: true } } },
    orderBy: { position: "asc" },
  });
  if (links.length !== new Set(d.resourceIds).size) return { error: "Some activities are no longer available. Reload the preview." };

  const dueAt = d.dueAt ? new Date(d.dueAt) : null;
  if (dueAt && Number.isNaN(dueAt.getTime())) return { error: "Invalid due date." };
  const a = await db.assignment.create({
    data: {
      schoolId: user.schoolId,
      teacherId: teacher.id,
      topicId: topic.id,
      title: `${topic.titleEs} · ${topic.titleEn}`,
      instructions: d.instructions,
      dueAt,
      recipients: {
        create: [...rec.groupIds.map((groupId) => ({ type: "GROUP" as const, groupId })), ...rec.studentIds.map((studentId) => ({ type: "STUDENT" as const, studentId }))],
      },
      activities: { create: links.map((l, i) => ({ resourceId: l.resource.id, versionId: l.resource.currentVersionId!, position: i })) },
    },
  });
  await audit(user.schoolId, user.id, "task.assign", "Assignment", a.id, { topic: topic.slug, groups: rec.groupIds.length, students: rec.studentIds.length, dropped: rec.dropped.length, activities: links.length });
  revalidatePath(`/teacher/classes/${classroom.id}`);
  return { assignmentId: a.id };
}

/** Student progress on an assigned library activity (only for their own tasks). */
export async function recordActivityProgress(input: { assignmentId: string; activityId: string; score?: number; total?: number }) {
  const { student } = await requireStudent();
  const d = z.object({ assignmentId: z.string(), activityId: z.string(), score: z.number().int().min(0).max(1000).optional(), total: z.number().int().min(0).max(1000).optional() }).parse(input);
  const { act } = await activityForStudent(student, d.assignmentId, d.activityId);
  await db.activityProgress.create({ data: { activityId: act.id, studentId: student.id, completedAt: new Date(), score: d.score ?? null, total: d.total ?? null } });
  revalidatePath(`/learn/tasks/${d.assignmentId}`);
  return { ok: true };
}
