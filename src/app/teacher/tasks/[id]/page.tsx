import Link from "next/link";
import { notFound } from "next/navigation";
import { KindBadge } from "@/components/library/LibraryBits";
import { Art } from "@/components/ui/Art";
import { Button } from "@/components/ui/Button";
import { Badge, Panel } from "@/components/ui/Panel";
import { setAssignmentActive } from "@/lib/actions/assignments";
import { requireTeacherPage } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import type { Kind } from "@/lib/library/types";

export const metadata = { title: "Task" };

export default async function TaskPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ new?: string }> }) {
  const { id } = await params;
  const { new: isNew } = await searchParams;
  const { teacher } = await requireTeacherPage();
  const t = await db.assignment.findFirst({
    where: { id, teacherId: teacher.id, topicId: { not: null } },
    include: {
      topic: true,
      recipients: {
        include: {
          group: { include: { level: { include: { classroom: { select: { id: true, name: true } } } }, memberships: { include: { student: { select: { id: true, firstName: true, lastInitial: true } } } } } },
          student: { select: { id: true, firstName: true, lastInitial: true, classroom: { select: { id: true, name: true } } } },
        },
      },
      activities: { orderBy: { position: "asc" }, include: { resource: { select: { kind: true, status: true } }, version: { select: { number: true, title: true } }, progress: { select: { studentId: true, completedAt: true, score: true, total: true } } } },
    },
  });
  if (!t) notFound();
  const students = new Map<string, { id: string; name: string; via: string[] }>();
  const add = (s: { id: string; firstName: string; lastInitial: string }, via: string) => {
    const cur = students.get(s.id) ?? { id: s.id, name: `${s.firstName}${s.lastInitial ? ` ${s.lastInitial}.` : ""}`, via: [] };
    cur.via.push(via);
    students.set(s.id, cur);
  };
  for (const r of t.recipients) {
    if (r.group) r.group.memberships.forEach((m) => add(m.student, `group ${r.group!.name}`));
    if (r.student) add(r.student, "individual");
  }
  const classroom = t.recipients.map((r) => r.group?.level.classroom ?? r.student?.classroom).find(Boolean);
  const list = [...students.values()].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <>
      {classroom && <Link href={`/teacher/classes/${classroom.id}`} className="text-sm font-bold text-sky hover:underline">‹ {classroom.name}</Link>}
      {isNew && <p role="status" className="mt-3 rounded-[18px] bg-leaf-soft px-4 py-3 font-bold text-leaf">Task assigned. Students see it in “My Activities”.</p>}
      <div className="mb-6 mt-3 flex flex-wrap items-center gap-5 rounded-[28px] p-6 shadow-pop" style={{ background: t.topic?.color }}>
        <Art k={t.topic?.art} className="h-20 w-20" />
        <div className="flex-1">
          <h1 className="font-display text-4xl font-extrabold leading-none">{t.topic?.titleEs}</h1>
          <p className="mt-1 font-bold text-ink/75">{t.topic?.titleEn}{t.dueAt && ` · due ${t.dueAt.toLocaleDateString("en-US")}`}</p>
        </div>
        {!t.active && <Badge tone="coral">Closed</Badge>}
        <form action={setAssignmentActive}>
          <input type="hidden" name="assignmentId" value={t.id} />
          <input type="hidden" name="active" value={t.active ? "false" : "true"} />
          <Button variant="secondary" size="sm">{t.active ? "Close task" : "Reopen task"}</Button>
        </form>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <Panel>
          <h2 className="font-display text-xl font-extrabold">Assigned to · {list.length} student{list.length === 1 ? "" : "s"}</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {t.recipients.map((r) => r.group ? <li key={r.id}><Badge tone="teal">Group {r.group.name}</Badge></li> : null)}
          </ul>
          <ul className="mt-3 divide-y divide-line" data-testid="task-students">
            {list.map((s) => <li key={s.id} className="flex justify-between py-2"><span className="font-bold">{s.name}</span><span className="text-sm text-muted">{s.via.join(", ")}</span></li>)}
          </ul>
        </Panel>
        <Panel>
          <h2 className="font-display text-xl font-extrabold">Activities · {t.activities.length}</h2>
          <ul className="mt-3 divide-y divide-line">
            {t.activities.map((a) => {
              const done = new Set(a.progress.filter((p) => p.completedAt).map((p) => p.studentId));
              return (
                <li key={a.id} className="flex flex-wrap items-center gap-3 py-3">
                  <KindBadge kind={a.resource.kind as Kind} />
                  <span className="flex-1 font-bold">{a.version.title} <span className="text-xs font-semibold text-muted">v{a.version.number}</span></span>
                  {a.resource.status === "ARCHIVED" && <Badge>archived</Badge>}
                  <span className="text-sm font-bold">{done.size}/{list.length} done</span>
                </li>
              );
            })}
          </ul>
        </Panel>
      </div>

      <Panel className="mt-6 overflow-x-auto">
        <h2 className="font-display text-xl font-extrabold">Progress</h2>
        <table className="mt-3 w-full min-w-[600px] text-left text-sm">
          <thead className="bg-sky-soft">
            <tr><th className="px-3 py-2">Student</th>{t.activities.map((a) => <th key={a.id} className="px-3 py-2">{a.version.title}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-line">
            {list.map((s) => (
              <tr key={s.id}>
                <td className="px-3 py-2 font-bold">{s.name}</td>
                {t.activities.map((a) => {
                  const p = a.progress.filter((x) => x.studentId === s.id && x.completedAt);
                  const best = p.reduce<{ score: number | null; total: number | null } | null>((b, x) => (!b || (x.score ?? 0) > (b.score ?? 0) ? x : b), null);
                  return <td key={a.id} className="px-3 py-2">{best ? <span className="font-bold text-leaf">✓{best.total ? ` ${best.score}/${best.total}` : ""}</span> : <span className="text-muted">—</span>}</td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </>
  );
}
