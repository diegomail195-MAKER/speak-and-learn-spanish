"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { requireTeacher } from "@/lib/auth/guards";
import { communityWhere, copyGameTo } from "@/lib/community";
import { db } from "@/lib/db";

// Community actions. Only the owner shares an activity; the owner or the platform admin can take
// it out of the Community. Anyone signed in as a teacher (or the admin) can copy a Community
// activity into their own My Activities, where the copy is theirs to edit.

type Result = { ok: true } | { ok: false; error: string };

const refresh = () => {
  for (const p of ["/teacher/my-activities", "/admin/my-activities", "/teacher/my-activities/community", "/admin/my-activities/community"]) revalidatePath(p);
};

export async function setCommunityShared(input: { gameId: string; shared: boolean }): Promise<Result> {
  const { user, teacher } = await requireTeacher();
  const gameId = z.string().min(1).max(40).parse(input.gameId);
  const shared = z.boolean().parse(input.shared);
  const g = await db.game.findUnique({ where: { id: gameId }, include: { _count: { select: { items: true } } } });
  const own = !!g && g.teacherId === teacher.id;
  // The owner can share and unshare; the platform admin can also take anyone's activity out.
  if (!g || !(own || (!shared && user.role === "ADMIN" && g.communitySharedAt))) return { ok: false, error: "Activity not found." };
  if (shared) {
    if (g.status === "ARCHIVED") return { ok: false, error: "Restore the activity from the Recycle Bin before sharing it." };
    if (!g.title.trim()) return { ok: false, error: "Give the activity a title before sharing it with the Community." };
    if (g._count.items === 0) return { ok: false, error: "Add at least one card before sharing it with the Community." };
  }
  // Raw SQL so the activity's "Modified" date stays as it is (Prisma would bump updatedAt): sharing is not an edit.
  await db.$executeRaw`UPDATE "Game" SET "communitySharedAt" = ${shared ? new Date() : null} WHERE "id" = ${g.id}`;
  await audit(user.schoolId, user.id, shared ? "game.community.share" : "game.community.unshare", "Game", g.id, own ? {} : { owner: g.teacherId, schoolId: g.schoolId });
  refresh();
  return { ok: true };
}

/** Copies a Community activity (or one of your own) into your My Activities and opens the copy in the editor. */
export async function copyFromCommunity(form: FormData) {
  const { user, teacher } = await requireTeacher();
  const gameId = z.string().min(1).max(40).parse(form.get("gameId"));
  const g = await db.game.findFirst({ where: { id: gameId, OR: [communityWhere, { teacherId: teacher.id }] }, select: { id: true } });
  const back = form.get("from") === "admin" ? "/admin/my-activities/community" : "/teacher/my-activities/community";
  if (!g) redirect(`${back}?gone=1`);
  const id = await copyGameTo(g.id, { schoolId: user.schoolId, teacherId: teacher.id });
  await audit(user.schoolId, user.id, "game.community.copy", "Game", id, { from: g.id });
  refresh();
  redirect(`${form.get("from") === "admin" ? "/admin" : "/teacher"}/games/${id}/edit`);
}
