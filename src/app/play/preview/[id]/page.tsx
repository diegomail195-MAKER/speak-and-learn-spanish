import { notFound } from "next/navigation";
import { GamePlayer } from "@/components/player/GamePlayer";
import { requireTeacherPage } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { buildPlayGame } from "@/lib/games/service";
import { montessoriSetup } from "@/lib/montessori/server";

export const metadata = { title: "Preview" };

// Teacher preview: same engine as students, with the diagnostics panel; nothing is saved.
export default async function PreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user } = await requireTeacherPage();
  const [first, ...rest] = user.displayName.split(/\s+/);
  const game = await buildPlayGame(user.schoolId, id, { firstName: first ?? "", lastName: rest.join(" ") }).catch(() => null);
  if (!game) notFound();
  const topic = (await db.game.findFirst({ where: { id, schoolId: user.schoolId }, select: { topic: true } }))?.topic ?? "";
  const feedback = await montessoriSetup(game, { topic });
  return <GamePlayer game={game} mode="preview" diagnostics exitHref={`/teacher/games/${id}/edit`} feedback={feedback} />;
}
