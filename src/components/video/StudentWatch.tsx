"use client";

import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { useCallback, useState } from "react";
import type { PlayVideo } from "@/lib/videos";
import { VideoPlayer } from "./VideoPlayer";

type Report = { positionSec: number; durationSec: number | null; watchedDeltaSec: number };

export function StudentWatch({ video, startAt, practiceHref, practiceTitle, nextHref, nextTitle }: { video: PlayVideo; startAt: number; practiceHref: string | null; practiceTitle: string | null; nextHref: string | null; nextTitle: string | null }) {
  const [ended, setEnded] = useState(false);
  const [saveError, setSaveError] = useState(false);

  const onProgress = useCallback(
    (p: Report, opts?: { beacon?: boolean }) => {
      const url = `/api/videos/${video.id}/progress`;
      const body = JSON.stringify(p);
      // On page hide fetch may be cancelled, so the browser's beacon carries the last report.
      if (opts?.beacon && navigator.sendBeacon?.(url, body)) return;
      fetch(url, { method: "POST", body, keepalive: true })
        .then((r) => setSaveError(!r.ok))
        .catch(() => setSaveError(true));
    },
    [video.id],
  );

  return (
    <div className="max-w-4xl">
      <VideoPlayer video={video} startAt={startAt} onProgress={onProgress} onEnded={() => setEnded(true)} />
      {saveError && <p className="mt-2 text-sm font-bold text-coral" role="status">We couldn&apos;t save your place. Check the internet connection.</p>}
      {(ended || practiceHref || nextHref) && (
        <div className={`animate-rise-in mt-4 flex flex-wrap items-center gap-3 rounded-2xl border-2 p-4 ${ended ? "border-ink bg-aqua shadow-[4px_4px_0_var(--color-ink)]" : "border-line bg-card"}`}>
          {ended && <p className="flex items-center gap-2 font-display text-xl font-bold text-ink"><span className="grid h-8 w-8 place-items-center rounded-full bg-leaf text-white"><Icon name="check" size={18} strokeWidth={3} /></span>¡Muy bien! Terminaste el video.</p>}
          <div className="ml-auto flex flex-wrap gap-2">
            {practiceHref && (
              <Link href={practiceHref} className={`press inline-flex min-h-11 items-center gap-2 rounded-xl border-2 border-ink px-5 font-bold shadow-[2px_2px_0_var(--color-ink)] ${ended ? "bg-indigo text-white hover:bg-indigo-dark" : "bg-card hover:bg-paper"}`}>
                ¡A practicar!{practiceTitle ? ` · ${practiceTitle}` : ""}
              </Link>
            )}
            {nextHref && (
              <Link href={nextHref} className="press inline-flex min-h-11 items-center gap-2 rounded-xl border-2 border-ink bg-card px-5 font-bold shadow-[2px_2px_0_var(--color-ink)] hover:bg-paper">
                Next video{nextTitle ? `: ${nextTitle}` : ""} <Icon name="next" size={18} />
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
