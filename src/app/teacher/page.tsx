import Link from "next/link";
import { Suspense } from "react";
import { DashLoading } from "@/components/dashboard/Loading";
import { Card, Empty, PageTitle, Progress, StatCard } from "@/components/dashboard/DashBits";
import { LocalTime } from "@/components/dashboard/LocalTime";
import { LibraryPick } from "@/components/dashboard/LibraryPick";
import { WsIcon } from "@/components/shell/WsIcons";
import { UnsavedDrafts } from "@/components/teacher/UnsavedDrafts";
import { requireTeacherPage } from "@/lib/auth/guards";
import { assignmentSummaries, teacherClasses, teacherStats } from "@/lib/dashboard/teacher";
import { db } from "@/lib/db";
import { libraryTopics } from "@/lib/library/service";
import { pendingReviewCount } from "@/lib/review";
import { teacherTopicSteps } from "@/lib/library/steps";

export const metadata = { title: "Teacher Dashboard" };

const STATUS_CLS: Record<string, string> = { Open: "ws-pill-active", Overdue: "bg-[#FEF3F2] text-[#B42318]", Completed: "ws-pill-published", Closed: "ws-pill-archived", Scheduled: "ws-pill-draft" };

// Teacher View › Dashboard: the teacher's classes (owned and co-taught), open assignments with
// completion, and a short selection of published Library topics.
async function DashboardContent() {
  const { user, teacher } = await requireTeacherPage();
  const [school, stats, classes, assignments, topics, favRows, toReview] = await Promise.all([
    db.school.findUniqueOrThrow({ where: { id: user.schoolId }, select: { name: true } }),
    teacherStats(teacher.id),
    teacherClasses(teacher.id),
    assignmentSummaries(teacher.id, { take: 4, onlyOpen: true }),
    libraryTopics(),
    db.topicFavorite.findMany({ where: { teacherId: teacher.id }, select: { topicId: true } }),
    pendingReviewCount(teacher.id),
  ]);
  const favorites = new Set(favRows.map((f) => f.topicId));
  // Favorites first, then the Library order.
  const picks = [...topics].sort((a, b) => Number(favorites.has(b.id)) - Number(favorites.has(a.id))).slice(0, 2);
  const pickSteps = await Promise.all(
    picks.map(async (t) => {
      const { steps } = await teacherTopicSteps({ id: teacher.id, schoolId: user.schoolId }, t.id);
      return steps.map((s) => ({ key: s.key, kind: s.kind, title: s.title, href: s.resourceId ? `/teacher/library/resources/${s.resourceId}` : `/play/preview/${s.gameId}` }));
    }),
  );

  return (
    <>
      <PageTitle
        title="My classroom"
        subtitle={<span data-testid="teacher-school">{school.name}</span>}
        action={
          <Link href="/teacher/tasks/assign" className="ws-btn ws-btn-primary ws-btn-lg" data-testid="assign-topic">
            <WsIcon name="plus" /> Assign topic
          </Link>
        }
      />

      <UnsavedDrafts />

      <div className="mb-6 grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 xl:grid-cols-4" data-testid="teacher-stats">
        <StatCard plain href="/teacher/classes" icon="users" value={stats.classes} label={stats.classes === 1 ? "Class" : "Classes"} testId="stat-classes" />
        <StatCard plain href="/teacher/progress" icon="cap" value={stats.students} label={stats.students === 1 ? "Student" : "Students"} testId="stat-students" />
        <StatCard plain href="/teacher/assignments?open=1" icon="clipboard" value={stats.active} label="Active assignments" tone="purple" testId="stat-active" />
        <StatCard plain href="/teacher/review" icon="checkCircle" value={toReview} label="Ready for review" tone="purple" testId="stat-review" />
      </div>

      <div className="mb-6 grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <Card title="My Classes" testId="dashboard-classes">
          {classes.length === 0 ? (
            <Empty title="No classes yet" body="Create a class to get a sign-in code for your students." action={<Link href="/teacher/classes" className="ws-btn ws-btn-primary">Create a class</Link>} />
          ) : (
            <ul className="grid gap-3 md:grid-cols-2">
              {classes.slice(0, 6).map((c) => (
                <li key={c.id} className="flex items-center gap-3 rounded-xl border border-[#E2E6EC] bg-white p-3 shadow-[0_1px_2px_rgb(23_32_51/0.04)]" data-testid="class-card">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-[#F1F4F8] text-[#172033]"><WsIcon name="board" className="h-7 w-7" /></span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display text-lg font-extrabold leading-tight" title={c.name}>{c.name}</p>
                    <p className="flex items-center gap-1.5 whitespace-nowrap text-[15px] text-[#172033]">
                      <WsIcon name="users" className="h-4 w-4 shrink-0" /> {c._count.students} student{c._count.students === 1 ? "" : "s"}
                    </p>
                    {c.teacher.id !== teacher.id && <p className="truncate text-xs font-bold text-[#0F766E]">Co-teaching</p>}
                  </div>
                  <Link href={`/teacher/classes/${c.id}`} className="ws-link inline-flex min-h-11 shrink-0 items-center whitespace-nowrap border-l border-[#E2E6EC] pl-3 text-[15px] font-semibold" aria-label={`Manage class ${c.name}`}>Manage class</Link>
                </li>
              ))}
            </ul>
          )}
          {classes.length > 6 && <p className="mt-3 text-[15px] text-[#5B6577]"><Link href="/teacher/classes" className="ws-link inline-flex min-h-11 items-center gap-1">See all {classes.length} classes <WsIcon name="arrowRight" className="h-5 w-5" /></Link></p>}
        </Card>

        <Card title="Assignments" testId="dashboard-assignments">
          {assignments.length === 0 ? (
            <Empty title="No open assignments" body="Assign a Library topic to a class, group or students." action={<Link href="/teacher/tasks/assign" className="ws-btn ws-btn-primary">Assign topic</Link>} />
          ) : (
            <ul className="space-y-3">
              {assignments.map((a) => (
                <li key={a.id}>
                  <Link href={a.href} className="grid gap-3 rounded-xl border border-[#E2E6EC] bg-white p-4 transition-colors hover:border-[#2563EB] sm:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]" data-testid="assignment-summary">
                    <span className="min-w-0">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="font-display text-xl font-extrabold [overflow-wrap:anywhere]">{a.title}</span>
                        {a.status !== "Open" && <span className={`ws-pill ${STATUS_CLS[a.status]}`}>{a.status}</span>}
                      </span>
                      <span className="mt-0.5 block text-[16px] text-[#3D4759] [overflow-wrap:anywhere]">
                        {a.who}
                        {a.dueAt ? <> — Due <LocalTime iso={a.dueAt.toISOString()} mode="day" /></> : " — No due date"}
                      </span>
                    </span>
                    <span className="sm:border-l sm:border-[#E2E6EC] sm:pl-4">
                      <Progress done={a.completed} total={a.total} />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card title="Explore the library" action={<Link href="/teacher/library" className="ws-link inline-flex min-h-11 items-center gap-1">View library <WsIcon name="arrowRight" className="h-5 w-5" /></Link>} testId="dashboard-library">
        {picks.length === 0 ? (
          <Empty title="No published topics yet" body="Topics appear here as soon as they are published." />
        ) : (
          <ul className="divide-y divide-[#E2E6EC]">
            {picks.map((t, i) => <LibraryPick key={t.id} topic={t} href={`/teacher/library/topics/${t.slug}`} steps={pickSteps[i]} />)}
          </ul>
        )}
      </Card>
    </>
  );
}

// The data part streams in behind a loading state (a loading.tsx at this level would hold back
// server-action results on the other teacher pages).
export default function Dashboard() {
  return (
    <Suspense fallback={<DashLoading />}>
      <DashboardContent />
    </Suspense>
  );
}
