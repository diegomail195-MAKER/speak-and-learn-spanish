"use client";

import { useCallback, useRef } from "react";
import { scoreTurn } from "@/lib/games/turn";
import type { PlayGame, PlayQuestion } from "@/lib/games/types";
import type { MontessoriSetup } from "@/lib/montessori/setup";
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

export function StudentPlay({ game, assignmentId, videoId, done, exitHref, feedback, nextHref }: { game: PlayGame; assignmentId: string; videoId: string | null; done: Record<string, "NONE" | "HINT" | "MODEL" | null>; exitHref: string; feedback?: MontessoriSetup; nextHref?: string | null }) {
  const attemptId = useRef<string | null>(null);
  // Practice round with no attempts left (or past the due date): scored here, not saved.
  const localOnly = useRef(false);
  const localTries = useRef<Record<string, number>>({});

  const pending = useRef<Promise<string> | null>(null);
  const practicing = useRef(false);
  const ensureAttempt = useCallback(async () => {
    if (attemptId.current) return attemptId.current;
    // One request at a time, so a practice round never opens two attempts.
    pending.current ??= (async () => {
      const res = await postJson("/api/attempts", { assignmentId, videoId });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      attemptId.current = json.attemptId as string;
      return attemptId.current;
    })().finally(() => (pending.current = null));
    return pending.current;
  }, [assignmentId, videoId]);

  const submitTurn = useCallback(
    async (q: PlayQuestion, body: Record<string, unknown>): Promise<TurnResult> => {
      if (practicing.current && !localOnly.current && !attemptId.current) {
        await ensureAttempt().catch(() => (localOnly.current = true));
      }
      if (localOnly.current) {
        const input = body.input as "voice" | "typed" | "choice";
        const key = `${q.id}:${input === "voice" ? "v" : "t"}`;
        const ev = scoreTurn({
          alternatives: body.alternatives as Array<{ text: string; confidence: number | null }>,
          tooQuiet: body.tooQuiet as boolean,
          expected: input === "choice" ? q.displayText || q.expected : q.expected,
          accepted: q.accepted,
          mode: q.mode,
          acceptShortAnswer: game.settings.acceptShortAnswer,
          incorrectSoFar: localTries.current[key] ?? 0,
          maxTries: game.settings.maxTries,
          input,
          language: q.answerLanguage,
          caseSensitive: game.options.caseSensitive === true,
        });
        if (ev.outcome === "INCORRECT") localTries.current[key] = (localTries.current[key] ?? 0) + 1;
        return ev;
      }
      const id = await ensureAttempt();
      const res = await postJson(`/api/attempts/${id}/responses`, { questionId: q.id, ...body });
      if (!res.ok) throw new Error("save failed");
      return res.json();
    },
    [ensureAttempt, game],
  );

  /** Practice round after the end screen: a new attempt, or local-only when none is allowed. */
  const onPracticeStart = useCallback(() => {
    attemptId.current = null;
    localTries.current = {};
    practicing.current = true;
  }, []);

  const onFinish = useCallback(
    async (s: { presented: number; durationMs: number }) => {
      if (localOnly.current) return;
      const id = await ensureAttempt();
      await postJson(`/api/attempts/${id}/complete`, s);
    },
    [ensureAttempt],
  );

  return <GamePlayer game={game} mode="student" done={done} submitTurn={submitTurn} onFinish={onFinish} exitHref={exitHref} feedback={feedback} nextHref={nextHref} onPracticeStart={onPracticeStart} />;
}
