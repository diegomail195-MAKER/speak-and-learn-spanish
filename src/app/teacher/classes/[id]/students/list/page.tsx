import Link from "next/link";
import { AddListForm } from "@/components/teacher/AddListForm";
import { PageHeader } from "@/components/ui/Panel";
import { teacherClass } from "@/lib/class-page";
import { db } from "@/lib/db";

export const metadata = { title: "Add List" };

export default async function AddListPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { classroom } = await teacherClass(id);
  const [roster, levels] = await Promise.all([
    db.student.findMany({ where: { classroomId: classroom.id }, select: { firstName: true, lastInitial: true, username: true } }),
    db.level.findMany({ where: { classroomId: classroom.id }, include: { groups: { orderBy: { name: "asc" } } }, orderBy: { sortOrder: "asc" } }),
  ]);
  const groups = levels.flatMap((l) => l.groups.map((g) => ({ id: g.id, label: l.name === "Groups" ? g.name : `${l.name} · ${g.name}` })));
  return (
    <>
      <Link href={`/teacher/classes/${classroom.id}`} className="text-sm font-bold text-sky hover:underline">‹ {classroom.name}</Link>
      <PageHeader title="Add List" subtitle="Paste one student per line (for example “Ana López” or “López, Ana”). Check the preview, fix anything highlighted, then save." />
      <AddListForm classroomId={classroom.id} roster={roster} groups={groups} />
    </>
  );
}
