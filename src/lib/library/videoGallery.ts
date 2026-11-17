// Library › Videos: a featured video on top and one row of cards per topic, built from the
// library's published VIDEO resources (and SONG resources that carry a video). Pure data, shared by
// the gallery and the watch page; no database access here.
import { libraryFileUrl } from "./types";

export type GalleryVideoType = "VIDEO" | "MUSIC";

export const GALLERY_TYPE_LABEL: Record<GalleryVideoType, string> = { VIDEO: "Video", MUSIC: "Music video" };

export interface GalleryVideo {
  /** Library resource id. */
  id: string;
  title: string;
  source: "HOSTED" | "YOUTUBE";
  /** Hosted file URL (served by /api/library/files with the library's permissions). */
  url: string | null;
  youtubeId: string | null;
  durationSec: number | null;
  type: GalleryVideoType;
}

export interface GalleryRow {
  slug: string;
  titleEs: string;
  titleEn: string;
  category: string;
  videos: GalleryVideo[];
}

export interface GalleryTopicInput {
  slug: string;
  titleEs: string;
  titleEn: string;
  category: string;
  resources: Array<{ id: string; kind: string; title: string; content: unknown }>;
}

// Songs, chants and dance versions ("Buenas tardes (trap)", "Las formas (canción)").
const MUSIC = /\b(canci[oó]n|canciones|cantar|cantemos|song|chant|rap|trap|rock|merengue|afrobeat|reggaet[oó]n|cumbia|salsa|letra|lyrics|karaoke)\b/i;

/** «Music video» for songs and music versions; «Video» for everything else. */
export function galleryType(kind: string, title: string, topicSlug = ""): GalleryVideoType {
  if (kind === "SONG") return "MUSIC";
  return MUSIC.test(title) || /song|cancion|music|musica/.test(topicSlug) ? "MUSIC" : "VIDEO";
}

/** The playable video of a resource, or null (no file/link, or a song that is only audio). */
export function galleryVideo(r: { id: string; kind: string; title: string; content: unknown }, topicSlug = ""): GalleryVideo | null {
  const c = (r.content ?? {}) as { file?: { fileId?: string; mime?: string } | null; youtubeId?: string | null; durationSec?: number | null; link?: { url?: string } | null };
  const durationSec = typeof c.durationSec === "number" && c.durationSec > 0 ? c.durationSec : null;
  const type = galleryType(r.kind, r.title, topicSlug);
  if (r.kind === "VIDEO") {
    if (c.file?.fileId) return { id: r.id, title: r.title, source: "HOSTED", url: libraryFileUrl(c.file.fileId), youtubeId: null, durationSec, type };
    if (c.youtubeId) return { id: r.id, title: r.title, source: "YOUTUBE", url: null, youtubeId: c.youtubeId, durationSec, type };
    return null;
  }
  if (r.kind === "SONG") {
    if (c.file?.fileId && (c.file.mime ?? "").startsWith("video/")) return { id: r.id, title: r.title, source: "HOSTED", url: libraryFileUrl(c.file.fileId), youtubeId: null, durationSec, type };
    const yt = c.link?.url ? youtubeIdOf(c.link.url) : null;
    if (yt) return { id: r.id, title: r.title, source: "YOUTUBE", url: null, youtubeId: yt, durationSec, type };
  }
  return null;
}

function youtubeIdOf(url: string): string | null {
  const m = url.match(/(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/))([\w-]{11})/);
  return m ? m[1] : null;
}

/** One row per topic that has at least one playable video, in the library's topic order. */
export function buildGalleryRows(topics: GalleryTopicInput[]): GalleryRow[] {
  const rows: GalleryRow[] = [];
  for (const t of topics) {
    const seen = new Set<string>();
    const videos: GalleryVideo[] = [];
    for (const r of t.resources) {
      if (seen.has(r.id)) continue;
      const v = galleryVideo(r, t.slug);
      if (v) {
        videos.push(v);
        seen.add(r.id);
      }
    }
    if (videos.length) rows.push({ slug: t.slug, titleEs: t.titleEs, titleEn: t.titleEn, category: t.category, videos });
  }
  return rows;
}

/** Categories that have videos, in the order their first topic appears. */
export function galleryCategories(rows: GalleryRow[]): string[] {
  return [...new Set(rows.map((r) => r.category))];
}

/** Rows of one category ("" = all). An unknown category shows everything. */
export function rowsFor(rows: GalleryRow[], category: string): GalleryRow[] {
  if (!category) return rows;
  const f = rows.filter((r) => r.category === category);
  return f.length ? f : rows;
}

/** The featured video: the first music video of the visible rows (the most "watchable"), else the first video. */
export function featuredOf(rows: GalleryRow[]): { video: GalleryVideo; row: GalleryRow } | null {
  for (const row of rows) for (const video of row.videos) if (video.type === "MUSIC") return { video, row };
  const row = rows[0];
  return row ? { video: row.videos[0], row } : null;
}

/** Link to the watch page; keeps the grade, the category and the topic the video was opened from. */
export function watchHref(id: string, opts: { grade?: string | null; category?: string; topic?: string }) {
  const q = new URLSearchParams();
  if (opts.grade) q.set("grade", opts.grade);
  if (opts.category) q.set("cat", opts.category);
  if (opts.topic) q.set("topic", opts.topic);
  const s = q.toString();
  return `/teacher/library/videos/${id}${s ? `?${s}` : ""}`;
}

/** Back to the gallery with the same grade and category. */
export function galleryHref(opts: { grade?: string | null; category?: string }) {
  const q = new URLSearchParams();
  if (opts.grade) q.set("grade", opts.grade);
  q.set("type", "VIDEO");
  if (opts.category) q.set("cat", opts.category);
  return `/teacher/library?${q.toString()}`;
}

export const fmtDuration = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
