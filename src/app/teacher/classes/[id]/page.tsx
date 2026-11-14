import Link from "next/link";
import { notFound } from "next/navigation";
import { AddStudentsMenu } from "@/components/teacher/AddStudentsMenu";
import { Icon } from "@/components/ui/Art";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { Badge, EmptyState, Panel } from "@/components/ui/Panel";
import { createLevel, deleteGroup } from "@/lib/actions/classroom";
import { requireTeacherPage } from "@/lib/auth/guards";
import { classTasks } from "@/lib/class-progress";
import { db } from "@/lib/db";

export default async function ClassPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ q?: string }> }) {
  const { id } = await params;
  const { q = "" } = await searchParams;
  const { teacher } = await requireTeacherPage();
  const c = await db.classroom.findFirst({
    where: { id, teacherId: teacher.id },
    include: {
      levels: { orderBy: { sortOrder: "asc" }, include: { groups: { orderBy: { name: "asc" }, include: { _count: { select: { memberships: true } } } } } },
      students: { orderBy: [{ firstName: "asc" }, { lastInitial: "asc" }], select: { id: true, firstName: true, lastInitial: true, active: true } },
    },
  });
  if (!c) notFound();
  const tasks = await classTasks(c.id, teacher.id);
  const needle = q.trim().toLowerCase();
  const students = needle ? c.students.filter((s) => `${s.firstName} ${s.lastInitial}`.toLowerCase().includes(needle)) : c.students;
  const overall = (sid: string) => {
    const mine = tasks.filter((t) => t.students.has(sid) && t.total > 0);
    return mine.length ? Math.round(mine.reduce((n, t) => n + t.pct(sid), 0) / mine.length) : null;
  };

  return (
    <>
      <Link href="/teacher/classes" className="text-sm font-bold text-sky hover:underline">‹ My Classes</Link>
      <div className="mb-6 mt-2 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-bold tracking-tight">{c.name}</h1>
          <p className="mt-1 font-bold text-muted">
            {c.students.length} Total Students · class code{" "}
            <span className="rounded-md bg-teal-soft px-2 py-0.5 font-mono font-bold tracking-widest text-teal-dark">{c.code}</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <AddStudentsMenu classroomId={c.id} />
          <ButtonLink href={`/teacher/tasks/assign?classroomId=${c.id}`}>Assign Task</ButtonLink>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-x-5 gap-y-2">
        <form className="relative min-w-64">
          <Input name="q" defaultValue={q} placeholder="Search by student name" aria-label="Search students" className="rounded-full pr-10" />
        </form>
        <Link href={`/teacher/classes/${c.id}/roster`} className="inline-flex items-center gap-1.5 font-bold text-sky hover:underline">
          <Icon name="book" className="h-5 w-5" /> Roster
        </Link>
        <Link href={`/teacher/classes/${c.id}/print`} className="inline-flex items-center gap-1.5 font-bold text-sky hover:underline">
          <Icon name="printables" className="h-5 w-5" /> Print Access Instructions
        </Link>
      </div>

      <Panel className="mb-6 overflow-x-auto p-0 sm:p-0">
        {c.students.length === 0 ? (
          <div className="p-6">
            <EmptyState title="No students yet" body="Use Add Students to add one student, paste a list, or create a group." />
          </div>
        ) : (
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-sky-soft text-ink">
              <tr>
                <th className="px-4 py-3 font-bold">Name</th>
                <th className="px-4 py-3 font-bold">Total Progress</th>
                {tasks.map((t) => (
                  <th key={t.id} className="border-l border-line px-4 py-3 font-bold">
                    <Link href={`/teacher/tasks/${t.id}`} className="hover:underline">{t.topic?.titleEs ?? t.title}</Link>
                    {t.dueAt && <span className="block text-xs font-semibold text-muted">Due: {t.dueAt.toLocaleDateString("en-US")}</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {students.map((s) => {
                const all = overall(s.id);
                return (
                  <tr key={s.id}>
                    <td className="px-4 py-3 font-bold">
                      {s.firstName} {s.lastInitial && `${s.lastInitial}.`} {!s.active && <Badge tone="coral">can’t sign in</Badge>}
                    </td>
                    <td className="px-4 py-3">{all === null ? <span className="text-muted">—</span> : <Bar pct={all} />}</td>
                    {tasks.map((t) => (
                      <td key={t.id} className="border-l border-line px-4 py-3">
                        {t.students.has(s.id) ? <Bar pct={t.pct(s.id)} /> : <span className="text-muted">—</span>}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Panel>

      <Panel>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl font-bold">Groups</h2>
            <p className="text-sm text-muted">A student can be in more than one group. Assign a task to a whole group at once.</p>
          </div>
          <ButtonLink href={`/teacher/classes/${c.id}/groups/new`} variant="secondary" size="sm">+ Create Group</ButtonLink>
        </div>
        <div className="mt-4 space-y-4">
          {c.levels.length === 0 && <p className="text-sm text-muted">No groups yet.</p>}
          {c.levels.map((l) => (
            <div key={l.id}>
              {c.levels.length > 1 || l.name !== "Groups" ? <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.14em] text-muted">{l.name}</p> : null}
              <ul className="flex flex-wrap gap-2">
                {l.groups.map((g) => (
                  <li key={g.id} className="flex items-center gap-1 rounded-full bg-paper-2 py-1 pl-3 pr-1 text-sm font-bold">
                    <Link href={`/teacher/classes/${c.id}/groups/${g.id}`} className="hover:underline">
                      {g.name} <span className="text-xs font-semibold text-muted">({g._count.memberships})</span>
                    </Link>
                    <form action={deleteGroup}>
                      <input type="hidden" name="groupId" value={g.id} />
                      <button className="ml-1 grid h-7 w-7 place-items-center rounded-full text-muted hover:bg-coral-soft hover:text-coral-dark" aria-label={`Delete ${g.name}`} title="Delete group (students stay in the class)">
                        ×
                      </button>
                    </form>
                  </li>
                ))}
                {l.groups.length === 0 && <li className="text-sm text-muted">No groups in {l.name}.</li>}
              </ul>
            </div>
          ))}
        </div>
        <details className="mt-5">
          <summary className="cursor-pointer text-sm font-bold text-muted">Levels (LE1, LE2, UE1…)</summary>
          <form action={createLevel} className="mt-2 flex max-w-md gap-2">
            <input type="hidden" name="classroomId" value={c.id} />
            <Input name="name" placeholder="LE2" required maxLength={60} aria-label="New level" />
            <Button size="md" variant="secondary">Add level</Button>
          </form>
        </details>
      </Panel>
    </>
  );
}

function Bar({ pct }: { pct: number }) {
  return (
    <span className="flex items-center gap-2">
      <span className="h-2 w-24 overflow-hidden rounded-full bg-paper-2">
        <span className="block h-full rounded-full bg-mint" style={{ width: `${pct}%` }} />
      </span>
      <span className="text-xs font-bold">{pct}%</span>
    </span>
  );
}
