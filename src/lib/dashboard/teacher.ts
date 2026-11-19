import "server-only";
import { assignmentsForTeacherWhere, classroomAccessWhere } from "@/lib/access";
import { db } from "@/lib/db";

// Teacher Dashboard data. Every query is scoped on the server to the classes the teacher owns or
// co-teaches (classroomAccessWhere) and the assignments they can follow (assignmentsForTeacherWhere).

const startOfToday = () => {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
};

/** Open assignments: active, already started, and not past their due date. */
export function openAssignmentWhere() {
  return { active: true, startsAt: { lte: new Date() }, OR: [{ dueAt: null }, { dueAt: { gte: startOfToday() } }] };
}

export async function teacherClasses(teacherId: string, opts: { archived?: boolean } = {}) {
  return db.classroom.findMany({
    where: { ...classroomAccessWhere(teacherId), archivedAt: opts.archived ? { not: null } : null },
    orderBy: [{ name: "asc" }],
    include: {
      _count: { select: { students: { where: { active: true } } } },
      teacher: { select: { id: true, user: { select: { displayName: true } } } },
      coTeachers: { select: { teacherId: true } },
    },
  });
}

export async function teacherStats(teacherId: string) {
  const cls = { ...classroomAccessWhere(teacherId), archivedAt: null };
  const weekAgo = new Date(Date.now() - 7 * 86_400_000);
  const visible = assignmentsForTeacherWhere(teacherId);
  const [classes, students, active, completedSteps, completedGames] = await Promise.all([
    db.classroom.count({ where: cls }),
    // A student belongs to exactly one class, so counting students (not group memberships) never
    // counts anyone twice, even when they are in several groups.
    db.student.count({ where: { active: true, classroom: cls } }),
    db.assignment.count({ where: { AND: [visible, openAssignmentWhere()] } }),
    db.activityProgress.count({ where: { completedAt: { gte: weekAgo }, activity: { assignment: visible }, student: { classroom: cls } } }),
    db.studentAttempt.count({ where: { completedAt: { gte: weekAgo }, assignment: visible, student: { classroom: cls } } }),
  ]);
  return { classes, students, active, completedThisWeek: completedSteps + completedGames };
}

type RecipientRow = {
  type: string;
  classroomId: string | null;
  studentId: string | null;
  classroom: { name: string; students: Array<{ id: string }> } | null;
  level: { name: string; classroom: { name: string }; groups: Array<{ memberships: Array<{ studentId: string }> }> } | null;
  group: { name: string; level: { name: string; classroom: { name: string } }; memberships: Array<{ studentId: string }> } | null;
  student: { firstName: string; lastInitial: string; classroom: { name: string } } | null;
};

const groupName = (level: string, group: string) => (level === "Groups" ? group : `${level} ${group}`);

/** Everyone an assignment reaches (each student once) and a short "class — group" label. */
export function recipientsOf(recipients: RecipientRow[]) {
  const students = new Set<string>();
  const labels: string[] = [];
  for (const r of recipients) {
    if (r.type === "CLASSROOM" && r.classroom) {
      r.classroom.students.forEach((s) => students.add(s.id));
      labels.push(r.classroom.name);
    } else if (r.type === "LEVEL" && r.level) {
      r.level.groups.forEach((g) => g.memberships.forEach((m) => students.add(m.studentId)));
      labels.push(`${r.level.classroom.name} · ${r.level.name}`);
    } else if (r.type === "GROUP" && r.group) {
      r.group.memberships.forEach((m) => students.add(m.studentId));
      labels.push(`${r.group.level.classroom.name} · ${groupName(r.group.level.name, r.group.name)}`);
    } else if (r.type === "STUDENT" && r.studentId && r.student) {
      students.add(r.studentId);
      labels.push(`${r.student.firstName}${r.student.lastInitial ? ` ${r.student.lastInitial}.` : ""}`);
    }
  }
  const label = labels.length > 2 ? `${labels.slice(0, 2).join(", ")} +${labels.length - 2}` : labels.join(", ");
  return { students, label };
}

export const recipientInclude = {
  classroom: { select: { name: true, students: { where: { active: true }, select: { id: true } } } },
  level: { select: { name: true, classroom: { select: { name: true } }, groups: { select: { memberships: { select: { studentId: true } } } } } },
  group: { select: { name: true, level: { select: { name: true, classroom: { select: { name: true } } } }, memberships: { select: { studentId: true } } } },
  student: { select: { firstName: true, lastInitial: true, classroom: { select: { name: true } } } },
} as const;

export type AssignmentSummary = {
  id: string;
  href: string;
  title: string;
  who: string;
  dueAt: Date | null;
  completed: number;
  total: number;
  steps: number;
  status: "Open" | "Overdue" | "Closed" | "Completed" | "Scheduled";
  mine: boolean;
};

/**
 * Topic assignments (and single activities) the teacher can follow, with how many of the students
 * who received each one finished it. A Topic task counts a student when every step is done; a
 * single activity when they completed an attempt.
 */
export async function assignmentSummaries(teacherId: string, opts: { take?: number; onlyOpen?: boolean; classroomId?: string } = {}): Promise<AssignmentSummary[]> {
  const visible = assignmentsForTeacherWhere(teacherId);
  const classFilter = opts.classroomId
    ? { recipients: { some: { OR: [{ classroomId: opts.classroomId }, { level: { classroomId: opts.classroomId } }, { group: { level: { classroomId: opts.classroomId } } }, { student: { classroomId: opts.classroomId } }] } } }
    : {};
  const list = await db.assignment.findMany({
    where: { AND: [visible, classFilter, ...(opts.onlyOpen ? [openAssignmentWhere()] : [])] },
    orderBy: [{ dueAt: { sort: "asc", nulls: "last" } }, { createdAt: "desc" }],
    take: opts.take,
    include: {
      topic: { select: { titleEs: true, titleEn: true } },
      game: { select: { title: true } },
      video: { select: { title: true } },
      collection: { select: { title: true } },
      recipients: { include: recipientInclude },
      activities: { select: { id: true, progress: { where: { completedAt: { not: null } }, select: { studentId: true } } } },
      attempts: { where: { completedAt: { not: null } }, select: { studentId: true } },
    },
  });
  const today = startOfToday();
  return list.map((a) => {
    const { students, label } = recipientsOf(a.recipients as unknown as RecipientRow[]);
    let completed = 0;
    if (a.topicId) {
      const doneBy = new Map<string, number>();
      for (const act of a.activities) for (const sid of new Set(act.progress.map((p) => p.studentId))) doneBy.set(sid, (doneBy.get(sid) ?? 0) + 1);
      for (const sid of students) if (a.activities.length > 0 && (doneBy.get(sid) ?? 0) >= a.activities.length) completed++;
    } else {
      const done = new Set(a.attempts.map((t) => t.studentId));
      for (const sid of students) if (done.has(sid)) completed++;
    }
    const total = students.size;
    const status: AssignmentSummary["status"] = !a.active
      ? "Closed"
      : total > 0 && completed === total
        ? "Completed"
        : a.startsAt > new Date()
          ? "Scheduled"
          : a.dueAt && a.dueAt < today
            ? "Overdue"
            : "Open";
    return {
      id: a.id,
      href: a.topicId ? `/teacher/tasks/${a.id}` : `/teacher/assignments/${a.id}`,
      title: a.topic?.titleEs ?? (a.game?.title || a.video?.title || a.collection?.title || a.title || "Activity"),
      who: label || "—",
      dueAt: a.dueAt,
      completed,
      total,
      steps: a.activities.length,
      status,
      mine: a.teacherId === teacherId,
    };
  });
}
