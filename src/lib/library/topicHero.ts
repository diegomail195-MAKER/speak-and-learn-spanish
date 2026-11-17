// Data for the Topic page (featured video, video carousel and the five categories), built from a
// topic's real library resources. Shared by the teacher's Library page and the student's task page.
import { libraryFileUrl, type Kind } from "./types";

export type HeroCategoryKey = "videos" | "games" | "flashcards" | "music" | "speaking";

/** The five categories, in the order of the mockup, with their 3D icon and the kinds they hold. */
export const HERO_CATEGORIES: ReadonlyArray<{ key: HeroCategoryKey; label: string; icon: string; kinds: readonly Kind[]; empty: string }> = [
  { key: "videos", label: "Videos", icon: "/topic-icons/videos.webp", kinds: ["VIDEO"], empty: "This topic has no videos yet." },
  { key: "games", label: "Games", icon: "/topic-icons/games.webp", kinds: ["GAME"], empty: "This topic has no games yet." },
  { key: "flashcards", label: "Flashcards", icon: "/topic-icons/flashcards.webp", kinds: ["FLASHCARDS"], empty: "This topic has no flashcards yet." },
  { key: "music", label: "Music Videos", icon: "/topic-icons/music-videos.webp", kinds: ["SONG"], empty: "This topic has no music videos yet." },
  // No library resource is a speaking activity yet, so this stays empty instead of inventing one.
  { key: "speaking", label: "Speaking", icon: "/topic-icons/speaking.webp", kinds: [], empty: "This topic has no speaking activities yet." },
];

export interface HeroVideo {
  id: string;
  title: string;
  source: "HOSTED" | "YOUTUBE";
  url: string | null;
  youtubeId: string | null;
  durationSec: number | null;
  /** Student task: the activity whose completion is recorded when the video ends. */
  activityId?: string;
}

export interface HeroItem {
  id: string;
  kind: Kind;
  title: string;
  href: string;
  done?: boolean;
  /** Videos: selecting it plays it in the featured player. */
  videoId?: string;
}

export interface HeroData {
  videos: HeroVideo[];
  /** Items of each category, in the topic's order. */
  items: Record<HeroCategoryKey, HeroItem[]>;
  /** Printables and worksheets: not one of the five categories, still listed under them. */
  more: HeroItem[];
}

type Source = { id: string; kind: Kind; title: string; content: unknown; href: string; done?: boolean; activityId?: string };

function videoOf(s: Source): HeroVideo | null {
  const c = (s.content ?? {}) as { file?: { fileId?: string } | null; youtubeId?: string | null; durationSec?: number | null };
  const base = { id: s.id, title: s.title, durationSec: typeof c.durationSec === "number" ? c.durationSec : null, activityId: s.activityId };
  if (c.file?.fileId) return { ...base, source: "HOSTED", url: libraryFileUrl(c.file.fileId), youtubeId: null };
  if (c.youtubeId) return { ...base, source: "YOUTUBE", url: null, youtubeId: c.youtubeId };
  return null;
}

export function buildHero(sources: Source[]): HeroData {
  const items = Object.fromEntries(HERO_CATEGORIES.map((c) => [c.key, [] as HeroItem[]])) as Record<HeroCategoryKey, HeroItem[]>;
  const videos: HeroVideo[] = [];
  const more: HeroItem[] = [];
  for (const s of sources) {
    const item: HeroItem = { id: s.id, kind: s.kind, title: s.title, href: s.href, done: s.done };
    if (s.kind === "VIDEO") {
      const v = videoOf(s);
      if (v) {
        videos.push(v);
        item.videoId = v.id;
      }
    }
    const cat = HERO_CATEGORIES.find((c) => c.kinds.includes(s.kind));
    if (cat) items[cat.key].push(item);
    else more.push(item);
  }
  return { videos, items, more };
}

/** Decorative shapes around the featured video, chosen from the topic's art or slug. */
export function heroShapes(topic: { slug: string; art: string }): "leaves" | "geometric" | "bubbles" {
  const k = `${topic.art} ${topic.slug}`.toLowerCase();
  if (/animal|nature|plant|weather|clima|science|ciencia|garden|food|fruit/.test(k)) return "leaves";
  if (/shape|figura|number|numero|time|hora|timer|alphabet|abc|grammar|math/.test(k)) return "geometric";
  return "bubbles";
}
