import { PageHeader } from "@/components/ui/Panel";
import { VideoForm } from "@/components/video/VideoForm";
import { requireTeacherPage } from "@/lib/auth/guards";
import { videoFormOptions } from "@/lib/video-form-data";

export const metadata = { title: "Add video" };

export default async function NewVideo() {
  const { user } = await requireTeacherPage();
  const { categories, games } = await videoFormOptions(user.schoolId);
  return (
    <>
      <PageHeader eyebrow="Videos" title="Add a video" />
      <VideoForm
        categories={categories}
        games={games}
        initial={{ title: "", description: "", source: "HOSTED", fileAssetId: null, youtubeId: null, coverAssetId: null, captionsAssetId: null, captionsLanguage: "es", categoryId: null, level: "", keywords: [], durationSec: null, practiceGameId: null, status: "DRAFT" }}
      />
    </>
  );
}
