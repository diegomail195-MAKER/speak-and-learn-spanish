import Link from "next/link";
import { notFound } from "next/navigation";
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
    if (e instanceof HttpError) notFound();
    throw e;
  }
  return (
    <>
      <Link href={`/learn/tasks/${assignmentId}`} className="no-print font-bold text-sky hover:underline">‹ {data.act.assignment.title || "My task"}</Link>
      <h1 className="mb-6 mt-2 font-display text-4xl font-extrabold">{data.act.version.title}</h1>
      <StudentActivity assignmentId={assignmentId} activityId={activityId} kind={data.kind} content={data.content} title={data.act.version.title} />
    </>
  );
}
