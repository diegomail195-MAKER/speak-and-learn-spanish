"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { requireAdmin, requireStudent, requireTeacher } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { activityForStudent } from "@/lib/library/service";
import type { ContentFor } from "@/lib/library/types";
import { skillKey } from "@/lib/montessori/activity";
import { configSchema } from "@/lib/montessori/config";
import { LEVELS } from "@/lib/montessori/types";
import { recordSkills, saveMontessoriConfig, setTeacherLevel } from "@/lib/montessori/server";

const support = z.enum(["NONE", "HINT", "MODEL"]).nullable();

/**
 * Library games report the items a student answered. Only words that really are in the assigned
 * activity are recorded, so a request can't invent progress.
 */
export async function recordLibraryLearning(input: { assignmentId: string; activityId: string; items: Array<{ label: string; result: "NONE" | "HINT" | "MODEL" | null }> }) {
  const { student } = await requireStudent();
  const d = z.object({ assignmentId: z.string(), activityId: z.string(), items: z.array(z.object({ label: z.string().trim().min(1).max(120), result: support })).max(80) }).parse(input);
  const { act, kind, content } = await activityForStudent(student, d.assignmentId, d.activityId);
  if (kind !== "GAME") return { ok: true, recorded: 0 };
  const game = content as ContentFor<"GAME">;
  const allowed = new Set([...game.pairs.map((p) => p.es), ...game.questions.map((q) => q.choices[q.answer] ?? "")].filter(Boolean));
  const items = d.items
    .filter((i) => allowed.has(i.label))
    .map((i) => ({ key: skillKey("es-419", i.label), label: i.label, result: i.result, hinted: i.result !== "NONE", selfCorrected: false }))
    .filter((i): i is typeof i & { key: string } => !!i.key);
  const assignment = await db.assignment.findUnique({ where: { id: act.assignmentId }, select: { topic: { select: { titleEs: true, titleEn: true } } } });
  await recordSkills(student.id, items, { topic: assignment?.topic?.titleEn || assignment?.topic?.titleEs || act.version.title, activity: act.version.title, contextId: `lib:${act.resourceId}` });
  return { ok: true, recorded: items.length };
}

/** Settings → Montessori Feedback (administrators only). */
export async function saveMontessoriSettings(input: unknown) {
  const { user } = await requireAdmin();
  const parsed = configSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid settings" };
  const saved = await saveMontessoriConfig(parsed.data, user.id);
  await audit(user.schoolId, user.id, "montessori.settings", "MontessoriSettings", "platform");
  revalidatePath("/admin/settings/montessori");
  return { ok: true as const, config: saved };
}

/** A teacher adjusts the level of one skill (or clears it, back to the computed level) and adds an observation. */
export async function updateSkillLevel(input: { skillId: string; level: string | null; note: string }) {
  const { user, teacher } = await requireTeacher();
  const d = z.object({ skillId: z.string().min(1), level: z.enum(LEVELS).nullable(), note: z.string().max(1000).default("") }).parse(input);
  const row = await setTeacherLevel(teacher.id, user.id, d.skillId, { level: d.level, note: d.note });
  await audit(user.schoolId, user.id, "montessori.level", "SkillProgress", row.id, { level: d.level });
  revalidatePath(`/teacher/progress/${row.studentId}`);
  return { ok: true, level: row.teacherLevel, computed: row.level };
}
