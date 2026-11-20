import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { StudentActivity } from "@/components/library/StudentActivity";
import { HttpError, requireStudentPage } from "@/lib/auth/guards";
import { activityForStudent } from "@/lib/library/service";

export default async function StudentActivityPage({ params }: { params: Promise<{ assignmentId: string; activityId: string }> }) {
  const { student } = await requireStudentPage();
  const { assignmentId, activityId } = await params;
  let data;
  try {
    data = await activityForStudent(student, assignmentId, activityId);
  } catch (e) {
    // A later step than the student's current one: back to the lesson, which resumes where they are.
    if (e instanceof HttpError && e.status === 403) redirect(`/learn/tasks/${assignmentId}`);
    if (e instanceof HttpError) notFound();
    throw e;
  }
  // The teacher's own activities play inside the guided lesson. A finished step is repeated from
  // the lesson once the whole topic is completed (free repetition starts then).
  if (!data.kind || !data.content) redirect(`/learn/tasks/${assignmentId}`);
  if (data.step.done && !data.step.topicCompleted) redirect(`/learn/tasks/${assignmentId}`);
  return (
    <>
      <Link href={`/learn/tasks/${assignmentId}`} className="no-print font-bold text-sky hover:underline">‹ {data.act.assignment.title || "My task"}</Link>
      <h1 className="mb-6 mt-2 font-display text-4xl font-extrabold">{data.title}</h1>
      <StudentActivity assignmentId={assignmentId} activityId={activityId} kind={data.kind} content={data.content} title={data.title} continueHref={`/learn/tasks/${assignmentId}`} />
    </>
  );
}
