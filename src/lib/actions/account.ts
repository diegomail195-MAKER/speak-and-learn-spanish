"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { requireTeacher } from "@/lib/auth/guards";
import { db } from "@/lib/db";

export type AccountState = { error?: string; message?: string } | undefined;

/** My Account: the teacher's display name (shown to students and on the dashboard). */
export async function updateProfile(_: AccountState, form: FormData): Promise<AccountState> {
  const { user } = await requireTeacher();
  const name = z.string().trim().min(2, "Write your name.").max(80).safeParse(form.get("displayName"));
  if (!name.success) return { error: name.error.issues[0].message };
  await db.user.update({ where: { id: user.id }, data: { displayName: name.data } });
  await audit(user.schoolId, user.id, "teacher.update_profile", "User", user.id);
  revalidatePath("/teacher", "layout");
  return { message: "Saved." };
}
