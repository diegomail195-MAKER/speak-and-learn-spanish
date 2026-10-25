import { NextResponse } from "next/server";
import { handle } from "@/lib/api";
import { audit } from "@/lib/audit";
import { requireTeacher } from "@/lib/auth/guards";
import { publishGame } from "@/lib/games/service";

export const POST = handle(async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const { user } = await requireTeacher();
  const { id } = await ctx.params;
  const r = await publishGame(user.schoolId, user.id, id);
  if (r.ok) await audit(user.schoolId, user.id, "game.publish", "Game", id);
  return NextResponse.json(r, { status: r.ok ? 200 : 422 });
});
