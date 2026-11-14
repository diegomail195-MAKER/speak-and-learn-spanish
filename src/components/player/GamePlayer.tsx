"use client";

import { useRef, useState } from "react";
import type { PlayGame } from "@/lib/games/types";
import { BoxesBoard } from "./boards/BoxesBoard";
import { DiagramBoard } from "./boards/DiagramBoard";
import { FlashcardsBoard } from "./boards/FlashcardsBoard";
import { MatchBoard } from "./boards/MatchBoard";
import { SequenceBoard } from "./boards/SequenceBoard";
import { SpellBoard } from "./boards/SpellBoard";
import { WheelBoard } from "./boards/WheelBoard";
import type { MontessoriSetup } from "@/lib/montessori/setup";
import { PlayerActions, PlayerFrame, StartScreen } from "./parts";
import { useVoiceSession, type SubmitTurn } from "./useVoiceSession";

export type { Diagnostic } from "./useVoiceSession";

export interface PlayerProps {
  game: PlayGame;
  mode: "preview" | "student";
  diagnostics?: boolean;
  /** Student mode: server-side scoring + saving. */
  submitTurn?: SubmitTurn;
  onFinish?: (summary: { presented: number; durationMs: number }) => Promise<void> | void;
  exitHref: string;
  /** Questions already finished in an unfinished attempt. */
  done?: Record<string, "NONE" | "HINT" | "MODEL" | null>;
  /** Montessori Intelligent Feedback Engine setup (absent: original feedback phrases). */
  feedback?: MontessoriSetup;
  /** Where "New challenge" leads (the student's next unfinished activity), if any. */
  nextHref?: string | null;
  /** Called before a practice round starts (student mode starts a new attempt). */
  onPracticeStart?: () => void;
}

/** Activities answered only by typing or dragging don't open the microphone. */
export function needsMic(game: PlayGame) {
  if (game.board === "spell") return game.options.spellMode !== "type";
  if (game.board === "diagram") return game.options.diagramMode === "speak";
  // Look–flip–listen flashcards (no spoken answers) never need the microphone.
  if (game.board === "flashcards") return game.questions.some((q) => q.expected.trim().length > 0);
  return true;
}

export function GamePlayer({ game, mode, diagnostics = false, submitTurn, onFinish, exitHref, done, feedback, nextHref, onPracticeStart }: PlayerProps) {
  const s = useVoiceSession(game, { mode, submitTurn, onFinish, done, feedback });
  const [run, setRun] = useState(0);
  // Practice round: only some items, in the same activity or as flashcards (another modality).
  const [practice, setPractice] = useState<{ ids: string[]; as: "same" | "flashcards" } | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const withMic = needsMic(game);
  const started = run > 0 && s.phase !== "start";

  const boardKey = practice?.as === "flashcards" ? "flashcards" : game.board;
  const Board = { sequence: SequenceBoard, flashcards: FlashcardsBoard, spell: SpellBoard, wheel: WheelBoard, diagram: DiagramBoard, boxes: BoxesBoard, match: MatchBoard }[boardKey] ?? SequenceBoard;
  const questions = practice ? game.questions.filter((q) => practice.ids.includes(q.id)) : game.questions;

  const startPractice = async (ids: string[], as: "same" | "flashcards") => {
    onPracticeStart?.();
    s.beginPractice(ids);
    setPractice({ ids, as });
    if (await s.start(withMic)) setRun((r) => r + 1);
  };

  return (
    <PlayerActions.Provider value={{ practice: s.engine ? startPractice : undefined, nextHref }}>
    <PlayerFrame s={s} exitHref={exitHref} rootRef={rootRef} diagnostics={diagnostics} order={practice ? questions : undefined}>
      {started ? (
        <Board key={run} s={s} questions={questions} exitHref={exitHref} />
      ) : (
        <StartScreen
          s={s}
          preview={mode === "preview"}
          withMic={withMic}
          onStart={async () => {
            if (await s.start(withMic)) setRun((r) => r + 1);
          }}
        />
      )}
    </PlayerFrame>
    </PlayerActions.Provider>
  );
}
