"use client";

import { useCallback, useRef, type ReactNode } from "react";
import type { PlayGame, PlayQuestion } from "@/lib/games/types";
import { GamePlayer } from "./GamePlayer";
import type { TurnResult } from "./useVoiceSession";

async function postJson(url: string, body: unknown, retries = 2): Promise<Response> {
  for (let i = 0; ; i++) {
    try {
      const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (res.status >= 500 && i < retries) throw new Error(String(res.status));
      return res;
    } catch (e) {
      if (i >= retries) throw e;
      await new Promise((r) => setTimeout(r, 600 * (i + 1)));
    }
  }
}

/** `activityId`: a teacher's activity inside a Topic lesson (the attempt belongs to that step). `onComplete`: after the attempt is saved as finished. */
export function StudentPlay({ game, assignmentId, videoId, activityId, done, exitHref, below, onComplete }: { game: PlayGame; assignmentId: string; videoId: string | null; activityId?: string; done: Record<string, "NONE" | "HINT" | "MODEL" | null>; exitHref: string; below?: ReactNode; onComplete?: (s: { presented: number }) => void }) {
  const attemptId = useRef<string | null>(null);

  const ensureAttempt = useCallback(async () => {
    if (attemptId.current) return attemptId.current;
    const res = await postJson("/api/attempts", { assignmentId, videoId, activityId });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error);
    attemptId.current = json.attemptId as string;
    return attemptId.current;
  }, [assignmentId, videoId, activityId]);

  const submitTurn = useCallback(
    async (q: PlayQuestion, body: Record<string, unknown>): Promise<TurnResult> => {
      const id = await ensureAttempt();
      const res = await postJson(`/api/attempts/${id}/responses`, { questionId: q.id, ...body });
      if (!res.ok) throw new Error("save failed");
      return res.json();
    },
    [ensureAttempt],
  );

  const onFinish = useCallback(
    async (s: { presented: number; durationMs: number }) => {
      try {
        const id = await ensureAttempt();
        await postJson(`/api/attempts/${id}/complete`, s);
      } finally {
        onComplete?.(s);
      }
    },
    [ensureAttempt, onComplete],
  );

  return <GamePlayer game={game} mode="student" done={done} submitTurn={submitTurn} onFinish={onFinish} exitHref={exitHref} below={below} />;
}
