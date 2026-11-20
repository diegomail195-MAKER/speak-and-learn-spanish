import { NextResponse } from "next/server";
import { z } from "zod";
import { handle } from "@/lib/api";
import { getSessionUser } from "@/lib/auth/session";
import { previewStep } from "@/lib/library/previewData";

// Preview › one resource of a topic (Platform Admin and teachers only). Access is checked on every
// request: the role, the scope (drafts only for administrators) and that the step belongs to the
// topic. Read-only: nothing is recorded for students.
const query = z.object({
  key: z.string().regex(/^[rg]:[\w-]{1,64}$/),
  scope: z.enum(["admin", "teacher"]).default("teacher"),
  grade: z.enum(["LOWER", "UPPER"]).nullish(),
});

export const GET = handle(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const sp = new URL(req.url).searchParams;
  const q = query.parse({ key: sp.get("key"), scope: sp.get("scope") ?? undefined, grade: sp.get("grade") || null });
  const step = await previewStep(await getSessionUser(), q.scope, id, q.key, q.grade ?? null);
  return NextResponse.json({ step }, { headers: { "Cache-Control": "no-store" } });
});
