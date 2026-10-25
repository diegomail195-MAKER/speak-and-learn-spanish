import { NextResponse } from "next/server";
import { handle } from "@/lib/api";
import { requireTeacher } from "@/lib/auth/guards";
import { loadEditorGame, saveEditorGame, saveSchema } from "@/lib/games/service";

type Ctx = { params: Promise<{ id: string }> };

export const GET = handle(async (_req: Request, ctx: Ctx) => {
  const { user } = await requireTeacher();
  return NextResponse.json(await loadEditorGame(user.schoolId, (await ctx.params).id));
});

export const PUT = handle(async (req: Request, ctx: Ctx) => {
  const { user } = await requireTeacher();
  const { id } = await ctx.params;
  await saveEditorGame(user.schoolId, id, saveSchema.parse(await req.json()));
  return NextResponse.json({ ok: true });
});
