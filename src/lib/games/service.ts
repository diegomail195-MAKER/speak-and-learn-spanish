import "server-only";
import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { HttpError } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { phrasesFor } from "@/lib/feedback";
import { mediaUrl } from "@/lib/media/save";
import { sttLocale, sttProvider } from "@/lib/stt";
import { activityTypeForTemplate } from "@/lib/montessori/activity";
import { pregeneratedLines } from "@/lib/montessori/messages";
import { nounFor } from "@/lib/montessori/nouns";
import { getMontessoriConfig } from "@/lib/montessori/server";
import { ttsProvider } from "@/lib/tts";
import { ensureAudio } from "@/lib/tts/generate";
import { maxItemsFor, templateByKey, templateOptions } from "./templates";
import { DEFAULT_SETTINGS, SPELL_TOKENS, type EditorGame, type FaceAudio, type GameSettings, type ItemData, type PlayFace, type PlayGame } from "./types";

export function readItemData(json: Prisma.JsonValue): ItemData {
  return json && typeof json === "object" && !Array.isArray(json) ? (json as ItemData) : {};
}

const gameInclude = {
  items: {
    orderBy: { position: "asc" as const },
    include: {
      image: true,
      questions: { include: { acceptedAnswers: true, promptAudio: true, supportAudio: true } },
    },
  },
} satisfies Prisma.GameInclude;

export function readSettings(json: Prisma.JsonValue): GameSettings {
  return { ...DEFAULT_SETTINGS, ...(json && typeof json === "object" && !Array.isArray(json) ? (json as Partial<GameSettings>) : {}) };
}

export async function loadEditorGame(schoolId: string, id: string): Promise<EditorGame> {
  const g = await db.game.findFirst({ where: { id, schoolId }, include: gameInclude });
  if (!g) throw new HttpError(404, "Game not found");
  return {
    id: g.id,
    templateKey: g.templateKey,
    title: g.title,
    description: g.description,
    categoryId: g.categoryId,
    topic: g.topic,
    objective: g.objective,
    level: g.level,
    instructions: g.instructions,
    language: g.language as EditorGame["language"],
    difficulty: g.difficulty,
    estimatedMinutes: g.estimatedMinutes,
    status: g.status,
    settings: readSettings(g.settings),
    diagramImageUrl: readSettings(g.settings).diagramImageId ? mediaUrl(readSettings(g.settings).diagramImageId!) : null,
    updatedAt: g.updatedAt.toISOString(),
    items: g.items.map((it) => {
      const q = it.questions[0];
      const spellTarget = q?.expectedAnswer === SPELL_TOKENS.firstName ? "firstName" : q?.expectedAnswer === SPELL_TOKENS.lastName ? "lastName" : "word";
      return {
        id: it.id,
        imageAssetId: it.imageAssetId,
        imageUrl: it.imageAssetId ? mediaUrl(it.imageAssetId) : null,
        text: it.text,
        difficulty: it.difficulty,
        data: readItemData(it.data),
        question: {
          id: q?.id,
          prompt: q?.prompt ?? "",
          promptAudioId: q?.promptAudioId ?? null,
          promptAudioText: q?.promptAudio?.text ?? null,
          promptAudioUrl: q?.promptAudio ? mediaUrl(q.promptAudio.mediaAssetId) : null,
          expectedAnswer: q?.expectedAnswer ?? "",
          accepted: q?.acceptedAnswers.map((a) => a.text) ?? [],
          hint: q?.hint ?? "",
          supportText: q?.supportText ?? "",
          supportLanguage: (q?.supportLanguage ?? "en-US") as EditorGame["language"],
          supportAudioId: q?.supportAudioId ?? null,
          supportAudioText: q?.supportAudio?.text ?? null,
          supportAudioUrl: q?.supportAudio ? mediaUrl(q.supportAudio.mediaAssetId) : null,
          evaluationMode: q?.evaluationMode ?? "PHRASE",
          spellTarget,
          answerLanguage: (q?.answerLanguage ?? null) as EditorGame["language"] | null,
        },
      };
    }),
  };
}

const lang = z.enum(["es-419", "en-US", "fr-FR"]);
const faceAudio = z.object({
  mediaId: z.string().max(40).nullable().optional(),
  text: z.string().max(300),
  language: lang,
  voice: z.string().max(60).nullable().optional(),
  source: z.enum(["record", "upload", "tts", "browser"]),
  name: z.string().max(200).optional(),
});
export const saveSchema = z.object({
  title: z.string().trim().max(120),
  description: z.string().max(1000),
  categoryId: z.string().nullable(),
  topic: z.string().max(120),
  objective: z.string().max(500),
  level: z.string().max(60),
  instructions: z.string().max(1000),
  language: lang,
  difficulty: z.number().int().min(1).max(3),
  estimatedMinutes: z.number().int().min(1).max(120).nullable(),
  settings: z.object({
    acceptShortAnswer: z.boolean(),
    voice: z.string().optional(),
    voices: z.record(lang, z.string()).optional(),
    rate: z.number().min(0.5).max(1.5),
    maxTries: z.number().int().min(1).max(5),
    options: z.record(z.string().max(40), z.union([z.string().max(40), z.number(), z.boolean()])).optional(),
    diagramImageId: z.string().nullable().optional(),
  }),
  items: z
    .array(
      z.object({
        id: z.string().optional(),
        imageAssetId: z.string().nullable(),
        text: z.string().max(200),
        difficulty: z.number().int().min(1).max(3),
        data: z
          .object({
            translation: z.string().max(200).optional(),
            translationLanguage: lang.optional(),
            x: z.number().min(0).max(100).optional(),
            y: z.number().min(0).max(100).optional(),
            imageAlt: z.string().max(200).optional(),
            audio: faceAudio.nullable().optional(),
            back: z
              .object({
                text: z.string().max(200).optional(),
                imageAssetId: z.string().max(40).nullable().optional(),
                imageAlt: z.string().max(200).optional(),
                audio: faceAudio.nullable().optional(),
              })
              .optional(),
          })
          .default({}),
        question: z.object({
          id: z.string().optional(),
          prompt: z.string().max(400),
          promptAudioId: z.string().nullable(),
          expectedAnswer: z.string().max(200),
          accepted: z.array(z.string().max(200)).max(20),
          hint: z.string().max(300),
          supportText: z.string().max(300),
          supportLanguage: lang,
          supportAudioId: z.string().nullable(),
          evaluationMode: z.enum(["PHRASE", "LETTERS"]),
          answerLanguage: lang.nullable().default(null),
        }),
      }),
    )
    .max(100),
});

export async function saveEditorGame(schoolId: string, id: string, input: z.infer<typeof saveSchema>) {
  const game = await db.game.findFirst({ where: { id, schoolId }, include: { items: { include: { questions: { include: { _count: { select: { responses: true } } } } } } } });
  if (!game) throw new HttpError(404, "Game not found");

  const max = maxItemsFor(templateByKey(game.templateKey));
  if (input.items.length > max) throw new HttpError(400, `This activity can have up to ${max} items (you have ${input.items.length}).`);

  // Referenced media must belong to this school, and be of the right kind.
  const imageIds = [...input.items.flatMap((i) => [i.imageAssetId, i.data.back?.imageAssetId]), input.settings.diagramImageId].filter(Boolean) as string[];
  if (imageIds.length) {
    const n = await db.mediaAsset.count({ where: { id: { in: [...new Set(imageIds)] }, schoolId, kind: "IMAGE" } });
    if (n !== new Set(imageIds).size) throw new HttpError(400, "Unknown image");
  }
  const faceAudioIds = input.items.flatMap((i) => [i.data.audio?.mediaId, i.data.back?.audio?.mediaId]).filter(Boolean) as string[];
  if (faceAudioIds.length) {
    const n = await db.mediaAsset.count({ where: { id: { in: [...new Set(faceAudioIds)] }, schoolId, kind: "AUDIO" } });
    if (n !== new Set(faceAudioIds).size) throw new HttpError(400, "Unknown audio");
  }
  const audioIds = input.items.flatMap((i) => [i.question.promptAudioId, i.question.supportAudioId]).filter(Boolean) as string[];
  const audio = new Map((await db.audioAsset.findMany({ where: { id: { in: audioIds }, schoolId } })).map((a) => [a.id, a]));
  // Drop audio that no longer matches its text, so students never hear stale audio.
  const validAudio = (audioId: string | null, text: string) => (audioId && audio.get(audioId)?.text === text.trim() ? audioId : null);

  const keepIds = new Set(input.items.map((i) => i.id).filter(Boolean));
  const removed = game.items.filter((i) => !keepIds.has(i.id));
  if (removed.some((i) => i.questions.some((q) => q._count.responses > 0))) {
    throw new HttpError(409, "Some removed questions already have student answers. Duplicate the game to make this change.");
  }

  const prevSettings = readSettings(game.settings);
  await db.$transaction(async (tx) => {
    await tx.gameItem.deleteMany({ where: { id: { in: removed.map((r) => r.id) } } });
    for (const [position, it] of input.items.entries()) {
      const q = it.question;
      const qData = {
        prompt: q.prompt,
        expectedAnswer: q.expectedAnswer,
        evaluationMode: q.evaluationMode,
        hint: q.hint,
        supportText: q.supportText,
        supportLanguage: q.supportLanguage,
        answerLanguage: q.answerLanguage,
        promptAudioId: validAudio(q.promptAudioId, q.prompt),
        supportAudioId: validAudio(q.supportAudioId, q.supportText),
      };
      const existing = it.id ? game.items.find((x) => x.id === it.id) : undefined;
      if (existing) {
        await tx.gameItem.update({ where: { id: existing.id }, data: { position, text: it.text, imageAssetId: it.imageAssetId, difficulty: it.difficulty, data: it.data } });
        const qid = existing.questions.find((x) => x.id === q.id)?.id ?? existing.questions[0]?.id;
        if (qid) {
          await tx.question.update({ where: { id: qid }, data: qData });
          await tx.acceptedAnswer.deleteMany({ where: { questionId: qid } });
          await tx.acceptedAnswer.createMany({ data: q.accepted.filter((a) => a.trim()).map((text) => ({ questionId: qid, text: text.trim() })) });
        } else {
          await tx.question.create({ data: { ...qData, itemId: existing.id, acceptedAnswers: { create: q.accepted.filter((a) => a.trim()).map((text) => ({ text: text.trim() })) } } });
        }
      } else {
        await tx.gameItem.create({
          data: {
            gameId: id,
            position,
            text: it.text,
            imageAssetId: it.imageAssetId,
            difficulty: it.difficulty,
            data: it.data,
            questions: { create: { ...qData, acceptedAnswers: { create: q.accepted.filter((a) => a.trim()).map((text) => ({ text: text.trim() })) } } },
          },
        });
      }
    }
    await tx.game.update({
      where: { id },
      data: {
        title: input.title,
        description: input.description,
        categoryId: input.categoryId,
        topic: input.topic,
        objective: input.objective,
        level: input.level,
        instructions: input.instructions,
        language: input.language,
        difficulty: input.difficulty,
        estimatedMinutes: input.estimatedMinutes,
        settings: { ...prevSettings, ...input.settings } as unknown as Prisma.InputJsonValue,
      },
    });
  });
}

/** Problems that block publishing, in teacher-friendly words. */
export function publishProblems(g: EditorGame): string[] {
  const t = templateByKey(g.templateKey);
  const p: string[] = [];
  if (!t?.available) p.push("This template is not available yet.");
  if (!g.title.trim()) p.push("Add a title.");
  const noun = t?.itemNoun ?? "question";
  const Noun = noun[0].toUpperCase() + noun.slice(1);
  if (g.items.length < (t?.minItems ?? 1)) p.push(`Add at least ${t?.minItems ?? 1} ${noun}${(t?.minItems ?? 1) > 1 ? (noun.endsWith("x") ? "es" : "s") : ""}.`);
  if (t?.activityImage && !g.settings.diagramImageId) p.push("Upload the picture to label.");
  if (g.items.length > maxItemsFor(t)) p.push(`Use at most ${maxItemsFor(t)} ${noun}s.`);
  const flash = t?.board === "flashcards";
  g.items.forEach((it, i) => {
    const n = `${Noun} ${i + 1}`;
    if (flash) {
      // A face may be only a picture or only audio; the spoken answer is optional.
      if (!it.text.trim() && !it.question.prompt.trim() && !it.imageAssetId && !it.data.audio?.text?.trim() && !it.data.audio?.mediaId) p.push(`${n}: add text, a picture or audio to the front.`);
      return;
    }
    if (t?.fields.image === "required" && !it.imageAssetId) p.push(`${n}: add an image.`);
    if (t?.fields.prompt && !it.question.prompt.trim() && t.board !== "diagram" && t.board !== "boxes" && t.board !== "flashcards") p.push(`${n}: write the question.`);
    if (t?.fields.itemText?.required && !it.text.trim()) p.push(`${n}: write the ${t.fields.itemText.label.toLowerCase()}.`);
    if (t?.fields.point && (it.data.x == null || it.data.y == null)) p.push(`${n}: place it on the picture.`);
    if (it.question.evaluationMode === "PHRASE" && !it.question.expectedAnswer.trim()) p.push(`${n}: write the correct answer.`);
    if (it.question.evaluationMode === "LETTERS" && !it.question.expectedAnswer.trim()) p.push(`${n}: choose what to spell.`);
  });
  return p;
}

/** Generates any missing audio (when a TTS provider is configured) and publishes. */
export async function publishGame(schoolId: string, userId: string, id: string) {
  const g = await loadEditorGame(schoolId, id);
  const problems = publishProblems(g);
  if (problems.length) return { ok: false as const, problems };
  const voice = g.settings.voice;
  const rate = g.settings.rate;
  const gen = (text: string, language = g.language) => ensureAudio({ schoolId, userId, text, language, voiceId: language === g.language ? voice : undefined, voices: g.settings.voices, rate });
  let audioGenerated = false;
  try {
    const qs = await db.question.findMany({ where: { item: { gameId: id } } });
    for (const q of qs) {
      const isToken = q.expectedAnswer.startsWith("{{");
      const [prompt, hint, model, support] = await Promise.all([
        q.promptAudioId ? null : gen(q.prompt),
        q.hint ? gen(q.hint) : null,
        !isToken && q.expectedAnswer ? gen(q.expectedAnswer, (q.answerLanguage ?? g.language) as EditorGame["language"]) : null,
        q.supportText && !q.supportAudioId ? gen(q.supportText, q.supportLanguage as EditorGame["language"]) : null,
      ]);
      await db.question.update({
        where: { id: q.id },
        data: {
          ...(prompt ? { promptAudioId: prompt.asset.id } : {}),
          hintAudioId: hint?.asset.id ?? q.hintAudioId,
          modelAudioId: model?.asset.id ?? q.modelAudioId,
          ...(support ? { supportAudioId: support.asset.id } : {}),
        },
      });
      audioGenerated ||= !!(prompt || hint || model || support);
    }
    // Faces whose audio is "device voice" get saved audio when a TTS service is configured.
    const items = await db.gameItem.findMany({ where: { gameId: id } });
    for (const it of items) {
      const data = readItemData(it.data);
      const upgrade = async (a: FaceAudio | null | undefined) => {
        if (!a || a.mediaId || !a.text.trim()) return a;
        const r = await gen(a.text, a.language);
        return r ? { ...a, mediaId: r.asset.mediaAssetId, source: "tts" as const } : a;
      };
      const audio = await upgrade(data.audio);
      const backAudio = await upgrade(data.back?.audio);
      if (audio !== data.audio || backAudio !== data.back?.audio) {
        await db.gameItem.update({ where: { id: it.id }, data: { data: { ...data, audio, ...(data.back ? { back: { ...data.back, audio: backAudio } } : {}) } as unknown as Prisma.InputJsonValue } });
        audioGenerated = true;
      }
    }
    const phraseAudio: Record<string, string> = {};
    for (const text of phrasesFor(g.language)) {
      const r = await gen(text);
      if (r) phraseAudio[text] = r.asset.id;
    }
    // Montessori feedback lines for this activity, with the voices chosen in Settings → Montessori Feedback.
    if (ttsProvider() && (g.language === "es-419" || g.language === "en-US")) {
      const mc = await getMontessoriConfig();
      const activityType = activityTypeForTemplate(g.templateKey, g.settings.options ?? {});
      const noun = nounFor({ topic: g.topic, title: g.title, activityType, expected: qs.map((q) => q.expectedAnswer) });
      for (const line of pregeneratedLines({ activityType, noun }, mc.messages, mc.disabledMessages)) {
        const language = line.lang === "es" ? "es-419" : "en-US";
        const r = await ensureAudio({ schoolId, userId, text: line.text, language, voiceId: mc.voices[line.lang] || undefined, rate });
        if (r) phraseAudio[line.text] = r.asset.id;
      }
    }
    const instr = g.instructions.trim() ? await gen(g.instructions) : null;
    await db.game.update({
      where: { id },
      data: {
        status: "PUBLISHED",
        publishedAt: new Date(),
        instructionAudioId: instr?.asset.id ?? null,
        settings: { ...g.settings, phraseAudio } as unknown as Prisma.InputJsonValue,
      },
    });
  } catch (e) {
    console.error(e);
    return { ok: false as const, problems: [`Audio generation failed: ${(e as Error).message.slice(0, 160)}`] };
  }
  return { ok: true as const, audioGenerated };
}

/** Builds the player payload. Spell tokens are resolved with the student's own name. */
export async function buildPlayGame(schoolId: string, gameId: string, names: { firstName: string; lastName: string }): Promise<PlayGame> {
  const g = await db.game.findFirst({
    where: { id: gameId, schoolId },
    include: {
      items: {
        orderBy: { position: "asc" },
        include: { questions: { include: { acceptedAnswers: true, promptAudio: true, hintAudio: true, modelAudio: true, supportAudio: true } } },
      },
    },
  });
  if (!g) throw new HttpError(404, "Game not found");
  const settings = readSettings(g.settings);
  const tpl = templateByKey(g.templateKey);
  const phraseIds = Object.values(settings.phraseAudio ?? {});
  const phraseAssets = await db.audioAsset.findMany({ where: { id: { in: phraseIds }, schoolId } });
  const phraseAudio: Record<string, string> = {};
  for (const [text, aid] of Object.entries(settings.phraseAudio ?? {})) {
    const a = phraseAssets.find((x) => x.id === aid);
    if (a) phraseAudio[text] = mediaUrl(a.mediaAssetId);
  }
  const url = (a: { mediaAssetId: string } | null) => (a ? mediaUrl(a.mediaAssetId) : null);
  const playAudio = (a: FaceAudio | null | undefined): PlayFace["audio"] =>
    a && (a.mediaId || a.text.trim()) ? { url: a.mediaId ? mediaUrl(a.mediaId) : null, text: a.text, language: a.language } : null;
  const flash = tpl?.board === "flashcards";
  const oneSide = flash && templateOptions(tpl, settings.options).sides === "one";
  const questions = g.items.flatMap((it) =>
    it.questions
      .map((q) => {
        let expected = q.expectedAnswer;
        const token = expected === SPELL_TOKENS.firstName || expected === SPELL_TOKENS.lastName;
        if (expected === SPELL_TOKENS.firstName) expected = names.firstName;
        if (expected === SPELL_TOKENS.lastName) expected = names.lastName;
        const data = readItemData(it.data);
        const back = data.back;
        return {
          token,
          id: q.id,
          prompt: q.prompt,
          promptAudioUrl: url(q.promptAudio),
          supportText: q.supportText,
          supportLanguage: q.supportLanguage as PlayGame["language"],
          supportAudioUrl: url(q.supportAudio),
          imageUrl: it.imageAssetId ? mediaUrl(it.imageAssetId) : null,
          displayText: it.text,
          expected,
          accepted: q.acceptedAnswers.map((a) => a.text),
          mode: q.evaluationMode,
          hint: q.hint,
          hintAudioUrl: url(q.hintAudio),
          modelAudioUrl: url(q.modelAudio),
          answerLanguage: (q.answerLanguage ?? g.language) as PlayGame["language"],
          data,
          imageAlt: data.imageAlt ?? "",
          audio: playAudio(data.audio),
          // One-sided flashcards never show the back (it stays saved for the editor).
          back:
            flash && back && !oneSide
              ? { text: back.text ?? "", imageUrl: back.imageAssetId ? mediaUrl(back.imageAssetId) : null, imageAlt: back.imageAlt ?? "", audio: playAudio(back.audio) }
              : null,
        };
      })
      // A spelling question for a name the teacher hasn't entered is skipped rather than guessed.
      // Flashcards may have no spoken answer at all (look, flip and listen).
      .filter((q) => (q.token ? q.expected.trim().length > 0 : flash || q.expected.trim().length > 0))
      .map((q) => {
        const { token, ...rest } = q;
        void token;
        return rest;
      }),
  );
  return {
    gameId: g.id,
    title: g.title,
    instructions: g.instructions,
    templateKey: g.templateKey,
    language: g.language as PlayGame["language"],
    sttLocale: sttLocale(g.language),
    sttLocales: { "es-419": sttLocale("es-419"), "en-US": sttLocale("en-US"), "fr-FR": sttLocale("fr-FR") },
    sttProvider: sttProvider(),
    board: tpl?.board ?? "sequence",
    options: templateOptions(tpl, settings.options),
    diagramImageUrl: settings.diagramImageId ? mediaUrl(settings.diagramImageId) : null,
    settings: { acceptShortAnswer: settings.acceptShortAnswer, maxTries: settings.maxTries, showAnswerText: tpl?.defaults.showAnswerText ?? false, rate: settings.rate },
    phraseAudio,
    questions,
  };
}

export function splitSpellingName(spellingName: string, firstName: string) {
  const parts = spellingName.trim().split(/\s+/).filter(Boolean);
  return { firstName: parts[0] ?? firstName, lastName: parts.slice(1).join(" ") };
}
