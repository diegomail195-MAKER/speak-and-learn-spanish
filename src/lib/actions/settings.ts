"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { requireAdmin } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { TOPIC_LANGUAGES } from "@/lib/library/topicMeta";
import type { AdminState } from "./admin";

const schema = z.object({
  signupOpen: z.boolean(),
  announcement: z.string().trim().max(240, "Keep the notice under 240 characters."),
  defaultTopicLanguage: z.enum(TOPIC_LANGUAGES),
  supportEmail: z.union([z.literal(""), z.string().trim().toLowerCase().email("Write a valid support email, or leave it empty.")]),
});

/** Platform Admin › Settings › General. Admins only; every change is audited with what changed. */
export async function updateSettings(_: AdminState, form: FormData): Promise<AdminState> {
  const { user } = await requireAdmin();
  const d = schema.safeParse({
    signupOpen: form.get("signupOpen") === "on",
    announcement: String(form.get("announcement") ?? ""),
    defaultTopicLanguage: String(form.get("defaultTopicLanguage") ?? "es"),
    supportEmail: String(form.get("supportEmail") ?? "").trim(),
  });
  if (!d.success) return { error: d.error.issues[0].message };
  const before = await db.platformSettings.findUnique({ where: { id: "global" } });
  await db.platformSettings.upsert({ where: { id: "global" }, create: { id: "global", ...d.data, updatedById: user.id }, update: { ...d.data, updatedById: user.id } });
  const changed = (Object.keys(d.data) as (keyof typeof d.data)[]).filter((k) => !before || before[k] !== d.data[k]);
  await audit(user.schoolId, user.id, "settings.update", "PlatformSettings", "global", { changed });
  // The notice and sign-up switch show on many pages.
  revalidatePath("/", "layout");
  return { message: changed.length ? "Settings saved." : "Nothing changed." };
}
