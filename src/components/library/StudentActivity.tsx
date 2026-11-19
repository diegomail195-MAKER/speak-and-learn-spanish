"use client";

import { useCallback, useRef, useState } from "react";
import { recordActivityProgress } from "@/lib/actions/tasks";
import type { AnyContent, Kind } from "@/lib/library/types";
import { ResourcePlayer } from "./Players";

// Plays an assigned activity in student focus mode and records completion once per visit.
// `continueHref`: where "Continue" goes when a video ends, shown once the completion is saved (so
// the next step is already open on the server).
export function StudentActivity({ assignmentId, activityId, kind, content, title, continueHref }: { assignmentId: string; activityId: string; kind: Kind; content: AnyContent; title: string; continueHref?: string }) {
  const sent = useRef(false);
  const [saved, setSaved] = useState(false);
  const onDone = useCallback(
    (score: number, total: number) => {
      if (sent.current) return;
      sent.current = true;
      recordActivityProgress({ assignmentId, activityId, score, total }).then(
        () => setSaved(true),
        () => (sent.current = false),
      );
    },
    [assignmentId, activityId],
  );
  return <ResourcePlayer kind={kind} content={content} title={title} onDone={onDone} focus continueHref={saved ? continueHref : undefined} />;
}
