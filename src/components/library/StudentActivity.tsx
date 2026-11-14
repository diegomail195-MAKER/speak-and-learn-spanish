"use client";

import { useCallback, useRef } from "react";
import { recordActivityProgress } from "@/lib/actions/tasks";
import type { AnyContent, Kind } from "@/lib/library/types";
import { ResourcePlayer } from "./Players";

// Plays an assigned activity in student focus mode and records completion once per visit.
// `continueHref`: the next activity of the task (or the task), offered when a video ends.
export function StudentActivity({ assignmentId, activityId, kind, content, title, continueHref }: { assignmentId: string; activityId: string; kind: Kind; content: AnyContent; title: string; continueHref?: string }) {
  const sent = useRef(false);
  const onDone = useCallback(
    (score: number, total: number) => {
      if (sent.current) return;
      sent.current = true;
      void recordActivityProgress({ assignmentId, activityId, score, total }).catch(() => (sent.current = false));
    },
    [assignmentId, activityId],
  );
  return <ResourcePlayer kind={kind} content={content} title={title} onDone={onDone} focus continueHref={continueHref} />;
}
