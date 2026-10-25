import { NextResponse } from "next/server";
import { z } from "zod";
import { handle } from "@/lib/api";
import { HttpError, requireStudent } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { readSettings, splitSpellingName } from "@/lib/games/service";
import { templateByKey, templateOptions } from "@/lib/games/templates";
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
  /** voice = speech recognition; typed = keyboard; choice = drag & drop / tap. */
  input: z.enum(["voice", "typed", "choice"]).default("voice"),
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
  const question = await db.question.findFirst({ where: { id: body.questionId, item: { gameId: attempt.gameId } }, include: { acceptedAnswers: true, item: { select: { text: true } } } });
  if (!question) throw new HttpError(404, "Question not found");

  const names = splitSpellingName(student.spellingName, student.firstName);
  const answer = question.expectedAnswer === SPELL_TOKENS.firstName ? names.firstName : question.expectedAnswer === SPELL_TOKENS.lastName ? names.lastName : question.expectedAnswer;
  const settings = readSettings(attempt.game.settings);

  // Drag & drop / tap: the chosen label must be this item's own label.
  const expected = body.input === "choice" ? question.item.text || answer : answer;
  // Tries are counted per way of answering, so wrong drags don't use up the spoken tries.
  const typedInput = { in: ["typed", "choice"] };
  const incorrectSoFar = await db.studentResponse.count({
    where: { attemptId: id, questionId: question.id, outcome: "INCORRECT", provider: body.input === "voice" ? { notIn: ["typed", "choice"] } : typedInput },
  });
  const ev = scoreTurn({
    alternatives: body.alternatives,
    tooQuiet: body.tooQuiet,
    expected,
    accepted: question.acceptedAnswers.map((a) => a.text),
    mode: question.evaluationMode,
    acceptShortAnswer: settings.acceptShortAnswer,
    incorrectSoFar,
    maxTries: settings.maxTries,
    input: body.input,
    language: (question.answerLanguage ?? attempt.game.language) as "es-419" | "en-US" | "fr-FR",
    caseSensitive: templateOptions(templateByKey(attempt.game.templateKey), settings.options).caseSensitive === true,
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
      provider: body.input === "voice" ? body.provider : body.input,
      reason: body.tooQuiet ? "too_quiet" : ev.reason,
      score: ev.score,
      endsQuestion: ev.endsQuestion,
    },
  });
  return NextResponse.json(ev);
});
