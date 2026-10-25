import { notFound } from "next/navigation";
import { GameEditor } from "@/components/editor/GameEditor";
import { requireTeacherPage } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { loadEditorGame } from "@/lib/games/service";
import { templateByKey } from "@/lib/games/templates";

export const metadata = { title: "Edit game" };

export default async function EditGame({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user } = await requireTeacherPage();
  const game = await loadEditorGame(user.schoolId, id).catch(() => null);
  if (!game) notFound();
  const template = templateByKey(game.templateKey)!;
  const categories = await db.category.findMany({ where: { schoolId: user.schoolId }, orderBy: [{ sortOrder: "asc" }, { nameEn: "asc" }], select: { id: true, nameEn: true, nameEs: true } });
  return <GameEditor initial={game} template={template} categories={categories} />;
}
