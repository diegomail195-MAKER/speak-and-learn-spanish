import Link from "next/link";
import { notFound } from "next/navigation";
import { ButtonLink } from "@/components/ui/Button";
import { Badge, PageHeader } from "@/components/ui/Panel";
import { VideoPlayer } from "@/components/video/VideoPlayer";
import { requireTeacherPage } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { toPlayVideo } from "@/lib/videos";

export const metadata = { title: "Video" };

export default async function TeacherWatch({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user } = await requireTeacherPage();
  const v = await db.video.findFirst({ where: { id, schoolId: user.schoolId }, include: { category: true, practiceGame: true } });
  if (!v) notFound();
  return (
    <>
      <PageHeader
        eyebrow="Videos"
        title={v.title}
        subtitle={v.description || undefined}
        actions={
          <>
            <ButtonLink href={`/teacher/videos/${v.id}/edit`} variant="secondary">Edit</ButtonLink>
            {v.status === "PUBLISHED" && <ButtonLink href={`/teacher/assignments/new?videoId=${v.id}`} variant="voice">Assign</ButtonLink>}
          </>
        }
      />
      <div className="max-w-4xl">
        <VideoPlayer video={toPlayVideo(v)} />
        <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
          <Badge tone={v.status === "PUBLISHED" ? "leaf" : "neutral"}>{v.status.toLowerCase()}</Badge>
          {v.category && <Badge tone="sky">{v.category.nameEn} / {v.category.nameEs}</Badge>}
          {v.level && <Badge>{v.level}</Badge>}
          {v.keywords.map((k) => <Badge key={k} tone="sun">{k}</Badge>)}
          {v.practiceGame && (
            <span className="ml-auto">
              Watch &amp; Practice: <Link className="font-bold text-coral" href={`/teacher/games/${v.practiceGame.id}/preview`}>{v.practiceGame.title}</Link>
            </span>
          )}
        </div>
      </div>
    </>
  );
}
