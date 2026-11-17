"use client";

import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore, type KeyboardEvent, type MouseEvent } from "react";
import { Shapes } from "@/components/library/TopicHero";
import { GALLERY_TYPE_LABEL, featuredOf, fmtDuration, rowsFor, watchHref, type GalleryRow, type GalleryVideo } from "@/lib/library/videoGallery";

// Library › Videos, inspired by PBS KIDS Videos (pbskids.org/videos):
// - a featured video in a big white-framed card on a colored, shaped background;
// - a white band of "logos" (here: the topics) that pages with purple arrows;
// - rows of thumbnail-first cards with title and duration;
// - hovering or focusing a card draws a thick colored ring around the thumbnail (box-shadow, so
//   nothing moves and the neighbours stay in place); the ring fades in over 0.3 s, never with
//   reduced motion.
// Adapted to LextroSpeak: our purple/mango/coral palette, one row per Library topic, a filter by
// the topics' categories, arrow keys inside a row, and returning to the same category, scroll
// position and row position after watching a video.

export const PURPLE = "#620D78";
const MANGO = "#FFC928";

const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// ── Durations of hosted files, read from their metadata once and shared by every card ──
const durations = new Map<string, number>();
const listeners = new Set<() => void>();
let durationsLoaded = false;
function loadDurations() {
  if (durationsLoaded || typeof window === "undefined") return;
  durationsLoaded = true;
  try {
    const raw = JSON.parse(sessionStorage.getItem("lx:video-durations") ?? "{}") as Record<string, number>;
    for (const [k, v] of Object.entries(raw)) if (v > 0) durations.set(k, v);
  } catch {}
}
function noteDuration(id: string, d: number) {
  if (!Number.isFinite(d) || d <= 0 || durations.get(id) === d) return;
  durations.set(id, d);
  try {
    sessionStorage.setItem("lx:video-durations", JSON.stringify(Object.fromEntries(durations)));
  } catch {}
  listeners.forEach((l) => l());
}
export function useDuration(v: GalleryVideo): number | null {
  const d = useSyncExternalStore(
    (cb) => {
      loadDurations();
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => durations.get(v.id) ?? 0,
    () => 0,
  );
  return v.durationSec ?? (d || null);
}

// ── Where the gallery was when a video was opened ──
interface SavedSpot {
  cat: string;
  y: number;
  rows: Record<string, number>;
  focus: string | null;
  pending: boolean;
}
const spotKey = (grade: string) => `lx:video-gallery:${grade}`;
function readSpot(grade: string): SavedSpot | null {
  try {
    return JSON.parse(sessionStorage.getItem(spotKey(grade)) ?? "null") as SavedSpot | null;
  } catch {
    return null;
  }
}
function writeSpot(grade: string, s: SavedSpot) {
  try {
    sessionStorage.setItem(spotKey(grade), JSON.stringify(s));
  } catch {}
}

export interface VideoGalleryProps {
  rows: GalleryRow[];
  categories: string[];
  grade: string;
  initialCategory: string;
}

export function VideoGallery({ rows, categories, grade, initialCategory }: VideoGalleryProps) {
  const [category, setCategory] = useState(categories.includes(initialCategory) ? initialCategory : "");
  const visible = useMemo(() => rowsFor(rows, category), [rows, category]);
  const featured = featuredOf(visible);
  const tracks = useRef(new Map<string, HTMLUListElement>());
  const rowEls = useRef(new Map<string, HTMLElement>());

  const registerTrack = useCallback((slug: string, el: HTMLUListElement | null) => {
    if (el) tracks.current.set(slug, el);
    else tracks.current.delete(slug);
  }, []);

  function chooseCategory(c: string) {
    setCategory(c);
    const url = new URL(window.location.href);
    if (c) url.searchParams.set("cat", c);
    else url.searchParams.delete("cat");
    window.history.replaceState(window.history.state, "", url.toString());
  }

  // Opening a video remembers the category, the page scroll, each row's scroll and (keyboard) the card.
  const remember = useCallback(
    (videoId: string, byKeyboard: boolean) => {
      const rowsPos: Record<string, number> = {};
      tracks.current.forEach((el, slug) => {
        rowsPos[slug] = el.scrollLeft;
      });
      writeSpot(grade, { cat: category, y: window.scrollY, rows: rowsPos, focus: byKeyboard ? videoId : null, pending: true });
    },
    [grade, category],
  );

  // Coming back: put everything where it was (only once, right after returning from a video).
  // The category is read from the address bar: after the browser's Back, Next.js may reuse the
  // page rendered before the category was chosen.
  const [restoreFocus, setRestoreFocus] = useState<string | null>(null);
  const pendingSpot = useRef<SavedSpot | null>(null);
  useLayoutEffect(() => {
    const urlCat = new URLSearchParams(window.location.search).get("cat") ?? "";
    const c = categories.includes(urlCat) ? urlCat : "";
    const s = readSpot(grade);
    if (s?.pending) {
      writeSpot(grade, { ...s, pending: false });
      if ((s.cat || "") === c) pendingSpot.current = s;
    }
    if (c !== category) setCategory(c);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useLayoutEffect(() => {
    const s = pendingSpot.current;
    if (!s || (s.cat || "") !== category) return;
    pendingSpot.current = null;
    for (const [slug, left] of Object.entries(s.rows)) {
      const el = tracks.current.get(slug);
      if (el) el.scrollLeft = left;
    }
    const apply = () => window.scrollTo({ top: s.y, behavior: "instant" as ScrollBehavior });
    apply();
    // Next.js may scroll to the top after the first paint of a navigation: apply again.
    requestAnimationFrame(() => requestAnimationFrame(apply));
    const t = setTimeout(apply, 120);
    if (s.focus) setRestoreFocus(s.focus);
    return () => clearTimeout(t);
  }, [category]);

  function jumpToRow(slug: string) {
    const el = rowEls.current.get(slug);
    if (!el) return;
    el.scrollIntoView({ behavior: reduced() ? "auto" : "smooth", block: "start" });
    const first = el.querySelector<HTMLAnchorElement>("[data-video-card][tabindex='0']");
    first?.focus({ preventScroll: true });
  }

  if (rows.length === 0) {
    return <p className="rounded-[22px] border-2 border-dashed border-line p-8 text-center font-bold text-ink-2">No videos for this grade yet.</p>;
  }

  return (
    <div className="-mx-4 sm:mx-0" data-testid="video-gallery">
      {featured && <Featured video={featured.video} row={featured.row} href={watchHref(featured.video.id, { grade, category, topic: featured.row.slug })} onOpen={remember} />}

      <TopicBand rows={visible} onJump={jumpToRow} />

      <section aria-label="Videos by topic" className="bg-[#FFF3CC] px-4 pb-10 pt-6 sm:rounded-b-[32px] sm:px-8">
        {categories.length > 1 && (
          <div role="group" aria-label="Category" className="mb-6 flex flex-wrap gap-2" data-testid="video-categories">
            {["", ...categories].map((c) => {
              const on = c === category;
              const n = (c ? rows.filter((r) => r.category === c) : rows).reduce((a, r) => a + r.videos.length, 0);
              return (
                <button
                  key={c || "all"}
                  type="button"
                  aria-pressed={on}
                  onClick={() => chooseCategory(c)}
                  data-testid="video-category"
                  className={`rounded-full px-4 py-2 text-sm font-extrabold transition-[box-shadow,background-color] duration-300 motion-reduce:transition-none focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_#fff,0_0_0_6px_#FF5148] ${on ? "bg-[#620D78] text-white" : "bg-white text-[#620D78] shadow-[0_0_0_1px_rgba(98,13,120,0.15)] hover:shadow-[0_0_0_3px_#620D78]"}`}
                >
                  {c || "All"} <span className={on ? "text-white/75" : "text-[#620D78]/55"}>{n}</span>
                </button>
              );
            })}
          </div>
        )}

        <div className="space-y-8">
          {visible.map((row) => (
            <section
              key={row.slug}
              ref={(el) => {
                if (el) rowEls.current.set(row.slug, el);
                else rowEls.current.delete(row.slug);
              }}
              aria-labelledby={`row-${row.slug}`}
              className="scroll-mt-4"
              data-testid="video-row"
            >
              <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <h2 id={`row-${row.slug}`} className="font-display text-2xl font-extrabold" style={{ color: PURPLE }}>
                  {row.titleEs} <span className="text-base font-bold text-[#620D78]/60">· {row.titleEn}</span>
                </h2>
                <Link href={`/teacher/library/topics/${row.slug}?grade=${grade}`} className="text-sm font-bold text-[#620D78] hover:underline">
                  Open topic ›
                </Link>
              </div>
              <VideoRow
                label={`${row.titleEs}: videos`}
                rowKey={row.slug}
                videos={row.videos}
                hrefFor={(v) => watchHref(v.id, { grade, category, topic: row.slug })}
                onOpen={remember}
                registerTrack={registerTrack}
                focusId={restoreFocus}
              />
            </section>
          ))}
        </div>
      </section>
    </div>
  );
}

/** The featured video: a big card with a white frame on mango, like PBS KIDS' masthead. */
function Featured({ video, row, href, onOpen }: { video: GalleryVideo; row: GalleryRow; href: string; onOpen: (id: string, byKeyboard: boolean) => void }) {
  const d = useDuration(video);
  return (
    <section aria-label="Featured video" className="relative overflow-hidden sm:rounded-t-[32px]" style={{ background: MANGO }} data-testid="video-featured">
      <Shapes kind="bubbles" />
      <div className="relative mx-auto max-w-[500px] px-4 py-6 sm:py-7">
        <Link
          href={href}
          onClick={(e: MouseEvent) => onOpen(video.id, e.detail === 0)}
          className="group block rounded-[24px] focus-visible:outline-none"
          aria-label={`Play ${video.title} (${GALLERY_TYPE_LABEL[video.type]}${d ? `, ${fmtDuration(d)}` : ""})`}
          data-testid="featured-card"
        >
          <span className="relative block overflow-hidden rounded-[24px] border-4 border-white bg-white transition-shadow duration-300 motion-reduce:transition-none group-hover:shadow-[0_0_0_6px_#620D78] group-focus-visible:shadow-[0_0_0_6px_#620D78,0_0_0_10px_#FF5148]">
            <span className="relative block aspect-video bg-[#2a0634]">
              <Thumb video={video} eager />
              <span className="absolute left-1/2 top-1/2 grid h-16 w-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-4 border-white shadow-[0_8px_24px_rgba(0,0,0,0.35)] sm:h-20 sm:w-20" style={{ background: PURPLE }} aria-hidden>
                <PlayIcon className="ml-1 h-8 w-8 fill-white sm:h-9 sm:w-9" />
              </span>
              <TypeBadge type={video.type} className="absolute bottom-2.5 left-2.5" />
              {d ? <DurationChip d={d} className="absolute bottom-2.5 right-2.5" /> : null}
            </span>
            <span className="block px-4 py-2.5 text-center" style={{ background: PURPLE }}>
              <span className="block font-display text-lg font-extrabold leading-tight text-white sm:text-xl">{video.title}</span>
              <span className="block text-sm font-bold text-white/80">{row.titleEs}</span>
            </span>
          </span>
        </Link>
      </div>
    </section>
  );
}

/** White band of topic "logos" under the featured video; choosing one jumps to its row. */
function TopicBand({ rows, onJump }: { rows: GalleryRow[]; onJump: (slug: string) => void }) {
  const track = useRef<HTMLUListElement>(null);
  const edges = useEdges(track);
  if (rows.length < 2) return null;
  return (
    <nav aria-label="Topics" className="relative bg-white px-4 py-4 sm:px-16" data-testid="topic-band">
      <Arrow dir={-1} hidden={edges.start} onClick={() => pageBy(track.current, -1)} label="Previous topics" className="left-3" />
      <ul ref={track} className="flex snap-x snap-mandatory gap-3 overflow-x-auto p-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {rows.map((r) => (
          <li key={r.slug} className="shrink-0 snap-start">
            <button
              type="button"
              onClick={() => onJump(r.slug)}
              data-testid="topic-chip"
              className="flex h-14 items-center gap-2 rounded-2xl bg-[#FFF3CC] px-4 font-display text-base font-extrabold text-[#620D78] transition-shadow duration-300 motion-reduce:transition-none hover:shadow-[0_0_0_5px_#620D78] focus-visible:outline-none focus-visible:shadow-[0_0_0_5px_#620D78,0_0_0_9px_#FF5148]"
            >
              {r.titleEs}
              <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold text-[#620D78]/70">{r.videos.length}</span>
            </button>
          </li>
        ))}
      </ul>
      <Arrow dir={1} hidden={edges.end} onClick={() => pageBy(track.current, 1)} label="Next topics" className="right-3" />
    </nav>
  );
}

export interface VideoRowProps {
  label: string;
  rowKey: string;
  videos: GalleryVideo[];
  hrefFor: (v: GalleryVideo) => string;
  onOpen?: (id: string, byKeyboard: boolean) => void;
  registerTrack?: (key: string, el: HTMLUListElement | null) => void;
  /** Watch page: the video playing now (outlined, "Now playing"). */
  currentId?: string;
  /** Focus this card once it is in the row (returning to the gallery by keyboard). */
  focusId?: string | null;
}

/**
 * A row of cards: arrows on desktop when there is more to see, swipe with snap on touch.
 * One Tab stop per row; Left/Right (Home/End) move between its cards, Enter opens one.
 */
export function VideoRow({ label, rowKey, videos, hrefFor, onOpen, registerTrack, currentId, focusId }: VideoRowProps) {
  const track = useRef<HTMLUListElement>(null);
  const cards = useRef<Array<HTMLAnchorElement | null>>([]);
  const start = Math.max(0, currentId ? videos.findIndex((v) => v.id === currentId) : 0);
  const [active, setActive] = useState(start);
  const edges = useEdges(track);
  const [near, setNear] = useState(false);

  // Thumbnails load only when the row comes close to the screen.
  useEffect(() => {
    const el = track.current;
    if (!el || typeof IntersectionObserver === "undefined") return setNear(true);
    const io = new IntersectionObserver((es) => es.some((e) => e.isIntersecting) && (setNear(true), io.disconnect()), { rootMargin: "300px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Watch page: the playing video slides into view inside its row (the page itself doesn't move).
  useEffect(() => {
    if (!currentId) return;
    const el = track.current;
    const card = cards.current[start];
    if (!el || !card) return;
    const left = card.parentElement!.offsetLeft - el.offsetLeft;
    el.scrollLeft = Math.max(0, left - (el.clientWidth - card.offsetWidth) / 2);
  }, [currentId, start]);

  useEffect(() => {
    if (!focusId) return;
    const i = videos.findIndex((v) => v.id === focusId);
    if (i < 0) return;
    setActive(i);
    cards.current[i]?.focus({ preventScroll: true });
  }, [focusId, videos]);

  function onKey(e: KeyboardEvent<HTMLAnchorElement>, i: number) {
    const next = e.key === "ArrowRight" ? i + 1 : e.key === "ArrowLeft" ? i - 1 : e.key === "Home" ? 0 : e.key === "End" ? videos.length - 1 : null;
    if (next === null) return;
    e.preventDefault();
    if (next < 0 || next >= videos.length) return;
    setActive(next);
    const card = cards.current[next];
    card?.focus({ preventScroll: true });
    card?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: reduced() ? "auto" : "smooth" });
  }

  return (
    <div className="relative sm:px-14" role="region" aria-roledescription="carousel" aria-label={label} data-testid="video-row-track">
      <p className="sr-only" id={`hint-${rowKey}`}>Use the left and right arrow keys to move between videos.</p>
      <Arrow dir={-1} hidden={edges.start} onClick={() => pageBy(track.current, -1)} label="Previous videos" className="left-0 top-[calc(50%-1.25rem)]" />
      <ul
        ref={(el) => {
          track.current = el;
          // A ref callback (not an effect): the gallery restores row positions in a layout effect.
          registerTrack?.(rowKey, el);
        }}
        className="-mx-2 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-2 px-2 pb-3 pt-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {videos.map((v, i) => (
          <li key={v.id} className="w-[72%] shrink-0 snap-start sm:w-[calc((100%-1rem)/2)] md:w-[calc((100%-2rem)/3)] xl:w-[calc((100%-3rem)/4)]">
            <VideoCard
              video={v}
              href={hrefFor(v)}
              current={v.id === currentId}
              load={near}
              tabIndex={i === active ? 0 : -1}
              describedBy={`hint-${rowKey}`}
              cardRef={(el) => {
                cards.current[i] = el;
              }}
              onFocus={() => setActive(i)}
              onKeyDown={(e) => onKey(e, i)}
              onOpen={onOpen}
            />
          </li>
        ))}
      </ul>
      <Arrow dir={1} hidden={edges.end} onClick={() => pageBy(track.current, 1)} label="Next videos" className="right-0 top-[calc(50%-1.25rem)]" />
    </div>
  );
}

function VideoCard({ video, href, current, load, tabIndex, describedBy, cardRef, onFocus, onKeyDown, onOpen }: { video: GalleryVideo; href: string; current: boolean; load: boolean; tabIndex: number; describedBy: string; cardRef: (el: HTMLAnchorElement | null) => void; onFocus: () => void; onKeyDown: (e: KeyboardEvent<HTMLAnchorElement>) => void; onOpen?: (id: string, byKeyboard: boolean) => void }) {
  const d = useDuration(video);
  const type = GALLERY_TYPE_LABEL[video.type];
  return (
    <Link
      ref={cardRef}
      href={href}
      tabIndex={tabIndex}
      onFocus={onFocus}
      onKeyDown={onKeyDown}
      onClick={(e: MouseEvent) => onOpen?.(video.id, e.detail === 0)}
      aria-current={current ? "true" : undefined}
      aria-label={`${video.title}, ${type}${d ? `, ${fmtDuration(d)}` : ""}${current ? ", now playing" : ""}`}
      aria-describedby={describedBy}
      data-video-card
      data-testid="video-card"
      className="group block rounded-2xl text-center [-webkit-tap-highlight-color:transparent] focus-visible:outline-none"
    >
      <span
        className={`relative block aspect-video overflow-hidden rounded-2xl border-[3px] bg-[#2a0634] transition-shadow duration-300 motion-reduce:transition-none group-hover:shadow-[0_0_0_5px_#620D78] group-active:shadow-[0_0_0_5px_#620D78] group-focus-visible:shadow-[0_0_0_5px_#620D78,0_0_0_9px_#FF5148] ${current ? "border-[#620D78] shadow-[0_0_0_5px_#620D78]" : "border-white"}`}
        data-testid="video-thumb"
      >
        {load && <Thumb video={video} />}
        {current ? (
          <span className="absolute inset-0 grid place-items-center bg-[#620D78]/45" aria-hidden>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-extrabold text-[#620D78]">Now playing</span>
          </span>
        ) : null}
        <TypeBadge type={video.type} className="absolute bottom-1.5 left-1.5" small />
        {d ? <DurationChip d={d} className="absolute bottom-1.5 right-1.5" /> : null}
      </span>
      <span className="mt-2 line-clamp-2 block px-1 font-display text-[15px] font-extrabold leading-5" style={{ color: PURPLE }}>
        {video.title}
      </span>
    </Link>
  );
}

/** YouTube's thumbnail, or a frame of the hosted file (its metadata also gives the duration). */
function Thumb({ video, eager }: { video: GalleryVideo; eager?: boolean }) {
  if (video.youtubeId) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={`https://i.ytimg.com/vi/${video.youtubeId}/hqdefault.jpg`} alt="" loading={eager ? "eager" : "lazy"} className="absolute inset-0 h-full w-full object-cover" />;
  }
  return (
    <video
      src={`${video.url}#t=1`}
      muted
      playsInline
      preload="metadata"
      tabIndex={-1}
      aria-hidden
      onLoadedMetadata={(e) => noteDuration(video.id, e.currentTarget.duration)}
      className="pointer-events-none absolute inset-0 h-full w-full object-cover"
    />
  );
}

export function TypeBadge({ type, className = "", small }: { type: GalleryVideo["type"]; className?: string; small?: boolean }) {
  const music = type === "MUSIC";
  return (
    <span className={`${className} inline-flex items-center gap-1 rounded-full font-extrabold uppercase tracking-wide text-white ${small ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs"}`} style={{ background: music ? "#7A2DB8" : "#1C6FA8" }}>
      {music ? "♪" : <PlayIcon className="h-2.5 w-2.5 fill-white" />} {GALLERY_TYPE_LABEL[type]}
    </span>
  );
}

function DurationChip({ d, className = "" }: { d: number; className?: string }) {
  return <span className={`${className} rounded-md bg-black/65 px-1.5 py-0.5 text-[11px] font-bold tabular-nums text-white`}>{fmtDuration(d)}</span>;
}

export function PlayIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.4-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z" />
    </svg>
  );
}

/** Purple square arrows (desktop only), shown only when there is content off-screen on that side. */
function Arrow({ dir, hidden, onClick, label, className }: { dir: 1 | -1; hidden: boolean; onClick: () => void; label: string; className: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      tabIndex={-1}
      aria-hidden={hidden || undefined}
      data-testid={dir === 1 ? "row-next" : "row-prev"}
      className={`absolute top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 place-items-center rounded-2xl text-white shadow-[0_6px_16px_-6px_rgba(98,13,120,0.7)] transition-[box-shadow,opacity] duration-300 motion-reduce:transition-none hover:shadow-[0_0_0_4px_#fff,0_0_0_8px_#620D78] sm:grid ${hidden ? "pointer-events-none opacity-0" : "opacity-100"} ${className}`}
      style={{ background: PURPLE }}
    >
      <svg viewBox="0 0 24 24" className="h-7 w-7 fill-none stroke-current stroke-[3.5]" aria-hidden>
        <path d={dir === 1 ? "m9 5 7 7-7 7" : "m15 5-7 7 7 7"} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

function pageBy(el: HTMLElement | null, dir: 1 | -1) {
  if (el) el.scrollBy({ left: dir * el.clientWidth * 0.9, behavior: reduced() ? "auto" : "smooth" });
}

/** Whether a scroller is at its start / end (to show or hide the arrows). */
function useEdges(ref: React.RefObject<HTMLElement | null>) {
  const [edges, setEdges] = useState({ start: true, end: true });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setEdges({ start: el.scrollLeft <= 4, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4 });
    measure();
    el.addEventListener("scroll", measure, { passive: true });
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(measure) : null;
    ro?.observe(el);
    window.addEventListener("resize", measure);
    return () => {
      el.removeEventListener("scroll", measure);
      ro?.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [ref]);
  return edges;
}
