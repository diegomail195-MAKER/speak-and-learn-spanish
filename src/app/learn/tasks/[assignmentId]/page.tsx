import { notFound } from "next/navigation";
import { TopicLesson } from "@/components/library/TopicLesson";
import { requireStudentPage } from "@/lib/auth/guards";
import { studentLesson } from "@/lib/library/lessonData";

export const metadata = { title: "My Task" };

// A Topic assignment is a guided lesson: its steps in the teacher's order, resumed at the first
// step not finished yet.
export default async function StudentTask({ params }: { params: Promise<{ assignmentId: string }> }) {
  const { student } = await requireStudentPage();
  const { assignmentId } = await params;
  const data = await studentLesson(student, assignmentId);
  if (!data) notFound();
  const { assignment: t, steps, nextHref } = data;
  return (
    <>
      <TopicLesson
        mode="student"
        title={t.title || [t.topic?.titleEs, t.topic?.titleEn].filter(Boolean).join(" · ")}
        topic={{ art: t.topic?.art ?? "", color: t.topic?.color ?? "#FFC928" }}
        steps={steps}
        assignmentId={t.id}
        lessonHref={`/learn/tasks/${t.id}`}
        nextHref={nextHref}
        exitHref="/learn"
      />
      {t.instructions && <p className="mt-5 rounded-[22px] bg-card p-4 font-bold">{t.instructions}</p>}
    </>
  );
}
