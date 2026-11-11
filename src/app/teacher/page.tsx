import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { ButtonLink } from "@/components/ui/Button";
import { PageHeader, Panel } from "@/components/ui/Panel";
import { requireTeacherPage } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { sttProvider } from "@/lib/stt";
import { ttsProvider } from "@/lib/tts";

export const metadata = { title: "Teacher Dashboard" };

export default async function Dashboard() {
  const { user, teacher } = await requireTeacherPage();
  const [classes, students, games, published, assignments, recent] = await Promise.all([
    db.classroom.count({ where: { teacherId: teacher.id } }),
    db.student.count({ where: { classroom: { teacherId: teacher.id }, active: true } }),
    db.game.count({ where: { schoolId: user.schoolId, status: { not: "ARCHIVED" } } }),
    db.game.count({ where: { schoolId: user.schoolId, status: "PUBLISHED" } }),
    db.assignment.count({ where: { teacherId: teacher.id, active: true } }),
    db.studentAttempt.findMany({
      where: { assignment: { teacherId: teacher.id }, completedAt: { not: null } },
      include: { student: true, game: { select: { title: true } } },
      orderBy: { completedAt: "desc" },
      take: 8,
    }),
  ]);
  const tts = ttsProvider();
  const stt = sttProvider();

  const steps = [
    { done: classes > 0, label: "Create a class", href: "/teacher/classes" },
    { done: students > 0, label: "Add students and groups", href: "/teacher/classes" },
    { done: published > 0, label: "Create and publish an activity", href: "/teacher/games/new" },
    { done: assignments > 0, label: "Assign it to a group", href: "/teacher/assignments/new" },
  ];

  return (
    <>
      <PageHeader eyebrow="Teacher Dashboard" title={`Hola, ${user.displayName.split(" ")[0]}`} actions={<ButtonLink href="/teacher/games/new">+ Create Activity</ButtonLink>} />

      {steps.some((s) => !s.done) && (
        <Panel className="mb-6">
          <h2 className="font-display text-lg font-semibold">Getting started</h2>
          <ol className="mt-3 grid gap-2 sm:grid-cols-4">
            {steps.map((s, i) => (
              <li key={s.label}>
                <Link href={s.href} className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-bold ${s.done ? "bg-leaf-soft text-leaf" : "bg-paper-2 text-ink-2 hover:bg-line"}`}>
                  <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border-[1.5px] text-xs ${s.done ? "border-leaf bg-leaf text-white" : "border-ink bg-card"}`}>{s.done ? <Icon name="check" size={14} strokeWidth={3} /> : i + 1}</span>
                  {s.label}
                </Link>
              </li>
            ))}
          </ol>
        </Panel>
      )}

      <dl className="mb-6 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-4">
        {[
          ["Students", students],
          ["Classes", classes],
          ["Games", games],
          ["Open assignments", assignments],
        ].map(([k, v]) => (
          <div key={k} className="bg-card px-5 py-4">
            <dt className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted">
              <span aria-hidden="true" className={`h-2.5 w-2.5 rounded-full border border-ink ${{ Students: "bg-sun", Classes: "bg-aqua", Games: "bg-coral-bright", "Open assignments": "bg-indigo" }[k as string]}`} />
              {k}
            </dt>
            <dd className="mt-1 font-display text-4xl font-bold tabular-nums">{v}</dd>
          </div>
        ))}
      </dl>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <Panel>
          <h2 className="font-display text-lg font-semibold">Recently completed</h2>
          {recent.length === 0 ? (
            <p className="mt-2 text-sm text-muted">No completed activities yet. Results appear here as soon as students finish.</p>
          ) : (
            <ul className="mt-3 divide-y divide-line text-sm">
              {recent.map((r) => (
                <li key={r.id} className="flex flex-wrap items-center gap-2 py-2.5">
                  <span className="font-bold">{r.student.firstName} {r.student.lastInitial}</span>
                  <span className="text-muted">{r.game.title}</span>
                  <span className="ml-auto">{r.independentCount}/{r.questionsPresented} independent</span>
                  {r.assignmentId && <Link href={`/teacher/assignments/${r.assignmentId}`} className="font-bold text-coral">View</Link>}
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel>
          <h2 className="font-display text-lg font-semibold">Speech services</h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <strong>Voice generation (TTS):</strong> {tts ? <span className="text-leaf">{tts} connected</span> : <span className="text-sun-ink">not configured — students hear the device&apos;s Spanish voice when available</span>}
            </li>
            <li>
              <strong>Speech recognition (STT):</strong> {stt === "scripted-test" ? <span className="font-bold text-coral-dark">TEST RECOGNIZER — for automated tests only, not for classrooms</span> : stt ? <span className="text-leaf">{stt} connected</span> : <span className="text-sun-ink">using Chrome&apos;s built-in recognizer (needs internet; audio goes to Google)</span>}
            </li>
          </ul>
        </Panel>
      </div>
    </>
  );
}
