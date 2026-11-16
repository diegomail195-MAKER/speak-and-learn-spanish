import { ActivityFilters, ActivityList, loadActivities, type ActivitySearch } from "@/components/teacher/ActivityList";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState, PageHeader } from "@/components/ui/Panel";
import { requireTeacherPage } from "@/lib/auth/guards";

export const metadata = { title: "Interactive Games" };

export default async function GamesPage({ searchParams }: { searchParams: Promise<ActivitySearch> }) {
  const sp = await searchParams;
  const { user } = await requireTeacherPage();
  const { games, categories } = await loadActivities({ schoolId: user.schoolId, sp });

  return (
    <>
      <PageHeader
        eyebrow="Interactive Games"
        title="Activities"
        subtitle="Voice-first activities: flashcards, spelling, wheels, diagrams, boxes and more."
        actions={<><ButtonLink href="/teacher/my-activities" variant="secondary">My Activities</ButtonLink><ButtonLink href="/teacher/games/new">+ Create Activity</ButtonLink></>}
      />
      <ActivityFilters sp={sp} categories={categories} />
      <ActivityList
        games={games}
        empty={<EmptyState title="No games here yet" body="Choose a template, add pictures, questions and answers, then assign it." action={<ButtonLink href="/teacher/games/new">+ Create Activity</ButtonLink>} />}
      />
    </>
  );
}
