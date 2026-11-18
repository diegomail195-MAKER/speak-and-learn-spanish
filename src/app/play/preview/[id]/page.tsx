import { notFound } from "next/navigation";
import { GamePlayer } from "@/components/player/GamePlayer";
import { ActivityStrip, type StripAssignment } from "@/components/player/flashcards/ActivityStrip";
import { requireTeacherPage } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { buildPlayGame, readSettings } from "@/lib/games/service";
import type { SettingsData } from "@/components/player/flashcards/ActivitySettings";
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
// Rename). Other activities also list the teacher's assignments of it; flashcards don't.
export default async function PreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user, teacher } = await requireTeacherPage();
  const [first, ...rest] = user.displayName.split(/\s+/);
  const game = await buildPlayGame(user.schoolId, id, { firstName: first ?? "", lastName: rest.join(" ") }).catch(() => null);
  if (!game) notFound();
  if (game.board === "flashcards") game.practiceAudioUrl = `/api/games/${id}/practice-audio`;
  const [row, list] = await Promise.all([
    db.game.findFirst({ where: { id, schoolId: user.schoolId }, select: { status: true, templateKey: true, description: true, categoryId: true, topic: true, level: true, objective: true, difficulty: true, estimatedMinutes: true, language: true, settings: true } }),
    db.assignment.findMany({
      where: { gameId: id, teacherId: teacher.id },
      include: {
        recipients: { include: { classroom: true, level: true, group: { include: { level: true } }, student: true } },
        _count: { select: { attempts: { where: { completedAt: { not: null } } } } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);
  const categories = await db.category.findMany({ where: { schoolId: user.schoolId }, orderBy: [{ sortOrder: "asc" }, { nameEn: "asc" }], select: { id: true, nameEn: true, nameEs: true } });
  const st = readSettings(row?.settings ?? null);
  const settings: SettingsData | undefined = row
    ? {
        templateKey: row.templateKey,
        categories,
        values: {
          description: row.description,
          categoryId: row.categoryId,
          topic: row.topic,
          level: row.level,
          objective: row.objective,
          difficulty: row.difficulty,
          estimatedMinutes: row.estimatedMinutes,
          language: row.language as SettingsData["values"]["language"],
          settings: { acceptShortAnswer: st.acceptShortAnswer, voice: st.voice, voices: st.voices, rate: st.rate, maxTries: st.maxTries, options: st.options },
        },
      }
    : undefined;
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
      assignments={game.board === "flashcards" ? undefined : assignments}
      settings={settings}
    />
  );
  return <GamePlayer game={game} mode="preview" diagnostics exitHref={`/teacher/games/${id}/edit`} below={below} />;
}
