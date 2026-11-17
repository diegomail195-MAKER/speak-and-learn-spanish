import { AssignTaskWizard } from "@/components/teacher/AssignTaskWizard";
import { ButtonLink } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/Panel";
import { requireTeacherPage } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { libraryTopics } from "@/lib/library/service";
import { teacherTopicSteps } from "@/lib/library/steps";

export const metadata = { title: "Assign Task" };

export default async function AssignTaskPage({ searchParams }: { searchParams: Promise<{ classroomId?: string; topicId?: string; grade?: string; only?: string }> }) {
  const { user, teacher } = await requireTeacherPage();
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
  // Each topic's steps in this teacher's lesson order (library items and their own activities).
  const topicData = await Promise.all(
    topics.map(async (t) => {
      const { steps } = await teacherTopicSteps({ id: teacher.id, schoolId: user.schoolId }, t.id);
      return {
        id: t.id, slug: t.slug, titleEn: t.titleEn, titleEs: t.titleEs, category: t.category, color: t.color, art: t.art,
        resources: steps.map((s) => ({ id: s.key, kind: s.kind, title: s.title, grades: s.grades ?? ["LOWER", "UPPER"], href: s.resourceId ? `/teacher/library/resources/${s.resourceId}` : `/play/preview/${s.gameId}` })),
      };
    }),
  );
  const initialClass = data.find((c) => c.id === sp.classroomId)?.id ?? data[0]?.id ?? "";
  return (
    <>
      <PageHeader eyebrow="Tasks" title="Assign Task" subtitle="Choose who gets it, pick a topic, preview its activities and choose the ones to assign." />
      <div data-testid="assign-own" className="mb-6 flex flex-wrap items-center gap-3 rounded-xl2 border border-line bg-card px-4 py-3">
        <span className="flex-1 text-sm">
          <strong>Want to assign one of your own activities</strong> (flashcards, games, videos)? Choose it from your list.
        </span>
        <ButtonLink href="/teacher/assignments/new">Assign one of my activities</ButtonLink>
      </div>
      {data.length === 0 ? (
        <p className="rounded-[22px] border-2 border-dashed border-line p-8 text-center font-bold text-ink-2">Create a class and add students first.</p>
      ) : (
        <AssignTaskWizard classes={data} topics={topicData} initialClassId={initialClass} initialTopicId={sp.topicId} initialGrade={sp.grade === "LOWER" || sp.grade === "UPPER" ? sp.grade : undefined} initialOnly={sp.only} />
      )}
    </>
  );
}
