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
}
