import Link from "next/link";
import { notFound } from "next/navigation";
import { TopicPlanEditor } from "@/components/library/TopicPlanEditor";
import { PageHeader } from "@/components/ui/Panel";
import { requireTeacherPage } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { gameKind, teacherTopicSteps } from "@/lib/library/steps";

export const metadata = { title: "Lesson order" };

// Library → Topic → Lesson order: the teacher adds, removes and orders the steps of the lesson.
export default async function TopicLessonPage({ params }: { params: Promise<{ slug: string }> }) {
  const { user, teacher } = await requireTeacherPage();
  const { slug } = await params;
  const topic = await db.topic.findFirst({ where: { slug, status: "PUBLISHED" } });
  if (!topic) notFound();
  const [{ steps, removed }, games] = await Promise.all([
    teacherTopicSteps({ id: teacher.id, schoolId: user.schoolId }, topic.id),
    db.game.findMany({ where: { schoolId: user.schoolId, teacherId: teacher.id, status: "PUBLISHED" }, orderBy: { updatedAt: "desc" }, select: { id: true, title: true, templateKey: true }, take: 200 }),
  ]);
  const item = (s: { key: string; kind: string; title: string }) => ({ key: s.key, kind: s.kind, title: s.title });
  return (
    <>
      <Link href={`/teacher/library/topics/${topic.slug}`} className="text-sm font-bold text-sky hover:underline">‹ {topic.titleEs}</Link>
      <PageHeader eyebrow="Lesson order" title={`${topic.titleEs} · ${topic.titleEn}`} subtitle="Students follow these steps in this order when you assign the whole topic. The five category icons on the topic page keep their fixed order." />
      <TopicPlanEditor
        topicId={topic.id}
        initial={steps.map(item)}
        removed={removed.map(item)}
        own={games.map((g) => ({ key: `g:${g.id}`, kind: gameKind(g.templateKey), title: g.title || "Untitled" }))}
      />
    </>
  );
}
