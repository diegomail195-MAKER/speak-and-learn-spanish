import { notFound } from "next/navigation";
import { GamePlayer } from "@/components/player/GamePlayer";
import { ActivityStrip } from "@/components/player/flashcards/ActivityStrip";
import { requireTeacherPage } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { buildPlayGame } from "@/lib/games/service";
import { templateByKey } from "@/lib/games/templates";

export const metadata = { title: "Preview" };

// Teacher preview: same engine as students, with the diagnostics panel; nothing is saved.
// Flashcards also show the activity strip under the game (Edit Content, Printables, Assign).
export default async function PreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user } = await requireTeacherPage();
  const [first, ...rest] = user.displayName.split(/\s+/);
  const game = await buildPlayGame(user.schoolId, id, { firstName: first ?? "", lastName: rest.join(" ") }).catch(() => null);
  if (!game) notFound();
  if (game.board === "flashcards") game.practiceAudioUrl = `/api/games/${id}/practice-audio`;
  const row = await db.game.findFirst({ where: { id, schoolId: user.schoolId }, select: { status: true } });
  const below =
    game.board === "flashcards" ? (
      <ActivityStrip key="strip" game={game} role={user.role === "ADMIN" ? "ADMIN" : "TEACHER"} typeName={templateByKey(game.templateKey)?.name ?? "Flashcards"} status={row?.status as "DRAFT" | "PUBLISHED" | "ARCHIVED" | undefined} />
    ) : undefined;
  return <GamePlayer game={game} mode="preview" diagnostics exitHref={`/teacher/games/${id}/edit`} below={below} />;
}
