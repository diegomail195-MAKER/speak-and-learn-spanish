"use client";

import { useEffect, useRef, type MouseEvent, type RefObject } from "react";

// Protection shared by every video and audio player on the platform.
//
// - No download: the browser's own "Download" item is hidden (controlsList="nodownload"), the
//   right-click menu ("Save video as…") is turned off, and the file routes refuse to open a video or
//   song as a page of its own. A determined person can still record the screen; this stops the
//   everyday ways of saving the file.
// - Students can't skip ahead (`lockSeek`): they can go back and watch again, but never past the
//   furthest point they have actually watched, so the activity only finishes after watching it.
//   Teachers (preview, Library) keep every control except download.

/** Highest speed a student can choose: faster playback would be another way of skipping. */
export const STUDENT_MAX_RATE = 1.25;
/** Normal playback moves a fraction of a second between samples; a bigger step is a jump. */
const MAX_STEP = 1.5;
/** A little slack so a rounding difference never pulls the student back. */
const SLACK = 0.75;

/** Attributes for a protected <video>/<audio>: no download, no right-click menu, no casting. */
export function protectedMediaProps(lockSeek: boolean) {
  return {
    controlsList: lockSeek ? "nodownload noremoteplayback noplaybackrate" : "nodownload noremoteplayback",
    disableRemotePlayback: true,
    onContextMenu: (e: MouseEvent) => e.preventDefault(),
    onDragStart: (e: MouseEvent) => e.preventDefault(),
  } as const;
}

/**
 * Keeps a student from moving a native <video>/<audio> past the furthest point watched.
 * Going back is always allowed. Returns the furthest point (seconds) so callers can check it
 * before counting the media as finished.
 */
export function useNoSeekAhead(ref: RefObject<HTMLMediaElement | null>, lockSeek: boolean, startAt = 0) {
  const furthest = useRef(Math.max(0, startAt));
  useEffect(() => {
    furthest.current = Math.max(furthest.current, startAt);
  }, [startAt]);
  useEffect(() => {
    const el = ref.current;
    if (!el || !lockSeek) return;
    let last = el.currentTime;
    const onTime = () => {
      if (el.seeking) return;
      const t = el.currentTime;
      if (t > furthest.current && t - last <= MAX_STEP) furthest.current = t;
      last = t;
    };
    const onSeeking = () => {
      if (el.currentTime > furthest.current + SLACK) el.currentTime = furthest.current;
      last = el.currentTime;
    };
    const onRate = () => {
      if (el.playbackRate > STUDENT_MAX_RATE) el.playbackRate = 1;
    };
    el.addEventListener("timeupdate", onTime);
    el.addEventListener("seeking", onSeeking);
    el.addEventListener("ratechange", onRate);
    return () => {
      el.removeEventListener("timeupdate", onTime);
      el.removeEventListener("seeking", onSeeking);
      el.removeEventListener("ratechange", onRate);
    };
  }, [ref, lockSeek]);
  return furthest;
}

/** True once a locked student has watched (almost) to the end. Always true when not locked. */
export function watchedToEnd(furthest: number, duration: number | null | undefined, lockSeek: boolean) {
  if (!lockSeek || !duration || !Number.isFinite(duration)) return true;
  return furthest >= duration - 2;
}
