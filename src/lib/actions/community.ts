"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { requireTeacher } from "@/lib/auth/guards";
import { communityWhere, copyGameTo } from "@/lib/community";
import { db } from "@/lib/db";

// Community actions. Every teacher's activities are in the Community automatically. Anyone signed in
// as a teacher (or the admin) can copy one into their own My Activities, where the copy is theirs to edit.

const refresh = () => {
  for (const p of ["/teacher/my-activities", "/admin/my-activities", "/teacher/my-activities/community", "/admin/my-activities/community"]) revalidatePath(p);
};

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
