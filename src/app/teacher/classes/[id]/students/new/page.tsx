import Link from "next/link";
import { AddStudentForm } from "@/components/teacher/StudentForms";
import { PageHeader, Panel } from "@/components/ui/Panel";
import { teacherClass } from "@/lib/class-page";
import { db } from "@/lib/db";

export const metadata = { title: "Add Student" };

export default async function AddStudentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { classroom } = await teacherClass(id);
  const levels = await db.level.findMany({ where: { classroomId: classroom.id }, include: { groups: { orderBy: { name: "asc" } } }, orderBy: { sortOrder: "asc" } });
  const groups = levels.flatMap((l) => l.groups.map((g) => ({ id: g.id, label: l.name === "Groups" ? g.name : `${l.name} · ${g.name}` })));
  return (
    <>
      <Link href={`/teacher/classes/${classroom.id}`} className="text-sm font-bold text-sky hover:underline">‹ {classroom.name}</Link>
      <PageHeader title="Add Student" subtitle="Only a first name and last initial are needed. The username is made for you; you can change it in the Roster." />
      <Panel className="max-w-2xl">
        <AddStudentForm classroomId={classroom.id} groups={groups} />
      </Panel>
    </>
  );
}
