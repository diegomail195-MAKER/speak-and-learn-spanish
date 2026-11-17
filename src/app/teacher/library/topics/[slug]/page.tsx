import Link from "next/link";
import { notFound } from "next/navigation";
import { EyeIcon } from "@/components/library/LibraryBits";
import { TopicHero } from "@/components/library/TopicHero";
import { ButtonLink } from "@/components/ui/Button";
import { requireTeacherPage } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { teacherTopicSteps } from "@/lib/library/steps";
import { buildHero, heroShapes } from "@/lib/library/topicHero";
import { GRADES, GRADE_LABEL, type Grade } from "@/lib/library/types";

export default async function TopicPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ grade?: string }> }) {
  const { user, teacher } = await requireTeacherPage();
  const { slug } = await params;
  const sp = await searchParams;
  const grade = (GRADES as readonly string[]).includes(sp.grade ?? "") ? (sp.grade as Grade) : null;
  const topic = await db.topic.findFirst({ where: { slug, status: "PUBLISHED" } });
  if (!topic) notFound();
  // The teacher's lesson order: library items and their own activities (Speaking, flashcards).
  const { steps } = await teacherTopicSteps({ id: teacher.id, schoolId: user.schoolId }, topic.id, grade);
  const q = grade ? `grade=${grade}` : "";
  const assign = `/teacher/tasks/assign?topicId=${topic.id}${grade ? `&grade=${grade}` : ""}`;
  const data = buildHero(
    steps.map((s) => ({
      id: s.key,
      kind: s.kind,
      title: s.title,
      content: s.content,
      href: s.resourceId ? `/teacher/library/resources/${s.resourceId}` : `/play/preview/${s.gameId}`,
      assignHref: `${assign}&only=${encodeURIComponent(s.key)}`,
    })),
  );
  const pill = "inline-flex h-9 items-center gap-2 rounded-full bg-white px-4 text-sm font-bold text-[#620D78] ring-1 ring-[#620D78]/20 hover:bg-[#F3E8F7]";
  return (
    <TopicHero
      title={topic.titleEs}
      subtitle={[topic.titleEn, grade ? GRADE_LABEL[grade].label : ""].filter(Boolean).join(" · ")}
      art={topic.art}
      shapes={heroShapes(topic)}
      data={data}
      toolbar={
        <>
          <Link href={`/teacher/library${q ? `?${q}` : ""}`} className="text-sm font-bold text-sky hover:underline">‹ Library</Link>
          <span className="flex flex-wrap items-center gap-2">
            <Link href={`/teacher/library/topics/${topic.slug}/student-view${q ? `?${q}` : ""}`} className={pill} data-testid="topic-student-view">
              <EyeIcon /> Student View
            </Link>
            <Link href={`/teacher/library/topics/${topic.slug}/lesson${q ? `?${q}` : ""}`} className={pill} data-testid="topic-lesson-order">
              ↕ Lesson order
            </Link>
            <ButtonLink href={assign} size="sm">Assign whole topic</ButtonLink>
          </span>
        </>
      }
    />
  );
}

