"use client";

import { useCallback, useRef } from "react";
import type { PlayGame, PlayQuestion } from "@/lib/games/types";
import { GamePlayer } from "./GamePlayer";

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

export function StudentPlay({ game, assignmentId, videoId, startIndex, exitHref }: { game: PlayGame; assignmentId: string; videoId: string | null; startIndex: number; exitHref: string }) {
  const attemptId = useRef<string | null>(null);

  const ensureAttempt = useCallback(async () => {
    if (attemptId.current) return attemptId.current;
    const res = await postJson("/api/attempts", { assignmentId, videoId });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error);
    attemptId.current = json.attemptId as string;
    return attemptId.current;
  }, [assignmentId, videoId]);

  const submitTurn = useCallback(
    async (q: PlayQuestion, body: Record<string, unknown>) => {
      const id = await ensureAttempt();
      const res = await postJson(`/api/attempts/${id}/responses`, { questionId: q.id, ...body });
      if (!res.ok) throw new Error("save failed");
      return res.json();
    },
    [ensureAttempt],
  );

  const onFinish = useCallback(
    async (s: { presented: number; durationMs: number }) => {
      const id = await ensureAttempt();
      await postJson(`/api/attempts/${id}/complete`, s);
    },
    [ensureAttempt],
  );

  return <GamePlayer game={game} mode="student" startIndex={startIndex} submitTurn={submitTurn} onFinish={onFinish} exitHref={exitHref} />;
}
