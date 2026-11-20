import { CommunityView, type CommunitySearch } from "@/components/teacher/CommunityView";
import { requireTeacherPage } from "@/lib/auth/guards";

export const metadata = { title: "Community" };

export default async function CommunityPage({ searchParams }: { searchParams: Promise<CommunitySearch> }) {
  const sp = await searchParams;
  const { teacher } = await requireTeacherPage();
  return <CommunityView sp={sp} teacher={teacher} base="/teacher/my-activities" />;
}
