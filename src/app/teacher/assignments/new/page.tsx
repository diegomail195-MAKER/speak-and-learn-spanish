import { AssignForm } from "@/components/teacher/AssignForm";
import { classroomAccessWhere } from "@/lib/access";
import { ButtonLink } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/Panel";
import { requireTeacherPage } from "@/lib/auth/guards";
import { db } from "@/lib/db";

export const metadata = { title: "Assign" };

export default async function NewAssignment({ searchParams }: { searchParams: Promise<{ gameId?: string; videoId?: string; collectionId?: string }> }) {
  const { gameId, videoId, collectionId } = await searchParams;
  const initial = gameId ? `game:${gameId}` : videoId ? `video:${videoId}` : collectionId ? `collection:${collectionId}` : undefined;
  const { user, teacher } = await requireTeacherPage();
  const [games, videos, collections, classes] = await Promise.all([
    db.game.findMany({ where: { schoolId: user.schoolId, status: "PUBLISHED" }, select: { id: true, title: true, templateKey: true, settings: true }, orderBy: { updatedAt: "desc" } }),
    db.video.findMany({ where: { schoolId: user.schoolId, status: "PUBLISHED" }, select: { id: true, title: true }, orderBy: { updatedAt: "desc" } }),
    db.collection.findMany({ where: { schoolId: user.schoolId, videos: { some: { video: { status: "PUBLISHED" } } } }, select: { id: true, title: true }, orderBy: { createdAt: "desc" } }),
    db.classroom.findMany({
      where: { ...classroomAccessWhere(teacher.id), archivedAt: null },
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
  const gameOptions = games.map((g) => ({
    id: g.id,
    title: g.title || "Untitled activity",
    flashcards: g.templateKey === "FLASHCARDS",
    repeat: (g.settings as { options?: { practiceMissed?: boolean } } | null)?.options?.practiceMissed !== false,
  }));
  return (
    <>
      <PageHeader
        eyebrow="Assign"
        title="Assign an activity"
        subtitle="Send one of your activities to a whole class, a level, a group or individual students. Students see it in their portal right away."
        actions={<ButtonLink href="/teacher/tasks/assign" variant="secondary">Assign a Library topic instead</ButtonLink>}
      />
      <AssignForm games={gameOptions} videos={videos} collections={collections} tree={tree} initial={initial} />
    </>
  );
}
