import { CommunityView, type CommunitySearch } from "@/components/teacher/CommunityView";
import { requireAdminPage } from "@/lib/auth/guards";

export const metadata = { title: "Community · Platform Admin" };

export default async function AdminCommunityPage({ searchParams }: { searchParams: Promise<CommunitySearch> }) {
  const sp = await searchParams;
  const { user, teacher } = await requireAdminPage();
  return <CommunityView sp={sp} user={user} teacher={teacher} base="/admin/my-activities" />;
}
