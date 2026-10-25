import "server-only";
import { db } from "@/lib/db";
import { HttpError } from "@/lib/auth/guards";

// Ownership checks. Every teacher-side query goes through one of these so a teacher can only
// touch their own school's rows, and student-side queries only return what was assigned to them.

export async function ownedClassroom(teacherId: string, classroomId: string) {
  const c = await db.classroom.findFirst({ where: { id: classroomId, teacherId } });
  if (!c) throw new HttpError(404, "Class not found");
  return c;
}

export async function ownedLevel(teacherId: string, levelId: string) {
  const l = await db.level.findFirst({ where: { id: levelId, classroom: { teacherId } } });
  if (!l) throw new HttpError(404, "Level not found");
  return l;
}

export async function ownedGroup(teacherId: string, groupId: string) {
  const g = await db.group.findFirst({ where: { id: groupId, level: { classroom: { teacherId } } }, include: { level: true } });
  if (!g) throw new HttpError(404, "Group not found");
  return g;
}

export async function ownedStudent(teacherId: string, studentId: string) {
  const s = await db.student.findFirst({ where: { id: studentId, classroom: { teacherId } } });
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
