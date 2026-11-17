import { notFound, redirect } from "next/navigation";
import { VideoWatch } from "@/components/library/VideoWatch";
import { requireTeacherPage } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { HttpError } from "@/lib/auth/guards";
import { libraryVideoTopics, resourceForPreview, topicsOfResource } from "@/lib/library/service";
import { GRADES, type Grade } from "@/lib/library/types";
import { buildGalleryRows, galleryHref, galleryVideo } from "@/lib/library/videoGallery";

export const metadata = { title: "Video" };

// Library › Videos › a video: played inside LextroSpeak with the platform's player, with the other
// videos of the same topic in a row underneath (PBS KIDS' "more videos" adapted to topics).
export default async function WatchLibraryVideo({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ grade?: string; cat?: string; topic?: string }> }) {
  const { user } = await requireTeacherPage();
  const { id } = await params;
  const sp = await searchParams;
  const grade = (GRADES as readonly string[]).includes(sp.grade ?? "") ? (sp.grade as Grade) : null;
  let r;
  try {
    r = await resourceForPreview(user, id, "published");
  } catch (e) {
    if (e instanceof HttpError) notFound();
    throw e;
  }
  const video = galleryVideo({ id, kind: r.kind, title: r.title, content: r.content });
  if (!video) redirect(`/teacher/library/resources/${id}`);

  const slugs = await topicsOfResource(id);
  const slug = sp.topic && slugs.includes(sp.topic) ? sp.topic : slugs[0];
  const row = slug ? buildGalleryRows(await libraryVideoTopics({ grade, slug }))[0] ?? null : null;
  const topic = slug ? await db.topic.findUnique({ where: { slug }, select: { id: true } }) : null;
  const category = sp.cat ?? "";
  const assignHref = topic ? `/teacher/tasks/assign?topicId=${topic.id}${grade ? `&grade=${grade}` : ""}&only=${encodeURIComponent(`r:${id}`)}` : null;
  return (
    <VideoWatch
      key={id}
      video={video}
      row={row && row.videos.some((v) => v.id === id) ? row : null}
      grade={grade}
      category={category}
      backHref={galleryHref({ grade, category })}
      assignHref={assignHref}
    />
  );
}
