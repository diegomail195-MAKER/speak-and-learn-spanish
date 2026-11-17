"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { schoolGame } from "@/lib/access";
import { audit } from "@/lib/audit";
import { requireTeacher } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { templateByKey, templateOptions } from "@/lib/games/templates";
import { DEFAULT_SETTINGS } from "@/lib/games/types";
import { AUDIO_LANGUAGE_CODES } from "@/lib/tts/voices";

export async function createGame(form: FormData) {
  const { user, teacher } = await requireTeacher();
  const t = templateByKey(String(form.get("templateKey")));
  if (!t?.available) throw new Error("Template not available");
  const game = await db.game.create({
    data: {
      schoolId: user.schoolId,
      teacherId: teacher.id,
      templateKey: t.key,
      title: "",
      settings: { ...DEFAULT_SETTINGS, acceptShortAnswer: t.defaults.acceptShortAnswer, options: templateOptions(t, undefined) },
    },
  });
  await audit(user.schoolId, user.id, "game.create", "Game", game.id);
  redirect(`/teacher/games/${game.id}/edit`);
}

export async function setGameStatus(form: FormData) {
  const { user } = await requireTeacher();
  const g = await schoolGame(user.schoolId, String(form.get("gameId")));
  const status = z.enum(["DRAFT", "ARCHIVED"]).parse(form.get("status"));
  await db.game.update({ where: { id: g.id }, data: { status } });
  await audit(user.schoolId, user.id, `game.${status === "DRAFT" ? "unpublish" : "archive"}`, "Game", g.id);
  revalidatePath("/teacher/games");
  revalidatePath("/teacher/my-activities");
}

export async function duplicateGame(form: FormData) {
  const { user, teacher } = await requireTeacher();
  const g = await db.game.findFirstOrThrow({
    where: { id: String(form.get("gameId")), schoolId: user.schoolId },
    include: { items: { include: { questions: { include: { acceptedAnswers: true } } } } },
  });
  const copy = await db.game.create({
    data: {
      schoolId: user.schoolId,
      teacherId: teacher.id,
      templateKey: g.templateKey,
      title: `${g.title} (copy)`,
      description: g.description,
      categoryId: g.categoryId,
      topic: g.topic,
      objective: g.objective,
      level: g.level,
      instructions: g.instructions,
      language: g.language,
      difficulty: g.difficulty,
      estimatedMinutes: g.estimatedMinutes,
      settings: g.settings ?? {},
      items: {
        create: g.items.map((it) => ({
          position: it.position,
          text: it.text,
          imageAssetId: it.imageAssetId,
          difficulty: it.difficulty,
          data: it.data ?? {},
          questions: {
            create: it.questions.map((q) => ({
              prompt: q.prompt,
              expectedAnswer: q.expectedAnswer,
              evaluationMode: q.evaluationMode,
              hint: q.hint,
              supportText: q.supportText,
              supportLanguage: q.supportLanguage,
              answerLanguage: q.answerLanguage,
              promptAudioId: q.promptAudioId,
              supportAudioId: q.supportAudioId,
              hintAudioId: q.hintAudioId,
              modelAudioId: q.modelAudioId,
              acceptedAnswers: { create: q.acceptedAnswers.map((a) => ({ text: a.text })) },
            })),
          },
        })),
      },
    },
  });
  await audit(user.schoolId, user.id, "game.duplicate", "Game", copy.id, { from: g.id });
  redirect(`/teacher/games/${copy.id}/edit`);
}

export async function deleteGame(form: FormData) {
  const { user } = await requireTeacher();
  const g = await schoolGame(user.schoolId, String(form.get("gameId")));
  if (String(form.get("confirm")) !== "DELETE") throw new Error("Confirmation required");
  await db.game.delete({ where: { id: g.id } });
  await audit(user.schoolId, user.id, "game.delete", "Game", g.id, { title: g.title });
  revalidatePath("/teacher/games");
  revalidatePath("/teacher/my-activities");
}

/**
 * Renames an activity: only its title changes. The id stays the same, so its links, assignments,
 * attempts and folder are untouched.
 */
export async function renameGame(gameId: string, title: string): Promise<{ ok: true; title: string } | { ok: false; error: string }> {
  const { user } = await requireTeacher();
  const g = await schoolGame(user.schoolId, gameId);
  const next = title.replace(/\s+/g, " ").trim();
  if (!next) return { ok: false, error: "The title can't be empty." };
  if (next.length > 120) return { ok: false, error: "Use 120 characters or fewer." };
  if (next !== g.title) {
    await db.game.update({ where: { id: g.id }, data: { title: next } });
    await audit(user.schoolId, user.id, "game.rename", "Game", g.id, { from: g.title, to: next });
  }
  revalidatePath("/teacher/my-activities");
  revalidatePath("/teacher/games");
  revalidatePath("/teacher/assignments");
  revalidatePath(`/play/preview/${g.id}`);
  return { ok: true, title: next };
}

/** Activity settings → Font: saved per activity in its options ("default" or "montessori"). */
export async function setGameFont(gameId: string, font: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const { user } = await requireTeacher();
  const g = await schoolGame(user.schoolId, gameId);
  const value = z.enum(["default", "montessori"]).safeParse(font);
  if (!value.success) return { ok: false, error: "Unknown font." };
  const settings = (g.settings ?? {}) as Record<string, unknown>;
  const options = { ...((settings.options as Record<string, unknown> | undefined) ?? {}), font: value.data };
  await db.game.update({ where: { id: g.id }, data: { settings: { ...settings, options } as object } });
  await audit(user.schoolId, user.id, "game.font", "Game", g.id, { font: value.data });
  revalidatePath(`/play/preview/${g.id}`);
  return { ok: true };
}

const langCode = z.enum(AUDIO_LANGUAGE_CODES);
const settingsInput = z.object({
  description: z.string().max(1000).optional(),
  categoryId: z.string().max(40).nullable().optional(),
  topic: z.string().max(120).optional(),
  objective: z.string().max(500).optional(),
  level: z.string().max(60).optional(),
  language: z.enum(["es-419", "en-US", "fr-FR"]).optional(),
  difficulty: z.number().int().min(1).max(3).optional(),
  estimatedMinutes: z.number().int().min(1).max(120).nullable().optional(),
  settings: z
    .object({
      acceptShortAnswer: z.boolean().optional(),
      voice: z.string().max(80).nullable().optional(),
      voices: z.record(langCode, z.string().max(80)).optional(),
      rate: z.number().min(0.5).max(1.5).optional(),
      maxTries: z.number().int().min(1).max(5).optional(),
      options: z.record(z.string().max(40), z.union([z.string().max(40), z.number(), z.boolean()])).optional(),
    })
    .optional(),
});

/**
 * Activity settings (under the activity's actions): information, options, font, voices and how
 * answers are checked. Only the fields sent change; template options are checked against the template.
 */
export async function saveActivitySettings(gameId: string, input: z.input<typeof settingsInput>): Promise<{ ok: true } | { ok: false; error: string }> {
  const { user } = await requireTeacher();
  const g = await schoolGame(user.schoolId, gameId);
  const parsed = settingsInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Some settings aren't valid." };
  const d = parsed.data;
  if (d.categoryId && !(await db.category.findFirst({ where: { id: d.categoryId, schoolId: user.schoolId }, select: { id: true } }))) return { ok: false, error: "Unknown category." };
  const t = templateByKey(g.templateKey);
  const prev = { ...DEFAULT_SETTINGS, ...((g.settings ?? {}) as Record<string, unknown>) } as Record<string, unknown>;
  let settings = prev;
  if (d.settings) {
    const { options, voice, ...rest } = d.settings;
    settings = { ...prev, ...rest };
    if (voice !== undefined) settings.voice = voice ?? undefined;
    if (options && t) settings.options = templateOptions(t, { ...((prev.options as Record<string, string | number | boolean>) ?? {}), ...options });
  }
  if (d.language && d.language !== g.language) settings.voice = undefined; // the main voice belongs to the old language
  const { settings: _s, ...fields } = d;
  void _s;
  await db.game.update({ where: { id: g.id }, data: { ...fields, settings: settings as object } });
  await audit(user.schoolId, user.id, "game.settings", "Game", g.id, { fields: Object.keys(fields), settings: Object.keys(d.settings ?? {}) });
  revalidatePath(`/play/preview/${g.id}`);
  return { ok: true };
}

/** Other accepted answers of each card or question ("púrpura" for "morado"). */
export async function saveAcceptedAnswers(gameId: string, questionId: string, answers: string[]): Promise<{ ok: true; answers: string[] } | { ok: false; error: string }> {
  const { user } = await requireTeacher();
  const g = await schoolGame(user.schoolId, gameId);
  const list = z.array(z.string().max(200)).max(20).safeParse(answers);
  if (!list.success) return { ok: false, error: "Up to 20 answers of 200 characters." };
  const clean = [...new Set(list.data.map((a) => a.trim()).filter(Boolean))];
  const q = await db.question.findFirst({ where: { id: questionId, item: { gameId: g.id } }, select: { id: true } });
  if (!q) return { ok: false, error: "Unknown card." };
  await db.$transaction([db.acceptedAnswer.deleteMany({ where: { questionId: q.id } }), db.acceptedAnswer.createMany({ data: clean.map((text) => ({ questionId: q.id, text })) })]);
  await db.game.update({ where: { id: g.id }, data: { updatedAt: new Date() } });
  await audit(user.schoolId, user.id, "game.accepted", "Game", g.id, { questionId: q.id, count: clean.length });
  revalidatePath(`/play/preview/${g.id}`);
  return { ok: true, answers: clean };
}
