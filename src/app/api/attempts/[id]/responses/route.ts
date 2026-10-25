import { NextResponse } from "next/server";
import { z } from "zod";
import { handle } from "@/lib/api";
import { HttpError, requireStudent } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { readSettings, splitSpellingName } from "@/lib/games/service";
import { scoreTurn } from "@/lib/games/turn";
import { SPELL_TOKENS } from "@/lib/games/types";

const schema = z.object({
  questionId: z.string(),
  alternatives: z.array(z.object({ text: z.string().max(500), confidence: z.number().min(0).max(1).nullable() })).max(10),
  tooQuiet: z.boolean(),
  provider: z.string().max(40),
  locale: z.string().max(20),
  support: z.enum(["NONE", "HINT", "MODEL"]),
  tryNumber: z.number().int().min(1).max(50),
});

// Scores one spoken answer on the server (authoritative) and stores the result.
// Only the transcript is stored; audio never reaches this endpoint.
export const POST = handle(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const { student } = await requireStudent();
  const { id } = await ctx.params;
  const body = schema.parse(await req.json());
  const attempt = await db.studentAttempt.findFirst({ where: { id, studentId: student.id }, include: { game: true } });
  if (!attempt) throw new HttpError(404, "Attempt not found");
  if (attempt.completedAt) throw new HttpError(409, "Attempt already completed");
  const question = await db.question.findFirst({ where: { id: body.questionId, item: { gameId: attempt.gameId } }, include: { acceptedAnswers: true } });
  if (!question) throw new HttpError(404, "Question not found");

  const names = splitSpellingName(student.spellingName, student.firstName);
  const expected = question.expectedAnswer === SPELL_TOKENS.firstName ? names.firstName : question.expectedAnswer === SPELL_TOKENS.lastName ? names.lastName : question.expectedAnswer;
  const settings = readSettings(attempt.game.settings);
  const incorrectSoFar = await db.studentResponse.count({ where: { attemptId: id, questionId: question.id, outcome: "INCORRECT" } });

  const ev = scoreTurn({
    alternatives: body.alternatives,
    tooQuiet: body.tooQuiet,
    expected,
    accepted: question.acceptedAnswers.map((a) => a.text),
    mode: question.evaluationMode,
    acceptShortAnswer: settings.acceptShortAnswer,
    incorrectSoFar,
    maxTries: settings.maxTries,
  });
  await db.studentResponse.create({
    data: {
      attemptId: id,
      questionId: question.id,
      tryNumber: body.tryNumber,
      outcome: ev.outcome,
      support: body.support,
      transcript: (ev.transcript || body.alternatives[0]?.text || "").slice(0, 500),
      confidence: ev.confidence ?? body.alternatives[0]?.confidence ?? null,
      language: body.locale,
      provider: body.provider,
      reason: body.tooQuiet ? "too_quiet" : ev.reason,
      score: ev.score,
      endsQuestion: ev.endsQuestion,
    },
  });
  return NextResponse.json(ev);
});
