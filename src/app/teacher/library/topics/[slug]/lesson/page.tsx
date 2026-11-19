import Link from "next/link";
import { classroomAccessWhere } from "@/lib/access";
import { notFound } from "next/navigation";
import { TopicPlanEditor } from "@/components/library/TopicPlanEditor";
import { PageHeader } from "@/components/ui/Panel";
import { requireTeacherPage } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { gameKind, teacherTopicSteps } from "@/lib/library/steps";

export const metadata = { title: "Topic setup" };

// Library → Topic → Set up for my class: the teacher reviews the resources of the topic and their
// order, as a default for all their classes or confirmed for one class. Assigning the topic to that
// class (Assign Task) starts from this setup.
export default async function TopicLessonPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ class?: string }> }) {
  const { user, teacher } = await requireTeacherPage();
  const { slug } = await params;
  const sp = await searchParams;
  const topic = await db.topic.findFirst({ where: { slug, status: "PUBLISHED" } });
  if (!topic) notFound();
  const classes = await db.classroom.findMany({ where: { ...classroomAccessWhere(teacher.id), archivedAt: null }, orderBy: { createdAt: "asc" }, select: { id: true, name: true } });
  // Only the teacher's own classes can be chosen; anything else shows the default.
  const cls = classes.find((c) => c.id === sp.class) ?? null;
  const [{ steps, removed, classSaved }, games] = await Promise.all([
    teacherTopicSteps({ id: teacher.id, schoolId: user.schoolId }, topic.id, null, cls?.id),
    db.game.findMany({ where: { schoolId: user.schoolId, teacherId: teacher.id, status: "PUBLISHED" }, orderBy: { updatedAt: "desc" }, select: { id: true, title: true, templateKey: true }, take: 200 }),
  ]);
  const item = (s: { key: string; kind: string; title: string }) => ({ key: s.key, kind: s.kind, title: s.title });
  const base = `/teacher/library/topics/${topic.slug}/lesson`;
  const tab = (on: boolean) => `inline-flex min-h-11 items-center rounded-full px-4 text-sm font-bold ${on ? "bg-[#620D78] text-white" : "bg-white text-ink-2 ring-1 ring-[#E2E6EC] hover:bg-[#F7F3FF]"}`;
  return (
    <>
      <Link href={`/teacher/library/topics/${topic.slug}`} className="text-sm font-bold text-sky hover:underline">‹ {topic.titleEs}</Link>
      <PageHeader
        eyebrow="Topic setup"
        title={`${topic.titleEs} · ${topic.titleEn}`}
        subtitle="Review the resources of this topic and the order students will follow. Confirm it for a class: assigning the topic to that class uses this setup."
      />
      {classes.length > 0 && (
        <nav aria-label="Set up for" className="mb-5 flex flex-wrap items-center gap-2" data-testid="setup-classes">
          <span className="mr-1 text-sm font-bold text-ink-2">Set up for:</span>
          <Link href={base} className={tab(!cls)} aria-current={!cls ? "page" : undefined}>All my classes</Link>
          {classes.map((c) => (
            <Link key={c.id} href={`${base}?class=${c.id}`} className={tab(cls?.id === c.id)} aria-current={cls?.id === c.id ? "page" : undefined} data-testid="setup-class">
              {c.name}
            </Link>
          ))}
        </nav>
      )}
      {cls && (
        <p className="mb-4 rounded-[12px] border border-[#E2E6EC] bg-white px-4 py-3 text-sm font-bold text-ink-2" data-testid="setup-state">
          {classSaved
            ? `Confirmed for ${cls.name} on ${classSaved.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}.`
            : `${cls.name} uses your default order until you confirm a setup for it.`}
        </p>
      )}
      <TopicPlanEditor
        key={cls?.id ?? "default"}
        topicId={topic.id}
        classroom={cls ? { id: cls.id, name: cls.name } : null}
        initial={steps.map(item)}
        removed={removed.map(item)}
        own={games.map((g) => ({ key: `g:${g.id}`, kind: gameKind(g.templateKey), title: g.title || "Untitled" }))}
      />
    </>
  );
}
