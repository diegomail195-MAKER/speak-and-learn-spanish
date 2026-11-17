import Link from "next/link";
import { notFound } from "next/navigation";
import { EyeIcon } from "@/components/library/LibraryBits";
import { TopicLesson } from "@/components/library/TopicLesson";
import { requireTeacherPage } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { previewLesson } from "@/lib/library/lessonData";
import { GRADES, type Grade } from "@/lib/library/types";

export const metadata = { title: "Student View" };

// The whole topic exactly as a student gets it when the teacher assigns it (their lesson order,
// presentation, voice and final screen). Nothing is recorded: no attempts, scores or progress.
export default async function StudentViewPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ grade?: string }> }) {
  const { user, teacher } = await requireTeacherPage();
  const { slug } = await params;
  const sp = await searchParams;
  const grade = (GRADES as readonly string[]).includes(sp.grade ?? "") ? (sp.grade as Grade) : null;
  const topic = await db.topic.findFirst({ where: { slug, status: "PUBLISHED" } });
  if (!topic) notFound();
  const steps = await previewLesson(user, teacher, topic.id, grade);
  const library = `/teacher/library${grade ? `?grade=${grade}` : ""}`;
  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-full bg-[#F3E8F7] px-4 py-2 text-sm font-bold text-[#620D78]" data-testid="student-view-banner">
        <span className="inline-flex items-center gap-2">
          <EyeIcon /> Student View · nothing is saved
        </span>
        <Link href={library} className="rounded-full bg-white px-3 py-1 hover:underline" data-testid="student-view-exit">Exit to Library</Link>
      </div>
      <TopicLesson
        mode="preview"
        title={`${topic.titleEs} · ${topic.titleEn}`}
        topic={{ art: topic.art, color: topic.color }}
        steps={steps}
        lessonHref={`/teacher/library/topics/${topic.slug}/student-view${grade ? `?grade=${grade}` : ""}`}
        nextHref={null}
        exitHref={library}
      />
    </>
  );
}
