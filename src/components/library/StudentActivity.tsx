"use client";

import { useCallback, useRef } from "react";
import { recordLibraryLearning } from "@/lib/actions/montessori";
import { recordActivityProgress } from "@/lib/actions/tasks";
import type { AnyContent, Kind } from "@/lib/library/types";
import type { MontessoriConfig } from "@/lib/montessori/config";
import { LibraryFeedbackProvider, type LearnedItem } from "./feedback";
import { ResourcePlayer } from "./Players";

// Plays an assigned activity and records completion once per visit. Library games also report
// the words answered, for the Montessori progress records.
export function StudentActivity({ assignmentId, activityId, kind, content, title, feedback }: { assignmentId: string; activityId: string; kind: Kind; content: AnyContent; title: string; feedback?: { config: MontessoriConfig; topic: string } }) {
  const sent = useRef(false);
  const onDone = useCallback(
    (score: number, total: number) => {
      if (sent.current) return;
      sent.current = true;
      void recordActivityProgress({ assignmentId, activityId, score, total }).catch(() => (sent.current = false));
    },
    [assignmentId, activityId],
  );
  const report = useCallback(
    (items: LearnedItem[]) => {
      if (items.length) void recordLibraryLearning({ assignmentId, activityId, items }).catch(() => undefined);
    },
    [assignmentId, activityId],
  );
  const player = <ResourcePlayer kind={kind} content={content} title={title} onDone={onDone} />;
  if (!feedback) return player;
  return (
    <LibraryFeedbackProvider config={feedback.config} topic={feedback.topic} report={report}>
      {player}
    </LibraryFeedbackProvider>
  );
}
