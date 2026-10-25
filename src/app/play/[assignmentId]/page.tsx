import Link from "next/link";
import { notFound } from "next/navigation";
import { StudentPlay } from "@/components/player/StudentPlay";
import { finishedQuestions } from "@/lib/attempts/service";
import { requireStudentPage } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { buildPlayGame, splitSpellingName } from "@/lib/games/service";
import { practiceTarget } from "@/lib/videos";

export const metadata = { title: "Activity" };

export default async function PlayPage({ params, searchParams }: { params: Promise<{ assignmentId: string }>; searchParams: Promise<{ video?: string }> }) {
  const { assignmentId } = await params;
  const { video: videoId } = await searchParams;
  const { student } = await requireStudentPage();
  const target = await practiceTarget(student, assignmentId, videoId).catch(() => null);
  if (!target) notFound();
  const { assignment: a, gameId } = target;
  const exitHref = videoId ? "/learn/videos" : "/learn";

  const open = await db.studentAttempt.findFirst({ where: { studentId: student.id, assignmentId: a.id, gameId, completedAt: null }, orderBy: { startedAt: "desc" } });
  const completed = await db.studentAttempt.count({ where: { studentId: student.id, assignmentId: a.id, gameId, completedAt: { not: null } } });
  if (!open && a.maxAttempts && completed >= a.maxAttempts) {
    return (
      <main className="mx-auto max-w-md px-5 py-24 text-center">
        <p className="font-display text-3xl font-semibold">¡Ya terminaste esta actividad!</p>
        <p className="mt-2 text-ink-2">You have used all your tries for this one.</p>
        <Link href={exitHref} className="mt-6 inline-block font-bold text-coral">← My activities</Link>
      </main>
    );
  }
  const game = await buildPlayGame(student.schoolId, gameId, splitSpellingName(student.spellingName, student.firstName));
  if (a.instructions) game.instructions = [a.instructions, game.instructions].filter(Boolean).join(" ");
  const done = open ? await finishedQuestions(open.id) : {};
  return <StudentPlay game={game} assignmentId={a.id} videoId={videoId ?? null} done={done} exitHref={exitHref} />;
}
