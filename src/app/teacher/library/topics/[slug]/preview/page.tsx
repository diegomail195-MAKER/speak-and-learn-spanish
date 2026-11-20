import { notFound } from "next/navigation";
import { TopicPreview } from "@/components/library/TopicPreview";
import { HttpError, requireTeacherPage } from "@/lib/auth/guards";
import { previewOutline } from "@/lib/library/previewData";
import { GRADES, type Grade } from "@/lib/library/types";

export const metadata = { title: "Preview topic" };

// Library › Topic › Preview (teachers and administrators): the topic in the teacher's lesson order,
// library resources and their own activities, with free navigation and the real players. A test
// session: nothing is recorded. Student View is the other mode: the student's locked sequence.
export default async function TeacherTopicPreview({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ grade?: string; step?: string }> }) {
  const { user } = await requireTeacherPage();
  const { slug } = await params;
  const sp = await searchParams;
  const grade = (GRADES as readonly string[]).includes(sp.grade ?? "") ? (sp.grade as Grade) : null;
  const data = await previewOutline({ ...user, teacher: user.teacher }, "teacher", { slug }, grade).catch((e) => {
    if (e instanceof HttpError && e.status === 404) notFound();
    throw e;
  });
  const { topic, steps } = data;
  const n = Number(sp.step);
  return (
    <TopicPreview
      scope="teacher"
      topicId={topic.id}
      grade={grade}
      title={`${topic.titleEs} · ${topic.titleEn}`}
      topic={{ art: topic.art, color: topic.color }}
      steps={steps}
      initialIndex={Number.isInteger(n) ? n - 1 : null}
      exitHref={`/teacher/library/topics/${topic.slug}${grade ? `?grade=${grade}` : ""}`}
    />
  );
}
