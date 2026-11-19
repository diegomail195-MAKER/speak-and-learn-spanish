import "server-only";
import { db } from "@/lib/db";
import { HttpError } from "@/lib/auth/guards";

// Ownership checks. Every teacher-side query goes through one of these so a teacher can only
// touch their own school's rows, and student-side queries only return what was assigned to them.

/**
 * Prisma filter: classes a teacher can work with — the ones they own and the ones they were added
 * to as co-teacher. Owners and co-teachers manage students, groups, tasks and progress; only the
 * owner archives the class or changes its co-teachers (ownClassroomStrict).
 */
export function classroomAccessWhere(teacherId: string) {
  return { OR: [{ teacherId }, { coTeachers: { some: { teacherId } } }] };
}

export async function ownedClassroom(teacherId: string, classroomId: string) {
  const c = await db.classroom.findFirst({ where: { id: classroomId, ...classroomAccessWhere(teacherId) } });
  if (!c) throw new HttpError(404, "Class not found");
  return c;
}

/** Only the teacher who owns the class (archive, co-teachers). */
export async function ownClassroomStrict(teacherId: string, classroomId: string) {
  const c = await db.classroom.findFirst({ where: { id: classroomId, teacherId } });
  if (!c) throw new HttpError(404, "Class not found");
  return c;
}

export async function ownedLevel(teacherId: string, levelId: string) {
  const l = await db.level.findFirst({ where: { id: levelId, classroom: classroomAccessWhere(teacherId) } });
  if (!l) throw new HttpError(404, "Level not found");
  return l;
}

export async function ownedGroup(teacherId: string, groupId: string) {
  const g = await db.group.findFirst({ where: { id: groupId, level: { classroom: classroomAccessWhere(teacherId) } }, include: { level: true } });
  if (!g) throw new HttpError(404, "Group not found");
  return g;
}

export async function ownedStudent(teacherId: string, studentId: string) {
  const s = await db.student.findFirst({ where: { id: studentId, classroom: classroomAccessWhere(teacherId) } });
  if (!s) throw new HttpError(404, "Student not found");
  return s;
}

export async function schoolGame(schoolId: string, gameId: string) {
  const g = await db.game.findFirst({ where: { id: gameId, schoolId } });
  if (!g) throw new HttpError(404, "Game not found");
  return g;
}

/** Prisma filter: assignments visible to a student (directly, via class, level or group). */
export function assignmentsForStudentWhere(student: { id: string; classroomId: string; schoolId: string }) {
  const now = new Date();
  return {
    schoolId: student.schoolId,
    active: true,
    startsAt: { lte: now },
    recipients: {
      some: {
        OR: [
          { type: "STUDENT" as const, studentId: student.id },
          { type: "CLASSROOM" as const, classroomId: student.classroomId },
          { type: "LEVEL" as const, level: { groups: { some: { memberships: { some: { studentId: student.id } } } } } },
          { type: "GROUP" as const, group: { memberships: { some: { studentId: student.id } } } },
        ],
      },
    },
  };
}

export async function assignmentForStudent(student: { id: string; classroomId: string; schoolId: string }, assignmentId: string) {
  const a = await db.assignment.findFirst({ where: { id: assignmentId, ...assignmentsForStudentWhere(student) } });
  if (!a) throw new HttpError(404, "Assignment not found");
  return a;
}

/**
 * Prisma filter: assignments a teacher can follow — their own, and those sent to a class they
 * own or co-teach (whole class, a level or group of it, or one of its students).
 */
export function assignmentsForTeacherWhere(teacherId: string) {
  const cls = classroomAccessWhere(teacherId);
  return {
    OR: [
      { teacherId },
      {
        recipients: {
          some: {
            OR: [{ classroom: cls }, { level: { classroom: cls } }, { group: { level: { classroom: cls } } }, { student: { classroom: cls } }],
          },
        },
      },
    ],
  };
}
