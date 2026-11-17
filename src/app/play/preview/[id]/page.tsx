import { notFound } from "next/navigation";
import { GamePlayer } from "@/components/player/GamePlayer";
import { ActivityStrip, type StripAssignment } from "@/components/player/flashcards/ActivityStrip";
import { requireTeacherPage } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { buildPlayGame } from "@/lib/games/service";
import { templateByKey } from "@/lib/games/templates";

export const metadata = { title: "Preview" };

function recipientLabel(r: { type: string; classroom: { name: string } | null; level: { name: string } | null; group: { name: string; level: { name: string } } | null; student: { firstName: string; lastInitial: string } | null }) {
  if (r.type === "CLASSROOM") return r.classroom?.name ?? "Class";
  if (r.type === "LEVEL") return `Level ${r.level?.name}`;
  if (r.type === "GROUP") return `${r.group?.level.name} ${r.group?.name}`;
  return `${r.student?.firstName} ${r.student?.lastInitial}`.trim();
}

// Teacher preview: same engine as students, with the diagnostics panel; nothing is saved.
// Every activity shows the bar under the game (Edit Content, Print Worksheet, Set Assignment,
// Rename) and the teacher's assignments of it.
export default async function PreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user, teacher } = await requireTeacherPage();
  const [first, ...rest] = user.displayName.split(/\s+/);
  const game = await buildPlayGame(user.schoolId, id, { firstName: first ?? "", lastName: rest.join(" ") }).catch(() => null);
  if (!game) notFound();
  if (game.board === "flashcards") game.practiceAudioUrl = `/api/games/${id}/practice-audio`;
  const [row, list] = await Promise.all([
    db.game.findFirst({ where: { id, schoolId: user.schoolId }, select: { status: true } }),
    db.assignment.findMany({
      where: { gameId: id, teacherId: teacher.id },
      include: {
        recipients: { include: { classroom: true, level: true, group: { include: { level: true } }, student: true } },
        _count: { select: { attempts: { where: { completedAt: { not: null } } } } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);
  const assignments: StripAssignment[] = list.map((a) => ({
    id: a.id,
    who: a.recipients.map(recipientLabel).join(", "),
    due: a.dueAt ? `due ${a.dueAt.toLocaleDateString("en-US", { month: "short", day: "numeric" })}` : "no due date",
    active: a.active,
    completed: a._count.attempts,
  }));
  const below = (
    <ActivityStrip
      key="strip"
      game={game}
      role={user.role === "ADMIN" ? "ADMIN" : "TEACHER"}
      typeName={templateByKey(game.templateKey)?.name ?? "Activity"}
      status={row?.status as "DRAFT" | "PUBLISHED" | "ARCHIVED" | undefined}
      assignments={assignments}
    />
  );
  return <GamePlayer game={game} mode="preview" diagnostics exitHref={`/teacher/games/${id}/edit`} below={below} />;
}
