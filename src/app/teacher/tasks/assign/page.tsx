import { AssignTaskWizard } from "@/components/teacher/AssignTaskWizard";
import { PageHeader } from "@/components/ui/Panel";
import { requireTeacherPage } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { libraryTopics } from "@/lib/library/service";

export const metadata = { title: "Assign Task" };

export default async function AssignTaskPage({ searchParams }: { searchParams: Promise<{ classroomId?: string; topicId?: string; grade?: string }> }) {
  const { teacher } = await requireTeacherPage();
  const sp = await searchParams;
  const [classes, topics] = await Promise.all([
    db.classroom.findMany({
      where: { teacherId: teacher.id },
      orderBy: { createdAt: "asc" },
      include: {
        levels: { orderBy: { sortOrder: "asc" }, include: { groups: { orderBy: { name: "asc" }, include: { memberships: { select: { studentId: true } } } } } },
        students: { where: { active: true }, orderBy: { firstName: "asc" }, select: { id: true, firstName: true, lastInitial: true } },
      },
    }),
    libraryTopics(),
  ]);
  const data = classes.map((c) => ({
    id: c.id,
    name: c.name,
    groups: c.levels.flatMap((l) => l.groups.map((g) => ({ id: g.id, name: l.name === "Groups" ? g.name : `${l.name} · ${g.name}`, memberIds: g.memberships.map((m) => m.studentId) }))),
    students: c.students.map((s) => ({ id: s.id, name: `${s.firstName}${s.lastInitial ? ` ${s.lastInitial}.` : ""}` })),
  }));
  const topicData = topics.map((t) => ({
    id: t.id, slug: t.slug, titleEn: t.titleEn, titleEs: t.titleEs, category: t.category, color: t.color, art: t.art,
    resources: t.resources.map((r) => ({ id: r.resource.id, kind: r.resource.kind, title: r.resource.title, grades: r.resource.grades })),
  }));
  const initialClass = data.find((c) => c.id === sp.classroomId)?.id ?? data[0]?.id ?? "";
  return (
    <>
      <PageHeader eyebrow="Tasks" title="Assign Task" subtitle="Choose who gets it, pick a topic, preview its activities and choose the ones to assign." />
      {data.length === 0 ? (
        <p className="rounded-[22px] border-2 border-dashed border-line p-8 text-center font-bold text-ink-2">Create a class and add students first.</p>
      ) : (
        <AssignTaskWizard classes={data} topics={topicData} initialClassId={initialClass} initialTopicId={sp.topicId} initialGrade={sp.grade === "LOWER" || sp.grade === "UPPER" ? sp.grade : undefined} />
      )}
    </>
  );
}
