import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, PageTitle } from "@/components/dashboard/DashBits";
import { LocalTime } from "@/components/dashboard/LocalTime";
import { WsIcon } from "@/components/shell/WsIcons";
import { ReviewForm } from "@/components/teacher/ReviewForm";
import { requireTeacherPage } from "@/lib/auth/guards";
import { reviewDetail } from "@/lib/review";

export const metadata = { title: "Review work" };

export default async function ReviewWork({ params }: { params: Promise<{ key: string }> }) {
  const { teacher } = await requireTeacherPage();
  const key = decodeURIComponent((await params).key);
  const work = await reviewDetail(teacher.id, key);
  if (!work) notFound();
  return (
    <>
      <Link href="/teacher/review" className="ws-link mb-3 inline-flex min-h-11 items-center gap-1"><WsIcon name="arrowLeft" className="h-5 w-5" /> Review</Link>
      <PageTitle
        title={work.student}
        subtitle={<>{work.className} · {work.activity} — {work.assignment} · finished <LocalTime iso={work.completedAt.toISOString()} />{work.reviewedAt && <> · reviewed <LocalTime iso={work.reviewedAt.toISOString()} /></>}</>}
      />
      <Card testId="review-work">
        <ReviewForm workKey={work.key} answers={work.answers} note={work.note} reviewed={!!work.reviewedAt} />
      </Card>
    </>
  );
}
