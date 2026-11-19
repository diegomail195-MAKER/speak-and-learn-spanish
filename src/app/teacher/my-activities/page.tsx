import { MyActivitiesView, type MyActivitiesSearch } from "@/components/teacher/MyActivitiesView";
import { requireTeacherPage } from "@/lib/auth/guards";

export const metadata = { title: "My Activities" };

export default async function MyActivitiesPage({ searchParams }: { searchParams: Promise<MyActivitiesSearch> }) {
  const sp = await searchParams;
  const { teacher } = await requireTeacherPage();
  return <MyActivitiesView sp={sp} teacher={teacher} base="/teacher/my-activities" />;
}
