import "server-only";
import { randomUUID } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { HttpError } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { extFor } from "@/lib/media/validate";
import { storage } from "@/lib/storage";

// Community: activities that their owners share with every teacher and the platform admin.
// Nobody edits someone else's original. "Copy to My Activities" makes a full, independent copy in
// the reader's own account (with its pictures and audio), which they can then edit and adapt.

/** Prisma filter: activities that are in the Community right now (shared and not in a Recycle Bin). */
export const communityWhere = { communitySharedAt: { not: null }, status: { not: "ARCHIVED" as const } };

/** True when the asset is a picture shown on a Community activity's cards (for the Community thumbnails). */
export async function isCommunityImage(assetId: string): Promise<boolean> {
  const n = await db.gameItem.count({ where: { imageAssetId: assetId, game: communityWhere } });
  return n > 0;
}

/** Every string inside a JSON value (activity settings, card data), to find the media they point to. */
function stringsIn(v: unknown, out: Set<string>, depth = 0) {
  if (depth > 30 || v == null) return;
  if (typeof v === "string") out.add(v);
  else if (Array.isArray(v)) for (const x of v) stringsIn(x, out, depth + 1);
  else if (typeof v === "object") for (const x of Object.values(v)) stringsIn(x, out, depth + 1);
}

/** The same JSON value with media ids swapped for their copies. Text never matches an id (cuid). */
function remapJson(v: unknown, map: Map<string, string | null>, depth = 0): unknown {
  if (depth > 30 || v == null) return v;
  if (typeof v === "string") return map.has(v) ? map.get(v) : v;
  if (Array.isArray(v)) return v.map((x) => remapJson(x, map, depth + 1));
  if (typeof v === "object") return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, remapJson(x, map, depth + 1)]));
  return v;
}

/**
 * Copies an activity into another teacher's My Activities (top level, as a draft) and returns the
 * new id. When the copy goes to another school, its pictures and audio are copied too, so the copy
 * keeps working even if the original is changed or deleted later. The original is only read.
 */
export async function copyGameTo(sourceId: string, target: { schoolId: string; teacherId: string }): Promise<string> {
  const g = await db.game.findUnique({
    where: { id: sourceId },
    include: { items: { orderBy: { position: "asc" }, include: { questions: { include: { acceptedAnswers: true } } } } },
  });
  if (!g) throw new HttpError(404, "Activity not found");

  // Media this activity uses: card pictures, generated audio (questions, instructions, phrases) and
  // any picture/audio id kept in the card data or settings (card backs, recorded audio, diagram…).
  const jsonStrings = new Set<string>();
  stringsIn(g.settings, jsonStrings);
  for (const it of g.items) stringsIn(it.data, jsonStrings);
  const audioIds = new Set<string>(jsonStrings);
  if (g.instructionAudioId) audioIds.add(g.instructionAudioId);
  for (const it of g.items)
    for (const q of it.questions) for (const a of [q.promptAudioId, q.supportAudioId, q.hintAudioId, q.modelAudioId]) if (a) audioIds.add(a);
  const audios = audioIds.size ? await db.audioAsset.findMany({ where: { id: { in: [...audioIds] }, schoolId: g.schoolId } }) : [];
  const mediaIds = new Set<string>(jsonStrings);
  for (const it of g.items) if (it.imageAssetId) mediaIds.add(it.imageAssetId);
  for (const a of audios) mediaIds.add(a.mediaAssetId);
  const media = mediaIds.size ? await db.mediaAsset.findMany({ where: { id: { in: [...mediaIds] }, schoolId: g.schoolId } }) : [];

  // Source id → copy id (null: the file could not be copied, so the copy leaves it out).
  const map = new Map<string, string | null>();
  if (target.schoolId === g.schoolId) {
    for (const m of media) map.set(m.id, m.id);
    for (const a of audios) map.set(a.id, a.id);
  } else {
    const store = storage();
    for (const m of media) {
      // The same file already in the target school (e.g. copied before) is reused.
      const existing = await db.mediaAsset.findFirst({ where: { schoolId: target.schoolId, sha256: m.sha256, kind: m.kind } });
      if (existing) {
        map.set(m.id, existing.id);
        continue;
      }
      let bytes: Buffer;
      try {
        bytes = await store.get(m.storageKey);
      } catch {
        continue; // a missing file is left out; the copy shows that card without it
      }
      const key = `${target.schoolId}/${m.kind.toLowerCase()}/${randomUUID()}.${extFor[m.mimeType] ?? m.storageKey.split(".").pop() ?? "bin"}`;
      await store.put(key, bytes, m.mimeType);
      const copy = await db.mediaAsset.create({
        data: { schoolId: target.schoolId, ownerUserId: null, kind: m.kind, storageKey: key, mimeType: m.mimeType, sizeBytes: m.sizeBytes, originalName: m.originalName, sha256: m.sha256 },
      });
      map.set(m.id, copy.id);
    }
    for (const a of audios) {
      const mediaAssetId = map.get(a.mediaAssetId);
      if (!mediaAssetId) continue;
      const copy = await db.audioAsset.upsert({
        where: { schoolId_cacheKey: { schoolId: target.schoolId, cacheKey: a.cacheKey } },
        update: {},
        create: { schoolId: target.schoolId, mediaAssetId, text: a.text, language: a.language, voice: a.voice, rate: a.rate, style: a.style, provider: a.provider, cacheKey: a.cacheKey },
      });
      map.set(a.id, copy.id);
    }
    for (const x of [...media, ...audios]) if (!map.has(x.id)) map.set(x.id, null);
  }
  const id = (v: string | null) => (v ? map.get(v) ?? null : null);

  // Categories belong to each school: keep the one with the same name, if the target school has it.
  let categoryId: string | null = null;
  if (g.categoryId) {
    if (target.schoolId === g.schoolId) categoryId = g.categoryId;
    else {
      const cat = await db.category.findUnique({ where: { id: g.categoryId }, select: { nameEn: true } });
      if (cat) categoryId = (await db.category.findFirst({ where: { schoolId: target.schoolId, nameEn: cat.nameEn }, select: { id: true } }))?.id ?? null;
    }
  }

  const copy = await db.game.create({
    data: {
      schoolId: target.schoolId,
      teacherId: target.teacherId,
      templateKey: g.templateKey,
      title: g.title,
      description: g.description,
      categoryId,
      topic: g.topic,
      objective: g.objective,
      level: g.level,
      instructions: g.instructions,
      instructionAudioId: id(g.instructionAudioId),
      language: g.language,
      difficulty: g.difficulty,
      estimatedMinutes: g.estimatedMinutes,
      settings: (remapJson(g.settings ?? {}, map) ?? {}) as Prisma.InputJsonValue,
      copiedFromId: g.id,
      items: {
        create: g.items.map((it) => ({
          position: it.position,
          text: it.text,
          imageAssetId: id(it.imageAssetId),
          difficulty: it.difficulty,
          data: (remapJson(it.data ?? {}, map) ?? {}) as Prisma.InputJsonValue,
          questions: {
            create: it.questions.map((q) => ({
              prompt: q.prompt,
              expectedAnswer: q.expectedAnswer,
              evaluationMode: q.evaluationMode,
              hint: q.hint,
              supportText: q.supportText,
              supportLanguage: q.supportLanguage,
              answerLanguage: q.answerLanguage,
              promptAudioId: id(q.promptAudioId),
              supportAudioId: id(q.supportAudioId),
              hintAudioId: id(q.hintAudioId),
              modelAudioId: id(q.modelAudioId),
              acceptedAnswers: { create: q.acceptedAnswers.map((a) => ({ text: a.text })) },
            })),
          },
        })),
      },
    },
  });
  return copy.id;
}
