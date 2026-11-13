import Link from "next/link";
import { notFound } from "next/navigation";
import { GroupForm } from "@/components/teacher/GroupForm";
import { PageHeader } from "@/components/ui/Panel";
import { teacherClass } from "@/lib/class-page";
import { db } from "@/lib/db";

export const metadata = { title: "Edit Group" };

export default async function EditGroupPage({ params }: { params: Promise<{ id: string; groupId: string }> }) {
  const { id, groupId } = await params;
  const { classroom } = await teacherClass(id);
  const group = await db.group.findFirst({ where: { id: groupId, level: { classroomId: classroom.id } }, include: { memberships: { select: { studentId: true } } } });
  if (!group) notFound();
  const students = await db.student.findMany({ where: { classroomId: classroom.id }, select: { id: true, firstName: true, lastInitial: true, username: true }, orderBy: { firstName: "asc" } });
  return (
    <>
      <Link href={`/teacher/classes/${classroom.id}`} className="text-sm font-bold text-sky hover:underline">‹ {classroom.name}</Link>
      <PageHeader title={`Edit group · ${group.name}`} subtitle="Rename the group or change who belongs to it." />
      <GroupForm classroomId={classroom.id} students={students} group={{ id: group.id, name: group.name, memberIds: group.memberships.map((m) => m.studentId) }} />
    </>
  );
}
