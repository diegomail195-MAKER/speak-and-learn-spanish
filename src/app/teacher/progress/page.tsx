import Link from "next/link";
import { Card, Empty, PageTitle, Progress } from "@/components/dashboard/DashBits";
import { LocalTime } from "@/components/dashboard/LocalTime";
import { requireTeacherPage } from "@/lib/auth/guards";
import { classTasks } from "@/lib/class-progress";
import { assignmentSummaries, teacherClasses } from "@/lib/dashboard/teacher";
import { db } from "@/lib/db";

export const metadata = { title: "Progress" };

// Teacher View › Progress: per class, how far each assignment got and each student's progress in
// the class's Topic tasks. Only classes the teacher owns or co-teaches.
export default async function ProgressPage({ searchParams }: { searchParams: Promise<{ class?: string }> }) {
  const { teacher } = await requireTeacherPage();
  const sp = await searchParams;
  const classes = await teacherClasses(teacher.id);
  if (classes.length === 0) {
    return (
      <>
        <PageTitle title="Progress" />
        <Empty title="No classes yet" body="Create a class and assign a topic to follow your students’ progress here." action={<Link href="/teacher/classes" className="ws-btn ws-btn-primary">Create a class</Link>} />
      </>
    );
  }
  const current = classes.find((c) => c.id === sp.class) ?? classes[0];
  const [summaries, tasks, students] = await Promise.all([
    assignmentSummaries(teacher.id, { classroomId: current.id, take: 30 }),
    classTasks(current.id),
    db.student.findMany({ where: { classroomId: current.id, active: true }, orderBy: [{ firstName: "asc" }, { lastInitial: "asc" }], select: { id: true, firstName: true, lastInitial: true } }),
  ]);
  const shownTasks = tasks.slice(0, 8);
  const overall = (sid: string) => {
    const mine = tasks.filter((t) => t.students.has(sid) && t.total > 0);
    return mine.length ? Math.round(mine.reduce((n, t) => n + t.pct(sid), 0) / mine.length) : null;
  };
  return (
    <>
      <PageTitle title="Progress" subtitle="Completion of each assignment and each student’s progress, by class." />
      <nav aria-label="Classes" className="mb-5 flex flex-wrap gap-2" data-testid="progress-classes">
        {classes.map((c) => (
          <Link key={c.id} href={`/teacher/progress?class=${c.id}`} aria-current={c.id === current.id ? "page" : undefined} className="inline-flex min-h-11 max-w-full items-center gap-2 truncate rounded-full border border-[#E2E6EC] bg-white px-4 font-bold text-[#3D4759] aria-[current=page]:border-[#2563EB] aria-[current=page]:bg-[#E8EFFF] aria-[current=page]:text-[#1D4ED8]">
            <span className="truncate">{c.name}</span> <span className="text-sm opacity-70">{c._count.students}</span>
          </Link>
        ))}
      </nav>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <Card title="Assignments" testId="progress-assignments">
          {summaries.length === 0 ? (
            <Empty title="Nothing assigned to this class yet" action={<Link href={`/teacher/tasks/assign?classroomId=${current.id}`} className="ws-btn ws-btn-primary">Assign topic</Link>} />
          ) : (
            <ul className="space-y-3">
              {summaries.map((a) => (
                <li key={a.id}>
                  <Link href={a.href} className="block rounded-xl border border-[#E2E6EC] p-4 hover:border-[#2563EB]">
                    <p className="font-bold [overflow-wrap:anywhere]">{a.title} <span className="text-sm font-semibold text-[#5B6577]">· {a.status}</span></p>
                    <p className="mb-2 text-sm text-[#5B6577] [overflow-wrap:anywhere]">{a.who}{a.dueAt ? <> · Due <LocalTime iso={a.dueAt.toISOString()} mode="day" /></> : ""}</p>
                    <Progress done={a.completed} total={a.total} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card title="Students" action={<Link href={`/teacher/classes/${current.id}`} className="ws-link inline-flex min-h-11 items-center">Open class</Link>} testId="progress-students">
          {students.length === 0 ? (
            <Empty title="No students in this class yet" />
          ) : (
            <div className="-mx-4 overflow-x-auto sm:mx-0">
              <table className="ws-table min-w-[560px]">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Overall</th>
                    {shownTasks.map((t) => <th key={t.id} className="max-w-40 truncate" title={t.topic?.titleEs ?? t.title}>{t.topic?.titleEs ?? t.title}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {students.map((s) => {
                    const all = overall(s.id);
                    return (
                      <tr key={s.id} data-testid="progress-student">
                        <td className="font-bold">{s.firstName}{s.lastInitial ? ` ${s.lastInitial}.` : ""}</td>
                        <td>{all === null ? <span className="text-[#5B6577]">—</span> : `${all}%`}</td>
                        {shownTasks.map((t) => <td key={t.id}>{t.students.has(s.id) ? `${t.pct(s.id)}%` : <span className="text-[#5B6577]">—</span>}</td>)}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {tasks.length > shownTasks.length && <p className="mt-3 text-sm text-[#5B6577]">Showing the latest {shownTasks.length} topic tasks. The class page shows all of them.</p>}
        </Card>
      </div>
    </>
  );
}
