import "server-only";
import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { HttpError } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { mediaUrl } from "@/lib/media/save";
import { assignmentsForStudentWhere } from "@/lib/access";

export const videoInput = z.object({
  title: z.string().trim().min(1, "Add a title.").max(140),
  description: z.string().max(2000).default(""),
  source: z.enum(["HOSTED", "YOUTUBE"]),
  fileAssetId: z.string().nullable(),
  youtubeId: z.string().regex(/^[\w-]{11}$/).nullable(),
  coverAssetId: z.string().nullable(),
  captionsAssetId: z.string().nullable(),
  captionsLanguage: z.string().max(10).default("es"),
  categoryId: z.string().nullable(),
  level: z.string().max(60).default(""),
  keywords: z.array(z.string().trim().max(40)).max(30).default([]),
  durationSec: z.number().int().min(0).max(60 * 60 * 6).nullable(),
  practiceGameId: z.string().nullable(),
  status: z.enum(["DRAFT", "PUBLISHED"]),
});

/** Validates that every referenced row belongs to the school, then returns Prisma data. */
export async function videoData(schoolId: string, v: z.infer<typeof videoInput>) {
  if (v.source === "HOSTED" && !v.fileAssetId) throw new HttpError(400, "Upload the video file.");
  if (v.source === "YOUTUBE" && !v.youtubeId) throw new HttpError(400, "Paste a valid YouTube link.");
  const assets = [v.fileAssetId, v.coverAssetId, v.captionsAssetId].filter(Boolean) as string[];
  if (assets.length && (await db.mediaAsset.count({ where: { id: { in: assets }, schoolId } })) !== new Set(assets).size) throw new HttpError(400, "Unknown file");
  if (v.fileAssetId && !(await db.mediaAsset.findFirst({ where: { id: v.fileAssetId, kind: "VIDEO", mimeType: { startsWith: "video/" } } }))) throw new HttpError(400, "Not a video file");
  if (v.categoryId && !(await db.category.findFirst({ where: { id: v.categoryId, schoolId } }))) throw new HttpError(400, "Unknown category");
  if (v.practiceGameId && !(await db.game.findFirst({ where: { id: v.practiceGameId, schoolId } }))) throw new HttpError(400, "Unknown game");
  return {
    title: v.title,
    description: v.description,
    source: v.source,
    fileAssetId: v.source === "HOSTED" ? v.fileAssetId : null,
    youtubeId: v.source === "YOUTUBE" ? v.youtubeId : null,
    coverAssetId: v.coverAssetId,
    captionsAssetId: v.source === "HOSTED" ? v.captionsAssetId : null,
    captionsLanguage: v.captionsLanguage,
    categoryId: v.categoryId,
    level: v.level,
    keywords: [...new Set(v.keywords.filter(Boolean))],
    durationSec: v.durationSec,
    practiceGameId: v.practiceGameId,
    status: v.status,
  } satisfies Partial<Prisma.VideoUncheckedCreateInput>;
}

export type PlayVideo = {
  id: string;
  title: string;
  description: string;
  source: "HOSTED" | "YOUTUBE";
  url: string | null;
  youtubeId: string | null;
  captionsUrl: string | null;
  captionsLanguage: string;
  coverUrl: string | null;
  durationSec: number | null;
  practiceGameId: string | null;
};

export function toPlayVideo(v: { id: string; title: string; description: string; source: "HOSTED" | "YOUTUBE"; fileAssetId: string | null; youtubeId: string | null; captionsAssetId: string | null; captionsLanguage: string; coverAssetId: string | null; durationSec: number | null; practiceGameId: string | null }): PlayVideo {
  return {
    id: v.id,
    title: v.title,
    description: v.description,
    source: v.source,
    url: v.fileAssetId ? mediaUrl(v.fileAssetId) : null,
    youtubeId: v.youtubeId,
    captionsUrl: v.captionsAssetId ? mediaUrl(v.captionsAssetId) : null,
    captionsLanguage: v.captionsLanguage,
    coverUrl: v.coverAssetId ? mediaUrl(v.coverAssetId) : v.youtubeId ? `https://i.ytimg.com/vi/${v.youtubeId}/hqdefault.jpg` : null,
    durationSec: v.durationSec,
    practiceGameId: v.practiceGameId,
  };
}

type StudentRef = { id: string; classroomId: string; schoolId: string };

/** Videos of a video or collection assignment visible to this student (published only). */
export async function videosOfAssignment(student: StudentRef, assignmentId: string) {
  const a = await db.assignment.findFirst({
    where: { id: assignmentId, ...assignmentsForStudentWhere(student) },
    include: {
      video: true,
      collection: { include: { videos: { orderBy: { position: "asc" }, include: { video: true } } } },
    },
  });
  if (!a) throw new HttpError(404, "Assignment not found");
  const videos = a.video ? [a.video] : (a.collection?.videos.map((cv) => cv.video) ?? []);
  return { assignment: a, videos: videos.filter((v) => v.status === "PUBLISHED") };
}

/** True when this student may watch this video (assigned directly or through a collection). */
export async function studentCanWatch(student: StudentRef, videoId: string) {
  if (!(await db.video.findFirst({ where: { id: videoId, schoolId: student.schoolId, status: "PUBLISHED" } }))) return false;
  const n = await db.assignment.count({
    where: {
      ...assignmentsForStudentWhere(student),
      OR: [{ videoId }, { collection: { videos: { some: { videoId } } } }],
    },
  });
  return n > 0;
}

/** Counts real playback time only (seeking forward doesn't count as watching). */
export function completedFrom(watchedSec: number, durationSec: number | null | undefined) {
  if (!durationSec || durationSec <= 0) return false;
  return watchedSec >= durationSec * 0.9;
}

/**
 * Resolves which game a student plays for an assignment: the game itself, or
 * for "Watch & Practice" the practice game attached to an assigned video.
 */
export async function practiceTarget(student: StudentRef, assignmentId: string, videoId?: string | null) {
  if (!videoId) {
    const a = await db.assignment.findFirst({ where: { id: assignmentId, ...assignmentsForStudentWhere(student) } });
    if (!a || !a.gameId) throw new HttpError(404, "Assignment not found");
    return { assignment: a, gameId: a.gameId, video: null };
  }
  const { assignment, videos } = await videosOfAssignment(student, assignmentId);
  const video = videos.find((v) => v.id === videoId);
  if (!video?.practiceGameId) throw new HttpError(404, "No practice activity for this video");
  const game = await db.game.findFirst({ where: { id: video.practiceGameId, schoolId: student.schoolId, status: "PUBLISHED" } });
  if (!game) throw new HttpError(404, "The practice activity isn't published yet");
  return { assignment, gameId: game.id, video };
}
