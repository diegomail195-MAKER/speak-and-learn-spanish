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
import { PlayerFrame, StartScreen } from "./parts";
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
}

/** Activities answered only by typing or dragging don't open the microphone. */
export function needsMic(game: PlayGame) {
  if (game.board === "spell") return game.options.spellMode !== "type";
  if (game.board === "diagram") return game.options.diagramMode === "speak";
  return true;
}

export function GamePlayer({ game, mode, diagnostics = false, submitTurn, onFinish, exitHref, done }: PlayerProps) {
  const s = useVoiceSession(game, { mode, submitTurn, onFinish, done });
  const [run, setRun] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const withMic = needsMic(game);
  const started = run > 0 && s.phase !== "start";

  const Board = { sequence: SequenceBoard, flashcards: FlashcardsBoard, spell: SpellBoard, wheel: WheelBoard, diagram: DiagramBoard, boxes: BoxesBoard, match: MatchBoard }[game.board] ?? SequenceBoard;

  return (
    <PlayerFrame s={s} exitHref={exitHref} rootRef={rootRef} diagnostics={diagnostics}>
      {started ? (
        <Board key={run} s={s} questions={game.questions} exitHref={exitHref} />
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
  );
}
