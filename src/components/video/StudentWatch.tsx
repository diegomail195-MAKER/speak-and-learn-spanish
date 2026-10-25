"use client";

import Link from "next/link";
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
        <div className={`mt-4 flex flex-wrap items-center gap-3 rounded-xl2 border p-4 ${ended ? "border-teal bg-teal-soft" : "border-line bg-card"}`}>
          {ended && <p className="font-display text-xl font-semibold text-teal-dark">¡Muy bien! Terminaste el video.</p>}
          <div className="ml-auto flex flex-wrap gap-2">
            {practiceHref && (
              <Link href={practiceHref} className={`rounded-full px-5 py-2.5 font-bold ${ended ? "bg-coral text-white hover:brightness-95" : "border border-line hover:bg-paper-2"}`}>
                ¡A practicar!{practiceTitle ? ` · ${practiceTitle}` : ""}
              </Link>
            )}
            {nextHref && (
              <Link href={nextHref} className="rounded-full border border-line px-5 py-2.5 font-bold hover:bg-paper-2">
                Next video{nextTitle ? `: ${nextTitle}` : ""} →
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
