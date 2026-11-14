import Link from "next/link";
import { LevelBadge } from "@/components/montessori/LevelBadge";
import { EmptyState, PageHeader } from "@/components/ui/Panel";
import { requireTeacherPage } from "@/lib/auth/guards";
import { LEVEL_LABEL } from "@/lib/montessori/levels";
import { recommendation } from "@/lib/montessori/recommend";
import { progressOverview, teacherClasses } from "@/lib/montessori/server";
import { LEVELS, type ProgressLevel } from "@/lib/montessori/types";

export const metadata = { title: "Montessori Learning Feedback & Progress" };

// Only the teacher's own classes are listed (progressOverview filters by teacher).
export default async function ProgressPage({ searchParams }: { searchParams: Promise<{ class?: string; group?: string; topic?: string }> }) {
  const { teacher } = await requireTeacherPage();
  const f = await searchParams;
  const classes = await teacherClasses(teacher.id);
  const classroomId = classes.some((c) => c.id === f.class) ? f.class : undefined;
  const groups = classes.filter((c) => !classroomId || c.id === classroomId).flatMap((c) => c.levels.flatMap((l) => l.groups.map((g) => ({ id: g.id, name: `${l.name} ${g.name}`, classroom: c.name }))));
  const groupId = groups.some((g) => g.id === f.group) ? f.group : undefined;
  const { students, topics } = await progressOverview(teacher.id, { classroomId, groupId, topic: f.topic || undefined });
  const eff = (s: { level: string; teacherLevel: string | null }) => (s.teacherLevel ?? s.level) as ProgressLevel;

  return (
    <>
      <PageHeader eyebrow="Learning progress" title="Montessori Learning Feedback & Progress" subtitle="Each level describes what a student has shown for one word or phrase, from recorded answers. It is never a label for the child. Open a student to adjust a level or add an observation." />
      <form className="mb-6 flex flex-wrap items-end gap-3 rounded-xl2 border border-line bg-card p-4" method="get">
        <label className="text-sm font-bold">
          Class
          <select name="class" defaultValue={classroomId ?? ""} className="mt-1 block h-10 rounded-lg border border-line bg-card px-2 font-normal">
            <option value="">All my classes</option>
            {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
        <label className="text-sm font-bold">
          Group
          <select name="group" defaultValue={groupId ?? ""} className="mt-1 block h-10 rounded-lg border border-line bg-card px-2 font-normal">
            <option value="">All groups</option>
            {groups.map((g) => <option key={g.id} value={g.id}>{g.name}{classroomId ? "" : ` · ${g.classroom}`}</option>)}
          </select>
        </label>
        <label className="text-sm font-bold">
          Topic
          <select name="topic" defaultValue={f.topic ?? ""} className="mt-1 block h-10 rounded-lg border border-line bg-card px-2 font-normal">
            <option value="">All topics</option>
            {topics.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
        <button className="h-10 rounded-full bg-ink px-5 font-bold text-white">Show</button>
      </form>

      {students.length === 0 ? (
        <EmptyState title="No students here yet" body="Add students to a class. Their progress appears after they finish an activity." />
      ) : (
        <div className="overflow-x-auto rounded-xl2 border border-line bg-card">
          <table className="w-full text-left text-sm" data-testid="progress-table">
            <thead className="bg-paper text-xs uppercase tracking-wider text-muted">
              <tr>
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">Class / group</th>
                <th className="px-4 py-3">Skills by level</th>
                <th className="px-4 py-3">Answers</th>
                <th className="px-4 py-3">Help · self-corrections</th>
                <th className="px-4 py-3">Last practice</th>
                <th className="px-4 py-3">Recommended next</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => {
                const sk = s.skillProgress;
                const count = (l: ProgressLevel) => sk.filter((x) => eff(x) === l).length;
                const last = sk.reduce<Date | null>((m, x) => (!m || x.lastPracticedAt > m ? x.lastPracticedAt : m), null);
                const rec = recommendation(s.firstName, sk.map((x) => ({ label: x.label, level: eff(x), attempts: x.attempts, lastActivity: x.lastActivity })));
                return (
                  <tr key={s.id} className="border-t border-line align-top">
                    <td className="px-4 py-3">
                      <Link href={`/teacher/progress/${s.id}`} className="font-bold text-sky hover:underline">{s.firstName} {s.lastInitial}</Link>
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {s.classroom.name}
                      {s.memberships.length > 0 && <span className="block text-xs">{s.memberships.map((m) => `${m.group.level.name} ${m.group.name}`).join(", ")}</span>}
                    </td>
                    <td className="px-4 py-3">
                      {sk.length === 0 ? <span className="text-muted">No records yet</span> : (
                        <span className="flex flex-wrap gap-1">
                          {LEVELS.filter((l) => count(l) > 0).map((l) => (
                            <span key={l} className="inline-flex items-center gap-1"><LevelBadge level={l} /> <span className="text-xs text-muted">×{count(l)}</span></span>
                          ))}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">{sk.reduce((n, x) => n + x.correct, 0)} correct · {sk.reduce((n, x) => n + x.missed, 0)} to reinforce</td>
                    <td className="px-4 py-3">{sk.reduce((n, x) => n + x.hintsUsed, 0)} · {sk.reduce((n, x) => n + x.selfCorrections, 0)}</td>
                    <td className="px-4 py-3">{last ? last.toLocaleDateString("en-US") : "—"}</td>
                    <td className="px-4 py-3 text-ink-2">{rec?.next ? <>Practice again: <strong>{rec.next}</strong></> : sk.length ? "—" : ""}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <p className="mt-4 text-xs text-muted">
        Levels: {LEVELS.map((l) => LEVEL_LABEL[l].en).join(" → ")}. Proficient needs several independent answers on more than one day; one correct answer is never enough. Criteria are set by the administrator.
      </p>
    </>
  );
}
