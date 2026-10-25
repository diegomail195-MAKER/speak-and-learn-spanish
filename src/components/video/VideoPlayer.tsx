"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PlayVideo } from "@/lib/videos";

// Hosted videos use the native <video> element (play/pause, volume, fullscreen, captions and
// keyboard support built in) plus our speed control and resume. YouTube videos use YouTube's
// official IFrame API on the privacy-enhanced youtube-nocookie.com domain. YouTube ads and
// restrictions are controlled by YouTube, not by this platform.

type YTPlayer = {
  getCurrentTime(): number;
  getDuration(): number;
  getPlayerState(): number;
  seekTo(s: number, allow: boolean): void;
  setPlaybackRate(r: number): void;
  getAvailablePlaybackRates(): number[];
  destroy(): void;
};
declare global {
  interface Window {
    YT?: { Player: new (el: HTMLElement, opts: unknown) => YTPlayer; PlayerState: { PLAYING: number; ENDED: number; PAUSED: number } };
    onYouTubeIframeAPIReady?: () => void;
  }
}

function loadYouTubeApi(): Promise<void> {
  if (window.YT?.Player) return Promise.resolve();
  return new Promise((resolve) => {
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve();
    };
    if (!document.querySelector("script[data-yt-api]")) {
      const s = document.createElement("script");
      s.src = "https://www.youtube.com/iframe_api";
      s.async = true;
      s.dataset.ytApi = "1";
      document.head.appendChild(s);
    }
  });
}

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
const SPEEDS = [0.75, 1, 1.25];

export interface ProgressReport {
  positionSec: number;
  durationSec: number | null;
  watchedDeltaSec: number;
}

export function VideoPlayer({
  video,
  startAt = 0,
  onProgress,
  onEnded,
}: {
  video: PlayVideo;
  startAt?: number;
  /** Called every ~10 s while playing, on pause, on end and when leaving the page. */
  onProgress?: (p: ProgressReport, opts?: { beacon?: boolean }) => void;
  onEnded?: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const ytHost = useRef<HTMLDivElement>(null);
  const yt = useRef<YTPlayer | null>(null);
  const [speed, setSpeed] = useState(1);
  const [pos, setPos] = useState(startAt);
  const [dur, setDur] = useState<number | null>(video.durationSec);
  const [resumeNote, setResumeNote] = useState(startAt > 5);
  const [ytError, setYtError] = useState("");
  const watched = useRef(0); // playback seconds not yet reported
  const lastT = useRef<number | null>(null);
  const lastReported = useRef<number | null>(null);

  const current = useCallback(() => (video.source === "HOSTED" ? videoRef.current?.currentTime ?? 0 : yt.current?.getCurrentTime() ?? 0), [video.source]);
  const duration = useCallback(() => {
    const d = video.source === "HOSTED" ? videoRef.current?.duration : yt.current?.getDuration();
    return d && Number.isFinite(d) && d > 0 ? d : video.durationSec;
  }, [video.source, video.durationSec]);

  // Accumulate real playback time: small forward steps only (seeking doesn't count).
  const tick = useCallback(() => {
    const t = current();
    if (lastT.current != null) {
      const d = t - lastT.current;
      if (d > 0 && d < 2.5) watched.current += d;
    }
    lastT.current = t;
    setPos(t);
    const d = duration();
    if (d) setDur(d);
  }, [current, duration]);

  const report = useCallback(
    (beacon = false) => {
      if (!onProgress) return;
      // Nothing to report once the player is gone (unmount) or when nothing changed.
      if (video.source === "HOSTED" ? !videoRef.current : !yt.current) return;
      const pos = current();
      const delta = Math.min(120, watched.current);
      if (delta === 0 && pos === lastReported.current) return;
      watched.current -= delta;
      lastReported.current = pos;
      onProgress({ positionSec: pos, durationSec: duration() ?? null, watchedDeltaSec: delta }, { beacon });
    },
    [onProgress, current, duration, video.source],
  );

  // Hosted
  useEffect(() => {
    if (video.source !== "HOSTED") return;
    const el = videoRef.current;
    if (!el) return;
    const onMeta = () => {
      setDur(el.duration);
      if (startAt > 5 && startAt < el.duration - 5) el.currentTime = startAt;
    };
    // timeupdate fires several times a second, so no playback time is lost between samples.
    const onPlay = () => (lastT.current = el.currentTime);
    const onTime = () => !el.paused && tick();
    const onPause = () => {
      tick();
      lastT.current = null;
      report();
    };
    const onEnd = () => {
      tick();
      report();
      onEnded?.();
    };
    el.addEventListener("loadedmetadata", onMeta);
    el.addEventListener("play", onPlay);
    el.addEventListener("timeupdate", onTime);
    el.addEventListener("pause", onPause);
    el.addEventListener("ended", onEnd);
    return () => {
      el.removeEventListener("loadedmetadata", onMeta);
      el.removeEventListener("play", onPlay);
      el.removeEventListener("timeupdate", onTime);
      el.removeEventListener("pause", onPause);
      el.removeEventListener("ended", onEnd);
    };
  }, [video.source, startAt, report, onEnded, tick]);

  // YouTube
  useEffect(() => {
    if (video.source !== "YOUTUBE" || !video.youtubeId) return;
    let cancelled = false;
    const timeout = setTimeout(() => !yt.current && setYtError("YouTube could not be loaded. Your school network may block YouTube."), 12000);
    loadYouTubeApi().then(() => {
      if (cancelled || !ytHost.current || !window.YT) return;
      const target = document.createElement("div");
      ytHost.current.replaceChildren(target);
      yt.current = new window.YT.Player(target, {
        host: "https://www.youtube-nocookie.com",
        videoId: video.youtubeId,
        width: "100%",
        height: "100%",
        playerVars: { rel: 0, modestbranding: 1, playsinline: 1, start: startAt > 5 ? Math.floor(startAt) : 0, cc_lang_pref: "es", hl: "es" },
        events: {
          onReady: () => {
            clearTimeout(timeout);
            const d = yt.current?.getDuration();
            if (d) setDur(d);
          },
          onError: () => setYtError("This YouTube video can't be played here (it may be private, removed or not allowed to be embedded)."),
          onStateChange: (e: { data: number }) => {
            const S = window.YT!.PlayerState;
            if (e.data === S.PLAYING) lastT.current = yt.current?.getCurrentTime() ?? null;
            if (e.data === S.PAUSED) {
              tick();
              lastT.current = null;
              report();
            }
            if (e.data === S.ENDED) {
              tick();
              report();
              onEnded?.();
            }
          },
        },
      });
    });
    return () => {
      cancelled = true;
      clearTimeout(timeout);
      yt.current?.destroy();
      yt.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [video.source, video.youtubeId]);

  // Sample position every second; report every 10 s; final report when leaving.
  useEffect(() => {
    let n = 0;
    const i = setInterval(() => {
      const playing = video.source === "HOSTED" ? videoRef.current && !videoRef.current.paused : yt.current?.getPlayerState?.() === 1;
      if (!playing) return;
      if (video.source === "YOUTUBE") tick(); // hosted video samples on timeupdate
      if (++n % 10 === 0) report();
    }, 1000);
    const leave = () => report(true);
    window.addEventListener("pagehide", leave);
    return () => {
      clearInterval(i);
      window.removeEventListener("pagehide", leave);
      report(true);
    };
  }, [video.source, tick, report]);

  function changeSpeed(s: number) {
    setSpeed(s);
    if (videoRef.current) videoRef.current.playbackRate = s;
    yt.current?.setPlaybackRate(s);
  }

  function restart() {
    if (videoRef.current) videoRef.current.currentTime = 0;
    yt.current?.seekTo(0, true);
    setResumeNote(false);
  }

  const pct = dur ? Math.min(100, (pos / dur) * 100) : 0;

  return (
    <div>
      <div className="overflow-hidden rounded-2xl bg-ink">
        {video.source === "HOSTED" ? (
          <video ref={videoRef} src={video.url ?? undefined} controls playsInline preload="metadata" poster={video.coverUrl ?? undefined} className="aspect-video w-full bg-black" crossOrigin="anonymous">
            {video.captionsUrl && <track kind="subtitles" src={video.captionsUrl} srcLang={video.captionsLanguage} label={video.captionsLanguage === "es" ? "Español" : video.captionsLanguage} default />}
          </video>
        ) : ytError ? (
          <div className="grid aspect-video place-items-center p-6 text-center text-white">{ytError}</div>
        ) : (
          <div ref={ytHost} className="aspect-video w-full [&>iframe]:h-full [&>iframe]:w-full" />
        )}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
        <div className="h-2 min-w-40 flex-1 overflow-hidden rounded-full bg-line" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100} aria-label="Video progress">
          <div className="h-full rounded-full bg-teal transition-[width]" style={{ width: `${pct}%` }} />
        </div>
        <span className="tabular-nums text-muted">
          {fmt(pos)} / {dur ? fmt(dur) : "--:--"}
        </span>
        <label className="flex items-center gap-1.5 font-bold text-ink-2">
          Speed
          <select value={speed} onChange={(e) => changeSpeed(Number(e.target.value))} className="rounded-lg border border-line bg-card px-2 py-1">
            {SPEEDS.map((s) => (
              <option key={s} value={s}>
                {s}×
              </option>
            ))}
          </select>
        </label>
      </div>
      {resumeNote && (
        <p className="mt-2 text-sm text-ink-2">
          Continuing from {fmt(startAt)}.{" "}
          <button type="button" onClick={restart} className="font-bold text-teal-dark hover:underline">
            Start over
          </button>
        </p>
      )}
    </div>
  );
}
