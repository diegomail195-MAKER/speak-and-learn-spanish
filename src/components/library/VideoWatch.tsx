"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Shapes } from "@/components/library/TopicHero";
import { PURPLE, PlayIcon, TypeBadge, VideoRow, useDuration } from "@/components/library/VideoGallery";
import { ButtonLink } from "@/components/ui/Button";
import { VideoPlayer } from "@/components/video/VideoPlayer";
import { GALLERY_TYPE_LABEL, fmtDuration, watchHref, type GalleryRow, type GalleryVideo } from "@/lib/library/videoGallery";
import type { PlayVideo } from "@/lib/videos";

// A Library video playing inside LextroSpeak: the platform's player in the purple frame on mango,
// a "Next video" button (PBS KIDS' skip-to-next) and the topic's other videos in a row underneath.
// Nothing here links outside the platform; YouTube's own player keeps its logo/title links.

export function VideoWatch({ video, row, grade, category, backHref, assignHref }: { video: GalleryVideo; row: GalleryRow | null; grade: string | null; category: string; backHref: string; assignHref: string | null }) {
  const [ended, setEnded] = useState(false);
  const d = useDuration(video);
  const i = row ? row.videos.findIndex((v) => v.id === video.id) : -1;
  const next = row && i >= 0 && i < row.videos.length - 1 ? row.videos[i + 1] : null;
  const hrefFor = (v: GalleryVideo) => watchHref(v.id, { grade, category, topic: row?.slug });
  const play = useMemo<PlayVideo>(
    () => ({ id: video.id, title: video.title, description: "", source: video.source, url: video.url, youtubeId: video.youtubeId, captionsUrl: null, captionsLanguage: "es", coverUrl: null, durationSec: video.durationSec, practiceGameId: null }),
    [video],
  );
  const pill = "inline-flex h-9 items-center gap-2 rounded-full bg-white px-4 text-sm font-bold text-[#620D78] ring-1 ring-[#620D78]/20 hover:bg-[#F3E8F7]";

  return (
    <div className="-mx-4 sm:mx-0" data-testid="video-watch">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3 px-4 sm:px-0">
        <Link href={backHref} className="text-sm font-bold text-sky hover:underline" data-testid="back-to-videos">‹ Videos</Link>
        <span className="flex flex-wrap items-center gap-2">
          {row && <Link href={`/teacher/library/topics/${row.slug}${grade ? `?grade=${grade}` : ""}`} className={pill}>Open topic</Link>}
          {assignHref && <ButtonLink href={assignHref} size="sm">Assign this video</ButtonLink>}
        </span>
      </div>

      <section aria-label={`${video.title}: video`} className="relative overflow-hidden sm:rounded-t-[32px]" style={{ background: "#FFC928" }}>
        <Shapes kind="bubbles" />
        <div className="relative mx-auto max-w-[900px] px-4 pb-6 pt-6 sm:px-8">
          <figure className="mx-auto max-w-[800px] overflow-hidden rounded-[26px] p-2 shadow-[0_18px_40px_-18px_rgba(98,13,120,0.55)] sm:p-3" style={{ background: PURPLE }}>
            <div className="relative aspect-video overflow-hidden rounded-[18px] bg-black" data-testid="watch-stage">
              <VideoPlayer key={video.id} bare autoPlay video={play} onEnded={() => setEnded(true)} />
              {ended && next && (
                <Link href={hrefFor(next)} className="absolute inset-x-0 bottom-0 flex items-center gap-3 bg-gradient-to-t from-black/80 to-transparent p-4 pt-10 text-left text-white focus-visible:outline focus-visible:outline-4 focus-visible:-outline-offset-4 focus-visible:outline-[#FF5148]" data-testid="watch-up-next">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full border-4 border-white" style={{ background: PURPLE }}><PlayIcon className="ml-0.5 h-5 w-5 fill-white" /></span>
                  <span className="min-w-0">
                    <span className="block text-xs font-bold uppercase tracking-wide text-white/80">Up next</span>
                    <span className="block truncate font-display text-lg font-extrabold">{next.title}</span>
                  </span>
                </Link>
              )}
            </div>
            <figcaption className="flex flex-wrap items-center justify-between gap-3 px-3 pb-1 pt-3">
              <span className="min-w-0">
                <h1 className="font-display text-2xl font-extrabold leading-tight text-white sm:text-3xl" data-testid="watch-title">{video.title}</h1>
                <span className="mt-1 flex flex-wrap items-center gap-2 text-sm font-bold text-white/80">
                  <TypeBadge type={video.type} small />
                  {row && <span>{row.titleEs}</span>}
                  {d ? <span className="tabular-nums">· {fmtDuration(d)}</span> : null}
                </span>
              </span>
              {next && (
                <Link href={hrefFor(next)} className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full bg-white px-4 text-sm font-extrabold text-[#620D78] transition-shadow duration-300 motion-reduce:transition-none hover:shadow-[0_0_0_4px_#FFC928] focus-visible:outline-none focus-visible:shadow-[0_0_0_4px_#FFC928,0_0_0_8px_#FF5148]" aria-label={`Next video: ${next.title}`} data-testid="watch-next">
                  Next video
                  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden><path d="M5 5.5v13a1 1 0 0 0 1.5.86L16 13.2V18a1 1 0 0 0 2 0V6a1 1 0 0 0-2 0v4.8L6.5 4.64A1 1 0 0 0 5 5.5Z" /></svg>
                </Link>
              )}
            </figcaption>
          </figure>
        </div>
      </section>

      {row && row.videos.length > 1 && (
        <section aria-labelledby="more-videos" className="bg-[#FFF3CC] px-4 pb-8 pt-5 sm:rounded-b-[32px] sm:px-8" data-testid="watch-related">
          <h2 id="more-videos" className="mb-2 font-display text-2xl font-extrabold" style={{ color: PURPLE }}>
            More from {row.titleEs} <span className="text-base font-bold text-[#620D78]/60">· {row.videos.length} videos</span>
          </h2>
          <VideoRow label={`More from ${row.titleEs}`} rowKey={`watch-${row.slug}`} videos={row.videos} hrefFor={hrefFor} currentId={video.id} />
        </section>
      )}
      <p className="sr-only" aria-live="polite">{`Now playing: ${video.title}, ${GALLERY_TYPE_LABEL[video.type]}`}</p>
    </div>
  );
}
