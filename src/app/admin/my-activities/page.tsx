import { MyActivitiesView, type MyActivitiesSearch } from "@/components/teacher/MyActivitiesView";
import { requireAdminPage } from "@/lib/auth/guards";

// Platform Admin › My Activities: the administrator's own activities, the same ones (and folders)
// as in Teacher View › My Activities. Nothing is moved or copied: both pages read the same rows.
export const metadata = { title: "My Activities · Platform Admin" };

export default async function AdminMyActivitiesPage({ searchParams }: { searchParams: Promise<MyActivitiesSearch> }) {
  const sp = await searchParams;
  const { teacher } = await requireAdminPage();
  return <MyActivitiesView sp={sp} teacher={teacher} base="/admin/my-activities" />;
}
