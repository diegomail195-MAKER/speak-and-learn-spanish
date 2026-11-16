import { NextResponse } from "next/server";
import { handle } from "@/lib/api";
import { HttpError, requireUser } from "@/lib/auth/guards";
import { buildPlayGame, practiceAudio, splitSpellingName } from "@/lib/games/service";
import { rateLimit } from "@/lib/rate-limit";
import { practiceTarget } from "@/lib/videos";

// Natural-voice clips for a flashcards deck's "Let's practice" round. Teachers: any game of their
// school. Students: only the game of an assignment they have (?assignment=…).
export const POST = handle(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const user = await requireUser();
  const { id } = await ctx.params;
  if (!(await rateLimit(`practice-audio:${user.id}`, 60, 10 * 60_000))) throw new HttpError(429, "Too many requests");
  let names = { firstName: "", lastName: "" };
  if (user.role === "STUDENT") {
    const student = user.student;
    const assignment = new URL(req.url).searchParams.get("assignment");
    if (!student || !assignment) throw new HttpError(403, "Not allowed");
    const t = await practiceTarget(student, assignment);
    if (t.gameId !== id) throw new HttpError(403, "Not allowed");
    names = splitSpellingName(student.spellingName, student.firstName);
  }
  const game = await buildPlayGame(user.schoolId, id, names);
  if (game.board !== "flashcards") throw new HttpError(400, "Not a flashcards activity");
  return NextResponse.json({ clips: await practiceAudio(user.schoolId, user.id, game) });
});
