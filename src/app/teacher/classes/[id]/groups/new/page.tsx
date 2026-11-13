import Link from "next/link";
import { GroupForm } from "@/components/teacher/GroupForm";
import { PageHeader } from "@/components/ui/Panel";
import { teacherClass } from "@/lib/class-page";
import { db } from "@/lib/db";

export const metadata = { title: "Create Group" };

export default async function NewGroupPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { classroom } = await teacherClass(id);
  const [students, levels] = await Promise.all([
    db.student.findMany({ where: { classroomId: classroom.id }, select: { id: true, firstName: true, lastInitial: true, username: true }, orderBy: { firstName: "asc" } }),
    db.level.findMany({ where: { classroomId: classroom.id }, select: { id: true, name: true }, orderBy: { sortOrder: "asc" } }),
  ]);
  return (
    <>
      <Link href={`/teacher/classes/${classroom.id}`} className="text-sm font-bold text-sky hover:underline">‹ {classroom.name}</Link>
      <PageHeader title="Create Group" subtitle="Give the group its own name and choose who is in it. You can change both later." />
      <GroupForm classroomId={classroom.id} students={students} levels={levels} />
    </>
  );
}
