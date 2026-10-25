import { AssignForm } from "@/components/teacher/AssignForm";
import { PageHeader } from "@/components/ui/Panel";
import { requireTeacherPage } from "@/lib/auth/guards";
import { db } from "@/lib/db";

export const metadata = { title: "Assign" };

export default async function NewAssignment({ searchParams }: { searchParams: Promise<{ gameId?: string }> }) {
  const { gameId } = await searchParams;
  const { user, teacher } = await requireTeacherPage();
  const [games, classes] = await Promise.all([
    db.game.findMany({ where: { schoolId: user.schoolId, status: "PUBLISHED" }, select: { id: true, title: true }, orderBy: { updatedAt: "desc" } }),
    db.classroom.findMany({
      where: { teacherId: teacher.id },
      include: {
        levels: { orderBy: { sortOrder: "asc" }, include: { groups: { orderBy: { name: "asc" }, include: { _count: { select: { memberships: true } } } } } },
        students: { where: { active: true }, orderBy: { firstName: "asc" } },
      },
    }),
  ]);
  const tree = classes.map((c) => ({
    id: c.id,
    name: c.name,
    levels: c.levels.map((l) => ({ id: l.id, name: l.name, groups: l.groups.map((g) => ({ id: g.id, name: g.name, count: g._count.memberships })) })),
    students: c.students.map((s) => ({ id: s.id, name: `${s.firstName} ${s.lastInitial}`.trim() })),
  }));
  return (
    <>
      <PageHeader eyebrow="Assign" title="Assign an activity" subtitle="Send it to a whole class, a level, a group or individual students. They'll find it under My Activities." />
      <AssignForm games={games} tree={tree} gameId={gameId} />
    </>
  );
}
