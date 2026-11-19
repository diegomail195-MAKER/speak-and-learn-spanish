import "server-only";
import { db } from "@/lib/db";

// Topic tasks of one class, with who received each one and how far each student got. The caller
// has already checked that the teacher owns or co-teaches the class, so every teacher of the class
// sees the same tasks (whoever assigned them).
export async function classTasks(classroomId: string) {
  const tasks = await db.assignment.findMany({
    where: {
      topicId: { not: null },
      recipients: { some: { OR: [{ group: { level: { classroomId } } }, { student: { classroomId } }, { classroomId }] } },
    },
    include: {
      recipients: { include: { group: { include: { memberships: { select: { studentId: true } } } } } },
      activities: { select: { id: true, progress: { where: { completedAt: { not: null } }, select: { studentId: true } } } },
      topic: { select: { titleEn: true, titleEs: true, color: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return tasks.map((t) => {
    const students = new Set<string>();
    for (const r of t.recipients) {
      if (r.studentId) students.add(r.studentId);
      r.group?.memberships.forEach((m) => students.add(m.studentId));
    }
    const doneBy = new Map<string, number>();
    for (const a of t.activities) {
      for (const sid of new Set(a.progress.map((p) => p.studentId))) doneBy.set(sid, (doneBy.get(sid) ?? 0) + 1);
    }
    const total = t.activities.length;
    const pct = (sid: string) => (total ? Math.round(((doneBy.get(sid) ?? 0) / total) * 100) : 0);
    return { id: t.id, title: t.title, topic: t.topic, dueAt: t.dueAt, active: t.active, total, students, pct };
  });
}
