import Link from "next/link";
import { Card, Empty, PageTitle } from "@/components/dashboard/DashBits";
import { LocalTime } from "@/components/dashboard/LocalTime";
import { WsIcon } from "@/components/shell/WsIcons";
import { requireTeacherPage } from "@/lib/auth/guards";
import { pendingReviewCount, reviewQueue } from "@/lib/review";

export const metadata = { title: "Review" };

// Teacher View › Review: speaking work where the app couldn't decide an answer, oldest first.
export default async function ReviewPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { teacher } = await requireTeacherPage();
  const reviewed = (await searchParams).tab === "reviewed";
  const [rows, pending] = await Promise.all([reviewQueue(teacher.id, { reviewed }), pendingReviewCount(teacher.id)]);
  const tab = (on: boolean, href: string, label: string) => (
    <Link href={href} aria-current={on ? "page" : undefined} className={`inline-flex min-h-11 items-center rounded-lg px-4 font-bold ${on ? "bg-[#E8EFFF] text-[#1D4ED8]" : "text-[#3D4759] hover:bg-[#F1F4F8]"}`}>{label}</Link>
  );
  return (
    <>
      <PageTitle title="Review" subtitle="Speaking answers the app wasn't sure about. Decide them, add a note if you like, and mark the work reviewed." />
      <nav className="mb-4 flex gap-2" aria-label="Review tabs">
        {tab(!reviewed, "/teacher/review", `To review (${pending})`)}
        {tab(reviewed, "/teacher/review?tab=reviewed", "Reviewed")}
      </nav>
      <Card testId="review-queue">
        {rows.length === 0 ? (
          <Empty title={reviewed ? "Nothing reviewed yet" : "All caught up"} body={reviewed ? "Work you review appears here." : "When a student's speaking answer needs your decision, it appears here."} />
        ) : (
          <ul className="divide-y divide-[#E2E6EC]">
            {rows.map((r) => (
              <li key={r.key}>
                <Link href={r.href} className="grid gap-2 py-3 hover:bg-[#F7F8FA] sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:px-2" data-testid="review-row">
                  <span className="min-w-0">
                    <span className="block font-display text-lg font-extrabold [overflow-wrap:anywhere]">{r.student} <span className="text-[15px] font-semibold text-[#5B6577]">· {r.className}</span></span>
                    <span className="block text-[15px] text-[#3D4759] [overflow-wrap:anywhere]">{r.activity} — {r.assignment}</span>
                    <span className="block text-sm text-[#5B6577]">{reviewed && r.reviewedAt ? <>Reviewed <LocalTime iso={r.reviewedAt.toISOString()} /></> : <>Finished <LocalTime iso={r.completedAt.toISOString()} /></>}</span>
                  </span>
                  <span className="inline-flex items-center gap-2">
                    {!reviewed && <span className="ws-pill bg-[#F3E8FF] text-[#6B21A8]">{r.unsure} unsure of {r.total}</span>}
                    <WsIcon name="arrowRight" className="h-5 w-5 text-[#5B6577]" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
