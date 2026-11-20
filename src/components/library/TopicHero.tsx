"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { Art } from "@/components/ui/Art";
import { VideoPlayer } from "@/components/video/VideoPlayer";
import { recordActivityProgress } from "@/lib/actions/tasks";
import { KIND_ICON_3D } from "@/lib/library/kindIcons";
import { HERO_CATEGORIES, type HeroCategoryKey, type HeroData, type HeroItem, type HeroVideo } from "@/lib/library/topicHero";

// The Topic page: a featured video framed in purple on a mango background, a carousel of the
// topic's videos (arrows on desktop, swipe on touch) and the five 3D categories underneath.
// Inspired by PBS KIDS Videos: one big player, a thumbnail rail whose selected card is outlined
// and scrolled into view, and the cover + title changing together when another video is chosen.

const PURPLE = "#620D78";
const MANGO = "#FFC928";
const CORAL = "#FF5148";
const ORANGE = "#FF7600";

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export interface TopicHeroProps {
  title: string;
  subtitle?: string;
  art: string;
  shapes: "leaves" | "geometric" | "bubbles";
  data: HeroData;
  /** Student task: completion of a video activity is recorded when it ends. */
  assignmentId?: string;
  /** Shown above the hero (back link, Assign button…). */
  toolbar?: ReactNode;
}

export function TopicHero({ title, subtitle, art, shapes, data, assignmentId, toolbar }: TopicHeroProps) {
  const { videos } = data;
  const [selected, setSelected] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [durations, setDurations] = useState<Record<string, number>>({});
  const first = HERO_CATEGORIES.find((c) => data.items[c.key].length > 0)?.key ?? "videos";
  const [category, setCategory] = useState<HeroCategoryKey>(first);
  const heroRef = useRef<HTMLDivElement>(null);
  const sent = useRef(new Set<string>());
  const video = videos[selected] as HeroVideo | undefined;

  const noteDuration = useCallback((id: string, d: number) => {
    if (Number.isFinite(d) && d > 0) setDurations((m) => (m[id] ? m : { ...m, [id]: d }));
  }, []);

  // Choosing another video stops the one playing: the player unmounts and the new cover shows.
  const choose = useCallback((i: number, opts?: { scroll?: boolean }) => {
    setSelected(i);
    setPlaying(false);
    if (opts?.scroll) heroRef.current?.scrollIntoView({ behavior: reduced() ? "auto" : "smooth", block: "start" });
  }, []);

  const onEnded = useCallback(() => {
    const id = video?.activityId;
    if (!assignmentId || !id || sent.current.has(id)) return;
    sent.current.add(id);
    void recordActivityProgress({ assignmentId, activityId: id, score: 1, total: 1 }).catch(() => sent.current.delete(id));
  }, [assignmentId, video?.activityId]);

  const duration = video ? video.durationSec ?? durations[video.id] : undefined;

  return (
    <div className="-mx-4 sm:mx-0" data-testid="topic-hero">
      {toolbar && <div className="mb-3 flex flex-wrap items-center justify-between gap-3 px-4 sm:px-0">{toolbar}</div>}
      <section aria-label={`${title}: featured video`} className="relative overflow-hidden sm:rounded-t-[32px]" style={{ background: MANGO }}>
        <Shapes kind={shapes} />
        <div ref={heroRef} className="relative mx-auto max-w-[900px] scroll-mt-4 px-4 pb-6 pt-6 sm:px-8 sm:pb-7 sm:pt-7">
          <figure className="mx-auto max-w-[760px] overflow-hidden rounded-[26px] p-2 shadow-[0_18px_40px_-18px_rgba(98,13,120,0.55)] sm:p-3" style={{ background: PURPLE }}>
            <div className="relative aspect-video overflow-hidden rounded-[18px] bg-[#2a0634]" data-testid="hero-stage">
              {video ? (
                playing ? (
                  <div className="absolute inset-0 select-none caret-transparent" data-testid="hero-player">
                    <VideoPlayer
                      key={video.id}
                      bare
                      autoPlay
                      lockSeek={!!assignmentId}
                      video={{ id: video.id, title: video.title, description: "", source: video.source, url: video.url, youtubeId: video.youtubeId, captionsUrl: null, captionsLanguage: "es", coverUrl: null, durationSec: video.durationSec, practiceGameId: null }}
                      onEnded={onEnded}
                    />
                  </div>
                ) : (
                  <button type="button" onClick={() => setPlaying(true)} className="group absolute inset-0 block focus-visible:outline-none" aria-label={`Play ${video.title}`} data-testid="hero-play">
                    <Cover video={video} eager onDuration={noteDuration} />
                    <span className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" aria-hidden />
                    <span
                      className="absolute left-1/2 top-1/2 grid h-20 w-20 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-[5px] border-white shadow-[0_10px_30px_rgba(0,0,0,0.35)] transition-transform duration-150 group-hover:scale-105 group-active:scale-95 group-focus-visible:outline group-focus-visible:outline-4 group-focus-visible:outline-offset-4 group-focus-visible:outline-white motion-reduce:transition-none sm:h-24 sm:w-24"
                      style={{ background: PURPLE }}
                      aria-hidden
                    >
                      <svg viewBox="0 0 24 24" className="ml-1 h-9 w-9 fill-white sm:h-11 sm:w-11"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.4-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z" /></svg>
                    </span>
                    {duration ? <span className="absolute bottom-3 right-3 rounded-md bg-black/60 px-2 py-0.5 text-xs font-bold tabular-nums text-white" data-testid="hero-duration">{fmt(duration)}</span> : null}
                  </button>
                )
              ) : (
                <div className="absolute inset-0 grid place-items-center bg-[#FFF3CC]" data-testid="hero-cover">
                  <Art k={art} className="h-3/5 w-auto" label={title} />
                </div>
              )}
            </div>
            <figcaption className="px-3 pb-1 pt-2.5 text-center sm:pb-2 sm:pt-3.5">
              {/* One video: the topic's name, as in the mockup. Several: the chosen video's title, which changes with the cover. */}
              {video && videos.length > 1 ? (
                <>
                  <p className="font-display text-2xl font-extrabold leading-tight text-white sm:text-[2rem]" data-testid="hero-title" aria-live="polite">{video.title}</p>
                  <h1 className="mt-0.5 text-sm font-bold text-white/80 sm:text-base">{title}{subtitle ? ` · ${subtitle}` : ""}</h1>
                </>
              ) : (
                <>
                  <h1 className="font-display text-2xl font-extrabold leading-tight text-white sm:text-4xl" data-testid="hero-title">{title}</h1>
                  {(video?.title || subtitle) && <p className="mt-0.5 text-sm font-bold text-white/80 sm:text-base">{video ? video.title : subtitle}</p>}
                </>
              )}
            </figcaption>
          </figure>
          {videos.length > 1 && <Carousel videos={videos} selected={selected} durations={durations} onChoose={(i) => choose(i)} onDuration={noteDuration} />}
        </div>
      </section>

      <Categories data={data} category={category} onCategory={setCategory} />
      <CategoryPanel data={data} category={category} videoIndex={(id) => videos.findIndex((v) => v.id === id)} onPlayVideo={(i) => choose(i, { scroll: true })} selectedVideo={video?.id} />
    </div>
  );
}

/** The picture of a video: YouTube's thumbnail, or a frame of the hosted file. Never stretched. */
function Cover({ video, eager, onDuration }: { video: HeroVideo; eager?: boolean; onDuration: (id: string, d: number) => void }) {
  if (video.youtubeId) {
    // hqdefault is 4:3 with bars; object-cover in a 16:9 box crops the bars away.
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
      onLoadedMetadata={(e) => onDuration(video.id, e.currentTarget.duration)}
      className="pointer-events-none absolute inset-0 h-full w-full bg-[#2a0634] object-cover"
    />
  );
}

function Carousel({ videos, selected, durations, onChoose, onDuration }: { videos: HeroVideo[]; selected: number; durations: Record<string, number>; onChoose: (i: number) => void; onDuration: (id: string, d: number) => void }) {
  const track = useRef<HTMLUListElement>(null);
  const cards = useRef<Array<HTMLButtonElement | null>>([]);
  const [edges, setEdges] = useState({ start: true, end: false });

  const measure = useCallback(() => {
    const el = track.current;
    if (!el) return;
    setEdges({ start: el.scrollLeft <= 4, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4 });
  }, []);

  useEffect(() => {
    measure();
    const el = track.current;
    el?.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);
    return () => {
      el?.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
    };
  }, [measure]);

  // The selected card slides into view (only inside the rail: the page itself doesn't jump).
  useEffect(() => {
    const el = track.current;
    const card = cards.current[selected];
    if (!el || !card) return;
    const left = card.offsetLeft - el.offsetLeft;
    const right = left + card.offsetWidth;
    if (left < el.scrollLeft || right > el.scrollLeft + el.clientWidth) {
      el.scrollTo({ left: Math.max(0, left - (el.clientWidth - card.offsetWidth) / 2), behavior: reduced() ? "auto" : "smooth" });
    }
  }, [selected]);

  function page(dir: 1 | -1) {
    const el = track.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: reduced() ? "auto" : "smooth" });
  }

  // Left/Right arrows move between cards; Enter or Space plays the focused one.
  function onKey(e: KeyboardEvent<HTMLButtonElement>, i: number) {
    const next = e.key === "ArrowRight" ? i + 1 : e.key === "ArrowLeft" ? i - 1 : e.key === "Home" ? 0 : e.key === "End" ? videos.length - 1 : null;
    if (next === null || next < 0 || next >= videos.length) return;
    e.preventDefault();
    cards.current[next]?.focus();
    cards.current[next]?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: reduced() ? "auto" : "smooth" });
  }

  const arrow =
    "absolute top-[calc(50%-1.25rem)] z-10 hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full text-white shadow-[0_6px_16px_-6px_rgba(98,13,120,0.7)] transition hover:scale-105 active:scale-95 disabled:pointer-events-none disabled:opacity-0 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[#FF5148] motion-reduce:transition-none sm:grid";

  return (
    <div className="relative mt-5" role="region" aria-roledescription="carousel" aria-label="Videos in this topic" data-testid="hero-carousel">
      <button type="button" className={`${arrow} -left-5`} style={{ background: PURPLE }} onClick={() => page(-1)} disabled={edges.start} aria-label="Previous videos" data-testid="carousel-prev">
        <svg viewBox="0 0 24 24" className="h-6 w-6 fill-none stroke-current stroke-[3]"><path d="m15 5-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </button>
      <ul ref={track} className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 px-4 pb-3 pt-1 [scrollbar-width:none] sm:mx-0 sm:scroll-px-0 sm:px-0 [&::-webkit-scrollbar]:hidden">
        {videos.map((v, i) => {
          const on = i === selected;
          const d = v.durationSec ?? durations[v.id];
          return (
            <li key={v.id} className="w-[66%] shrink-0 snap-start sm:w-[calc((100%-1.5rem)/3)] lg:w-[calc((100%-2.25rem)/4)]">
              <button
                ref={(el) => {
                  cards.current[i] = el;
                }}
                type="button"
                onClick={() => onChoose(i)}
                onKeyDown={(e) => onKey(e, i)}
                aria-current={on ? "true" : undefined}
                aria-label={`${v.title}${on ? " (selected)" : ""}`}
                data-testid="carousel-card"
                className={`group block w-full rounded-2xl p-1.5 text-left transition duration-150 motion-reduce:transition-none hover:-translate-y-1 hover:shadow-[0_10px_22px_-12px_rgba(98,13,120,0.6)] active:translate-y-0 active:scale-[0.98] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[#FF5148] ${on ? "bg-[#F3E8F7] ring-[3px] ring-[#620D78]" : "bg-white ring-1 ring-black/5"}`}
              >
                <span className="relative block aspect-video overflow-hidden rounded-xl bg-[#2a0634]">
                  <Cover video={v} onDuration={onDuration} />
                  {d ? <span className="absolute bottom-1.5 right-1.5 rounded bg-black/60 px-1.5 text-[11px] font-bold tabular-nums text-white">{fmt(d)}</span> : null}
                  {on && (
                    <span className="absolute inset-0 grid place-items-center bg-[#620D78]/25" aria-hidden>
                      <span className="grid h-9 w-9 place-items-center rounded-full bg-white/95"><svg viewBox="0 0 24 24" className="ml-0.5 h-4 w-4" style={{ fill: PURPLE }}><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.4-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z" /></svg></span>
                    </span>
                  )}
                </span>
                <span className="mt-1.5 line-clamp-2 min-h-[2.5rem] px-1 text-sm font-bold leading-5" style={{ color: PURPLE }}>{v.title}</span>
              </button>
            </li>
          );
        })}
      </ul>
      <button type="button" className={`${arrow} -right-5`} style={{ background: PURPLE }} onClick={() => page(1)} disabled={edges.end} aria-label="Next videos" data-testid="carousel-next">
        <svg viewBox="0 0 24 24" className="h-6 w-6 fill-none stroke-current stroke-[3]"><path d="m9 5 7 7-7 7" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </button>
    </div>
  );
}

function Categories({ data, category, onCategory }: { data: HeroData; category: HeroCategoryKey; onCategory: (k: HeroCategoryKey) => void }) {
  return (
    <nav aria-label="Topic categories" className="border-b border-[#620D78]/10 bg-white px-3 py-4 shadow-[0_8px_20px_-16px_rgba(98,13,120,0.45)] sm:rounded-b-[32px] sm:px-6 sm:py-5">
      <ul className="mx-auto grid max-w-[900px] grid-cols-3 gap-2 sm:grid-cols-5 sm:gap-4" role="tablist">
        {HERO_CATEGORIES.map((c) => {
          const on = c.key === category;
          const n = data.items[c.key].length;
          return (
            <li key={c.key} className="contents">
              <button
                type="button"
                role="tab"
                id={`tab-${c.key}`}
                aria-selected={on}
                aria-controls="topic-category-panel"
                onClick={() => onCategory(c.key)}
                data-testid={`category-${c.key}`}
                className={`group flex flex-col items-center gap-1 rounded-2xl border-2 px-1 pb-2 pt-1.5 transition duration-150 motion-reduce:transition-none hover:-translate-y-1 hover:shadow-[0_12px_24px_-14px_rgba(98,13,120,0.55)] active:translate-y-0 active:scale-95 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[#FF5148] ${on ? "border-[#620D78] bg-[#F3E8F7]" : "border-transparent"}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={c.icon} alt="" width={160} height={160} className="h-16 w-16 object-contain sm:h-24 sm:w-24" />
                <span className="font-display text-[15px] font-extrabold leading-tight sm:text-lg" style={{ color: PURPLE }}>{c.label}</span>
                <span className="text-xs font-semibold text-[#620D78]/60">{n === 0 ? "Empty" : `${n} ${n === 1 ? "item" : "items"}`}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function CategoryPanel({ data, category, videoIndex, onPlayVideo, selectedVideo }: { data: HeroData; category: HeroCategoryKey; videoIndex: (id: string) => number; onPlayVideo: (i: number) => void; selectedVideo?: string }) {
  const cat = HERO_CATEGORIES.find((c) => c.key === category)!;
  const items = data.items[category];
  return (
    <div id="topic-category-panel" role="tabpanel" aria-labelledby={`tab-${category}`} className="mt-5 px-4 sm:px-0" data-testid="category-panel">
      {items.length === 0 ? (
        <p className="rounded-2xl border-2 border-dashed border-[#620D78]/20 bg-white px-5 py-8 text-center font-semibold text-ink-2" data-testid="category-empty">{cat.empty}</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((it) => (
            <li key={it.id}>
              <ItemCard item={it} icon={cat.icon} active={!!it.videoId && it.videoId === selectedVideo} onPlay={it.videoId ? () => onPlayVideo(videoIndex(it.videoId!)) : undefined} />
            </li>
          ))}
        </ul>
      )}
      {data.more.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-2 font-display text-lg font-extrabold" style={{ color: PURPLE }}>Worksheets &amp; listening</h2>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.more.map((it) => (
              <li key={it.id}>
                <ItemCard item={it} icon={KIND_ICON_3D[it.kind]} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function ItemCard({ item, icon, active, onPlay }: { item: HeroItem; icon?: string; active?: boolean; onPlay?: () => void }) {
  const cls = `flex w-full items-center gap-3 rounded-2xl border-2 bg-white p-3 text-left transition duration-150 motion-reduce:transition-none hover:-translate-y-0.5 hover:shadow-[0_10px_22px_-14px_rgba(98,13,120,0.55)] active:scale-[0.98] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[#FF5148] ${active ? "border-[#620D78] bg-[#F3E8F7]" : "border-[#620D78]/10"}`;
  const body = (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {icon ? <img src={icon} alt="" width={48} height={48} className="h-12 w-12 shrink-0 object-contain" /> : <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[#FFF3CC] text-2xl" aria-hidden>🖨️</span>}
      <span className="min-w-0 flex-1">
        <span className="line-clamp-2 font-display text-base font-extrabold leading-snug text-ink">{item.title}</span>
      </span>
      {item.done ? (
        <span className="font-display text-2xl text-leaf" aria-label="Done">✓</span>
      ) : (
        <span className="shrink-0 rounded-full px-3 py-1.5 text-sm font-bold text-white" style={{ background: PURPLE }}>{onPlay ? "Play" : "Open"}</span>
      )}
    </>
  );
  const card = onPlay ? (
    <button type="button" onClick={onPlay} className={cls} data-testid="category-item">{body}</button>
  ) : (
    <Link href={item.href} className={cls} data-testid="category-item">{body}</Link>
  );
  if (!item.assignHref) return card;
  return (
    <div className="flex flex-col gap-1">
      {card}
      <span className="flex justify-end gap-3 px-2 text-sm font-bold">
        {onPlay && <Link href={item.href} className="text-[#620D78] hover:underline">Open</Link>}
        <Link href={item.assignHref} className="text-[#620D78] hover:underline" data-testid="assign-one" aria-label={`Assign only ${item.title}`}>Assign this activity</Link>
      </span>
    </div>
  );
}

/** Big shapes at the edges, the centre left clear for the video. Hidden from assistive tech. */
function Shapes({ kind }: { kind: "leaves" | "geometric" | "bubbles" }) {
  const side = "pointer-events-none absolute hidden md:block";
  if (kind === "leaves") {
    return (
      <div aria-hidden>
        <svg viewBox="0 0 200 220" className={`${side} -left-10 top-6 w-[210px] lg:w-[250px]`}><Monstera fill={CORAL} /></svg>
        <svg viewBox="0 0 200 260" className={`${side} -left-4 bottom-[-30px] w-[150px] lg:w-[190px]`}><Branch fill={ORANGE} /></svg>
        <svg viewBox="0 0 200 220" className={`${side} -right-12 -top-4 w-[230px] -scale-x-100 lg:w-[270px]`}><Monstera fill={CORAL} /></svg>
        <svg viewBox="0 0 200 260" className={`${side} -right-6 bottom-[-20px] w-[160px] -scale-x-100 lg:w-[200px]`}><Branch fill={ORANGE} /></svg>
      </div>
    );
  }
  if (kind === "geometric") {
    return (
      <div aria-hidden>
        <svg viewBox="0 0 200 200" className={`${side} -left-14 top-8 w-[190px]`}><circle cx="100" cy="100" r="90" fill={CORAL} /></svg>
        <svg viewBox="0 0 200 200" className={`${side} -left-6 bottom-4 w-[150px]`}><path d="M100 14 188 180H12Z" fill={ORANGE} /></svg>
        <svg viewBox="0 0 200 200" className={`${side} -right-10 top-4 w-[170px] rotate-12`}><rect x="20" y="20" width="160" height="160" rx="26" fill={ORANGE} /></svg>
        <svg viewBox="0 0 200 200" className={`${side} -right-12 bottom-0 w-[180px]`}><circle cx="100" cy="100" r="90" fill={CORAL} /></svg>
      </div>
    );
  }
  return (
    <div aria-hidden>
      <svg viewBox="0 0 200 200" className={`${side} -left-16 top-2 w-[220px]`}><path d="M100 10c50 0 90 30 90 80s-40 100-95 100S10 150 10 100 50 10 100 10Z" fill={CORAL} /></svg>
      <svg viewBox="0 0 100 100" className={`${side} left-10 bottom-8 w-[70px]`}><path d="M50 4 61 39l35 11-35 11-11 35-11-35L4 50l35-11Z" fill={ORANGE} /></svg>
      <svg viewBox="0 0 200 200" className={`${side} -right-16 bottom-[-20px] w-[240px]`}><path d="M110 12c48 6 82 46 76 96s-52 84-100 78S12 140 18 92 62 6 110 12Z" fill={ORANGE} /></svg>
      <svg viewBox="0 0 100 100" className={`${side} right-12 top-8 w-[64px]`}><path d="M50 4 61 39l35 11-35 11-11 35-11-35L4 50l35-11Z" fill={CORAL} /></svg>
    </div>
  );
}

function Monstera({ fill }: { fill: string }) {
  // A split leaf: heart-shaped blade, mango slits cut in from the edge, and a midrib.
  return (
    <g transform="rotate(-18 100 110)">
      <path d="M100 214c-2-14-3-26-2-38" stroke={fill} strokeWidth="8" strokeLinecap="round" fill="none" />
      <path d="M100 182C46 164 6 126 10 78 13 38 44 12 80 16c9 1 15 4 20 9 5-5 11-8 20-9 36-4 67 22 70 62 4 48-36 86-90 104Z" fill={fill} />
      <g fill={MANGO}>
        <path d="M12 92 78 104 74 112Z" />
        <path d="M18 54 82 86 76 93Z" />
        <path d="M48 22 88 70 81 75Z" />
        <path d="M188 92 122 104 126 112Z" />
        <path d="M182 54 118 86 124 93Z" />
        <path d="M152 22 112 70 119 75Z" />
      </g>
      <path d="M100 30v150" stroke={MANGO} strokeWidth="5" strokeLinecap="round" opacity="0.7" />
    </g>
  );
}

function Branch({ fill }: { fill: string }) {
  return (
    <g fill={fill}>
      <path d="M96 258c4-70 10-150 30-240" stroke={fill} strokeWidth="7" fill="none" strokeLinecap="round" />
      <path d="M110 70c-30-6-52-26-56-50 26 0 50 18 56 50ZM116 52c20-20 46-28 70-20-8 24-34 36-70 20ZM104 128c-34-4-60-24-66-52 30 0 56 20 66 52ZM110 112c22-22 52-30 78-20-10 26-40 38-78 20ZM100 188c-34-2-62-22-70-50 32-2 60 18 70 50ZM104 172c22-24 52-34 80-24-10 28-42 42-80 24Z" />
    </g>
  );
}
