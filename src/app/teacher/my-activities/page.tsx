import { UnsavedDrafts } from "@/components/teacher/UnsavedDrafts";
import { ActivityFilters, ActivityList, loadActivities, type ActivitySearch } from "@/components/teacher/ActivityList";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState, PageHeader } from "@/components/ui/Panel";
import { requireTeacherPage } from "@/lib/auth/guards";

export const metadata = { title: "My Activities" };

export default async function MyActivitiesPage({ searchParams }: { searchParams: Promise<ActivitySearch> }) {
  const sp = await searchParams;
  const { user, teacher } = await requireTeacherPage();
  const { games, categories } = await loadActivities({ schoolId: user.schoolId, teacherId: teacher.id, sp });
  const filtered = Boolean(sp.q || sp.status || sp.category);

  return (
    <>
      <PageHeader
        eyebrow="My Activities"
        title="Activities I created"
        subtitle="Every activity you create is saved here automatically, as a draft until you publish it."
        actions={<ButtonLink href="/teacher/games/new">+ Create Activity</ButtonLink>}
      />
      <UnsavedDrafts />
      <ActivityFilters sp={sp} categories={categories} />
      <ActivityList
        games={games}
        empty={
          filtered ? (
            <EmptyState title="No activities match" body="Try another search or filter." />
          ) : (
            <EmptyState title="You haven't created any activities yet" body="Create your first activity and it will be saved here so you can edit, preview and assign it any time." action={<ButtonLink href="/teacher/games/new">+ Create Activity</ButtonLink>} />
          )
        }
      />
    </>
  );
}
