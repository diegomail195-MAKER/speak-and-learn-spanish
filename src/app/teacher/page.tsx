import Link from "next/link";
import { Suspense } from "react";
import { DashLoading } from "@/components/dashboard/Loading";
import { Card, Empty, PageTitle, Progress, StatCard } from "@/components/dashboard/DashBits";
import { LocalTime } from "@/components/dashboard/LocalTime";
import { TopicRow } from "@/components/library/TopicRow";
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
  const picks = [...topics].sort((a, b) => Number(favorites.has(b.id)) - Number(favorites.has(a.id))).slice(0, 3);
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
        subtitle={<span data-testid="teacher-school">{user.displayName} · {school.name}</span>}
        action={
          <Link href="/teacher/tasks/assign" className="ws-btn ws-btn-primary ws-btn-lg" data-testid="assign-topic">
            <WsIcon name="plus" /> Assign topic
          </Link>
        }
      />

      <UnsavedDrafts />

      <div className="mb-6 grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 xl:grid-cols-4" data-testid="teacher-stats">
        <StatCard href="/teacher/classes" icon="users" value={stats.classes} label={stats.classes === 1 ? "Class" : "Classes"} testId="stat-classes" />
        <StatCard href="/teacher/progress" icon="cap" value={stats.students} label={stats.students === 1 ? "Student" : "Students"} testId="stat-students" />
        <StatCard href="/teacher/assignments?open=1" icon="clipboard" value={stats.active} label="Active assignments" tone="purple" testId="stat-active" />
        <StatCard href="/teacher/review" icon="inbox" value={toReview} label="To review" tone="purple" testId="stat-review" />
      </div>

      <div className="mb-6 grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <Card title="My Classes" action={<Link href="/teacher/classes" className="ws-link inline-flex min-h-11 items-center gap-1">All classes <WsIcon name="arrowRight" className="h-5 w-5" /></Link>} testId="dashboard-classes">
          {classes.length === 0 ? (
            <Empty title="No classes yet" body="Create a class to get a sign-in code for your students." action={<Link href="/teacher/classes" className="ws-btn ws-btn-primary">Create a class</Link>} />
          ) : (
            <ul className="grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(250px,1fr))]">
              {classes.slice(0, 6).map((c) => (
                <li key={c.id} className="flex items-center gap-3 rounded-xl border border-[#E2E6EC] bg-white p-3" data-testid="class-card">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-[#F1F4F8] text-[#3D4759]"><WsIcon name="board" /></span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display text-lg font-extrabold leading-tight" title={c.name}>{c.name}</p>
                    <p className="flex items-center gap-1.5 whitespace-nowrap text-[15px] text-[#3D4759]">
                      <WsIcon name="users" className="h-4 w-4 shrink-0" /> {c._count.students} student{c._count.students === 1 ? "" : "s"}
                    </p>
                    {c.teacher.id !== teacher.id && <p className="truncate text-xs font-bold text-[#0F766E]">Co-teaching</p>}
                  </div>
                  <Link href={`/teacher/classes/${c.id}`} className="ws-link inline-flex min-h-11 shrink-0 items-center whitespace-nowrap border-l border-[#E2E6EC] pl-3 text-[15px]" aria-label={`Manage class ${c.name}`}>Manage class</Link>
                </li>
              ))}
            </ul>
          )}
          {classes.length > 6 && <p className="mt-3 text-[15px] text-[#5B6577]">+{classes.length - 6} more in <Link href="/teacher/classes" className="ws-link">My Classes</Link></p>}
        </Card>

        <Card title="Assignments" action={<Link href="/teacher/assignments" className="ws-link inline-flex min-h-11 items-center gap-1">All assignments <WsIcon name="arrowRight" className="h-5 w-5" /></Link>} testId="dashboard-assignments">
          {assignments.length === 0 ? (
            <Empty title="No open assignments" body="Assign a Library topic to a class, group or students." action={<Link href="/teacher/tasks/assign" className="ws-btn ws-btn-primary">Assign topic</Link>} />
          ) : (
            <ul className="space-y-3">
              {assignments.map((a) => (
                <li key={a.id}>
                  <Link href={a.href} className="grid gap-3 rounded-xl border border-[#E2E6EC] bg-white p-4 transition-colors hover:border-[#2563EB] sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]" data-testid="assignment-summary">
                    <span className="min-w-0">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="font-display text-lg font-extrabold [overflow-wrap:anywhere]">{a.title}</span>
                        <span className={`ws-pill ${STATUS_CLS[a.status]}`}>{a.status}</span>
                      </span>
                      <span className="mt-0.5 block text-[15px] text-[#3D4759] [overflow-wrap:anywhere]">
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
          <ul className="topic-list">
            {picks.map((t, i) => (
              <li key={t.id}>
                <TopicRow topic={t} href={`/teacher/library/topics/${t.slug}`} studentViewHref={`/teacher/library/topics/${t.slug}/student-view`} steps={pickSteps[i]} favorite={{ on: favorites.has(t.id) }} />
              </li>
            ))}
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
