import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/Panel";
import { VideoForm } from "@/components/video/VideoForm";
import { requireTeacherPage } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { mediaUrl } from "@/lib/media/save";
import { videoFormOptions } from "@/lib/video-form-data";

export const metadata = { title: "Edit video" };

export default async function EditVideo({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user } = await requireTeacherPage();
  const v = await db.video.findFirst({ where: { id, schoolId: user.schoolId }, include: { file: true, captions: true } });
  if (!v) notFound();
  const { categories, games } = await videoFormOptions(user.schoolId);
  return (
    <>
      <PageHeader eyebrow="Videos" title="Edit video" />
      <VideoForm
        categories={categories}
        games={games}
        initial={{
          id: v.id,
          title: v.title,
          description: v.description,
          source: v.source,
          fileAssetId: v.fileAssetId,
          fileName: v.file?.originalName,
          fileUrl: v.fileAssetId ? mediaUrl(v.fileAssetId) : null,
          youtubeId: v.youtubeId,
          coverAssetId: v.coverAssetId,
          coverUrl: v.coverAssetId ? mediaUrl(v.coverAssetId) : null,
          captionsAssetId: v.captionsAssetId,
          captionsName: v.captions?.originalName,
          captionsLanguage: v.captionsLanguage,
          categoryId: v.categoryId,
          level: v.level,
          keywords: v.keywords,
          durationSec: v.durationSec,
          practiceGameId: v.practiceGameId,
          status: v.status === "PUBLISHED" ? "PUBLISHED" : "DRAFT",
        }}
      />
    </>
  );
}
