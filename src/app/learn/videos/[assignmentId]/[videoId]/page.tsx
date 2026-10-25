import Link from "next/link";
import { notFound } from "next/navigation";
import { StudentWatch } from "@/components/video/StudentWatch";
import { requireStudentPage } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { toPlayVideo, videosOfAssignment } from "@/lib/videos";

export const metadata = { title: "Watch" };

export default async function WatchPage({ params }: { params: Promise<{ assignmentId: string; videoId: string }> }) {
  const { assignmentId, videoId } = await params;
  const { student } = await requireStudentPage();
  const found = await videosOfAssignment(student, assignmentId).catch(() => null);
  const idx = found?.videos.findIndex((v) => v.id === videoId) ?? -1;
  if (!found || idx < 0) notFound();
  const video = found.videos[idx];
  const next = found.videos[idx + 1];
  const progress = await db.videoProgress.findUnique({ where: { studentId_videoId: { studentId: student.id, videoId } } });
  const practice = video.practiceGameId
    ? await db.game.findFirst({ where: { id: video.practiceGameId, schoolId: student.schoolId, status: "PUBLISHED" }, select: { id: true, title: true } })
    : null;

  return (
    <>
      <Link href="/learn/videos" className="text-sm font-bold text-muted hover:text-ink">← Mis videos</Link>
      <h1 className="mt-2 font-display text-3xl font-semibold">{video.title}</h1>
      {found.assignment.instructions && <p className="mt-1 text-ink-2">{found.assignment.instructions}</p>}
      <div className="mt-5">
        <StudentWatch
          video={toPlayVideo(video)}
          startAt={progress && !progress.completed ? progress.positionSec : 0}
          practiceHref={practice ? `/play/${assignmentId}?video=${video.id}` : null}
          practiceTitle={practice?.title ?? null}
          nextHref={next ? `/learn/videos/${assignmentId}/${next.id}` : null}
          nextTitle={next?.title ?? null}
        />
      </div>
      {video.description && <p className="mt-4 max-w-3xl text-ink-2">{video.description}</p>}
    </>
  );
}
