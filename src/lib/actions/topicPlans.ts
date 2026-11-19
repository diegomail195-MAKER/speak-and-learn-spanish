"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ownedClassroom } from "@/lib/access";
import { audit } from "@/lib/audit";
import { requireTeacher } from "@/lib/auth/guards";
import { db } from "@/lib/db";

const key = z.string().regex(/^[rg]:[\w-]{1,64}$/);

/**
 * Saves a teacher's lesson order for a Library topic: the steps in order (library resources of the
 * topic and the teacher's own published activities) and the library resources they removed.
 * With a class, it is the setup confirmed for that class (only the teacher who owns the class);
 * assigning the topic to that class uses it. Assignments already made keep their own copy of the
 * order and their progress.
 */
export async function saveTopicPlan(input: { topicId: string; steps: string[]; hidden: string[]; classroomId?: string }): Promise<{ ok: true } | { ok: false; error: string }> {
  const { user, teacher } = await requireTeacher();
  const parsed = z.object({ topicId: z.string().min(1), steps: z.array(key).max(80), hidden: z.array(key).max(200), classroomId: z.string().max(64).default("") }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "Couldn't save this order." };
  const d = parsed.data;
  if (d.classroomId) {
    try {
      await ownedClassroom(teacher.id, d.classroomId);
    } catch {
      return { ok: false, error: "You can only set up your own classes." };
    }
  }
  const topic = await db.topic.findFirst({ where: { id: d.topicId, status: "PUBLISHED" }, select: { id: true, slug: true } });
  if (!topic) return { ok: false, error: "Topic not found." };
  const steps = [...new Set(d.steps)];
  const resIds = steps.filter((k) => k.startsWith("r:")).map((k) => k.slice(2));
  const gameIds = steps.filter((k) => k.startsWith("g:")).map((k) => k.slice(2));
  const [okRes, okGames] = await Promise.all([
    db.topicResource.count({ where: { topicId: topic.id, resourceId: { in: resIds } } }),
    db.game.count({ where: { id: { in: gameIds }, schoolId: user.schoolId, status: "PUBLISHED" } }),
  ]);
  if (okRes !== resIds.length || okGames !== gameIds.length) return { ok: false, error: "Some activities are no longer available. Reload the page." };
  const hidden = [...new Set(d.hidden.filter((k) => k.startsWith("r:") && !steps.includes(k)))];
  await db.topicPlan.upsert({
    where: { teacherId_topicId_classroomId: { teacherId: teacher.id, topicId: topic.id, classroomId: d.classroomId } },
    create: { teacherId: teacher.id, topicId: topic.id, classroomId: d.classroomId, steps, hidden },
    update: { steps, hidden },
  });
  await audit(user.schoolId, user.id, "topic.plan", "Topic", topic.id, { steps: steps.length, hidden: hidden.length, classroomId: d.classroomId || null });
  revalidatePath(`/teacher/library/topics/${topic.slug}`);
  return { ok: true };
}
