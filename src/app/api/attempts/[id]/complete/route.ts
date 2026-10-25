import { NextResponse } from "next/server";
import { z } from "zod";
import { handle } from "@/lib/api";
import { requireStudent } from "@/lib/auth/guards";
import { finalizeAttempt } from "@/lib/attempts/service";

export const POST = handle(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const { student } = await requireStudent();
  const { id } = await ctx.params;
  const body = z.object({ durationMs: z.number().int().min(0).max(1000 * 60 * 60 * 3), presented: z.number().int().min(0).max(500) }).parse(await req.json());
  const a = await finalizeAttempt(id, student.id, body);
  return NextResponse.json({ ok: true, independentCount: a.independentCount, questionsPresented: a.questionsPresented });
});
