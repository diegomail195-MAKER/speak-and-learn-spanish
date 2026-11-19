"use client";

import { useCallback, useRef } from "react";
import { recordActivityProgress } from "@/lib/actions/tasks";
import type { AnyContent, Kind } from "@/lib/library/types";
import { ResourcePlayer } from "./Players";

// Plays an assigned activity and records completion once per visit.
export function StudentActivity({ assignmentId, activityId, kind, content, title }: { assignmentId: string; activityId: string; kind: Kind; content: AnyContent; title: string }) {
  const sent = useRef(false);
  const onDone = useCallback(
    (score: number, total: number) => {
      if (sent.current) return;
      sent.current = true;
      void recordActivityProgress({ assignmentId, activityId, score, total }).catch(() => (sent.current = false));
    },
    [assignmentId, activityId],
  );
  return <ResourcePlayer kind={kind} content={content} title={title} onDone={onDone} />;
}
