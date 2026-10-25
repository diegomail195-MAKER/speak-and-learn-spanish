import { notFound } from "next/navigation";
import { PrintButton } from "@/components/teacher/PrintButton";
import { Button } from "@/components/ui/Button";
import { Badge, EmptyState, PageHeader, Panel } from "@/components/ui/Panel";
import { setAssignmentActive } from "@/lib/actions/assignments";
import { requireTeacherPage } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { assignmentReport, pct } from "@/lib/reports";
import { REASON_TEXT, type EvaluationReason } from "@/lib/speech/evaluate";

export const metadata = { title: "Results" };

const fmtTime = (ms: number | null) => (ms == null ? "—" : `${Math.floor(ms / 60000)}:${String(Math.round((ms % 60000) / 1000)).padStart(2, "0")}`);

export default async function AssignmentResults({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { teacher } = await requireTeacherPage();
  const owned = await db.assignment.findFirst({ where: { id, teacherId: teacher.id }, select: { id: true } });
  if (!owned) notFound();
  const { assignment: a, rows, questionStats } = await assignmentReport(id);
  const completed = rows.filter((r) => r.status === "completed").length;

  return (
    <>
      <PageHeader
        eyebrow="Results"
        title={a.game?.title ?? "Activity"}
        subtitle={<>{rows.length} students · {completed} completed · {a.dueAt ? `due ${a.dueAt.toLocaleString("en-US")}` : "no due date"} · {a.maxAttempts ? `${a.maxAttempts} attempts allowed` : "unlimited attempts"}</>}
        actions={
          <div className="no-print flex gap-2">
            <PrintButton />
            <form action={setAssignmentActive}>
              <input type="hidden" name="assignmentId" value={a.id} />
              <input type="hidden" name="active" value={String(!a.active)} />
              <Button variant="secondary" size="md">{a.active ? "Close assignment" : "Reopen"}</Button>
            </form>
          </div>
        }
      />
      <Panel className="mb-6 overflow-x-auto">
        <h2 className="mb-3 font-display text-xl font-semibold">Students</h2>
        {rows.length === 0 ? (
          <EmptyState title="No students receive this assignment" body="The selected groups have no students yet." />
        ) : (
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="text-xs uppercase tracking-wider text-muted">
              <tr>
                <th className="py-2">Student</th>
                <th>Status</th>
                <th title="Correct without hint or model">Independent</th>
                <th title="Correct after a hint or the model">Guided</th>
                <th>Needs practice</th>
                <th title="Not heard clearly — not counted as mistakes">Unclear</th>
                <th>Time</th>
                <th>Attempts</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((r) => {
                const p = pct(r.independent, r.presented);
                return (
                  <tr key={r.studentId}>
                    <td className="py-2.5 font-bold">{r.name}</td>
                    <td>
                      <Badge tone={r.status === "completed" ? "leaf" : r.status === "in_progress" ? "sun" : "neutral"}>{r.status.replace("_", " ")}</Badge>
                    </td>
                    <td>{r.independent == null ? "—" : <>{r.independent}/{r.presented} {p != null && <span className="text-muted">({p}%)</span>}</>}</td>
                    <td>{r.guided ?? "—"}</td>
                    <td>{r.needsPractice ?? "—"}</td>
                    <td>{r.uncertain ?? "—"}</td>
                    <td>{fmtTime(r.durationMs)}</td>
                    <td>{r.attempts}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        <p className="mt-3 text-xs text-muted">Independent = correct with no hint and no model. Answers given after hearing the model count as guided, never independent.</p>
      </Panel>

      <Panel>
        <h2 className="mb-3 font-display text-xl font-semibold">Questions</h2>
        <ul className="divide-y divide-line">
          {questionStats.map((q, i) => (
            <li key={q.id} className="py-3">
              <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                <span className="font-bold">{i + 1}. {q.prompt}</span>
                <span className="text-sm text-muted">Answer: {q.expected.startsWith("{{") ? "student's own name" : q.expected}</span>
                <span className="ml-auto text-sm">
                  {q.answered === 0 ? <span className="text-muted">No answers yet</span> : <>{q.independent} independent · {q.guided} guided · {q.practice} need practice</>}
                </span>
              </div>
              {q.responses.length > 0 && (
                <details className="mt-1 text-sm">
                  <summary className="cursor-pointer text-xs font-bold text-muted">What students said ({q.responses.length})</summary>
                  <table className="mt-2 w-full text-left text-xs">
                    <thead className="text-muted"><tr><th className="py-1">Transcript</th><th>Result</th><th>Support</th><th>Confidence</th><th>Engine</th><th>Reason</th></tr></thead>
                    <tbody>
                      {q.responses.map((r) => (
                        <tr key={r.id} className="border-t border-line">
                          <td className="py-1">{r.transcript || "—"}</td>
                          <td className={r.outcome === "CORRECT" ? "font-bold text-leaf" : r.outcome === "INCORRECT" ? "font-bold text-coral-dark" : "font-bold text-sky"}>{r.outcome}</td>
                          <td>{r.support}</td>
                          <td>{r.confidence != null ? r.confidence.toFixed(2) : "n/a"}</td>
                          <td>{r.provider} · {r.language}</td>
                          <td>{r.reason === "too_quiet" ? "Audio too quiet" : REASON_TEXT[r.reason as EvaluationReason] ?? r.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </details>
              )}
            </li>
          ))}
        </ul>
      </Panel>
    </>
  );
}
