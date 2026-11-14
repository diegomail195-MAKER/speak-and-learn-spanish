import Link from "next/link";
import { notFound } from "next/navigation";
import { LevelBadge } from "@/components/montessori/LevelBadge";
import { SkillLevelForm } from "@/components/montessori/SkillLevelForm";
import { Panel } from "@/components/ui/Panel";
import { HttpError, requireTeacherPage } from "@/lib/auth/guards";
import { recommendation } from "@/lib/montessori/recommend";
import { getMontessoriConfig, studentProgress } from "@/lib/montessori/server";
import type { ProgressLevel } from "@/lib/montessori/types";

export const metadata = { title: "Student progress" };

export default async function StudentProgressPage({ params }: { params: Promise<{ studentId: string }> }) {
  const { teacher } = await requireTeacherPage();
  const { studentId } = await params;
  let s;
  try {
    s = await studentProgress(teacher.id, studentId);
  } catch (e) {
    if (e instanceof HttpError) notFound();
    throw e;
  }
  const config = await getMontessoriConfig();
  const eff = (x: { level: string; teacherLevel: string | null }) => (x.teacherLevel ?? x.level) as ProgressLevel;
  const byTopic = new Map<string, typeof s.skillProgress>();
  for (const x of s.skillProgress) byTopic.set(x.topic || "Other", [...(byTopic.get(x.topic || "Other") ?? []), x]);

  return (
    <>
      <Link href="/teacher/progress" className="font-bold text-sky hover:underline">‹ Montessori Learning Feedback &amp; Progress</Link>
      <h1 className="mt-2 font-display text-3xl font-semibold">{s.firstName} {s.lastInitial}</h1>
      <p className="text-muted">
        {s.classroom.name}
        {s.memberships.length > 0 && ` · ${s.memberships.map((m) => `${m.group.level.name} ${m.group.name}`).join(", ")}`}
      </p>

      {s.skillProgress.length === 0 && <Panel className="mt-6">No learning records yet. They appear when {s.firstName} finishes an activity.</Panel>}

      {[...byTopic].map(([topic, skills]) => {
        const rec = recommendation(s.firstName, skills.map((x) => ({ label: x.label, level: eff(x), attempts: x.attempts, lastActivity: x.lastActivity })));
        return (
          <section key={topic} className="mt-8" data-testid="topic-progress">
            <h2 className="font-display text-2xl font-semibold">Topic: {topic}</h2>
            {rec && (
              <div className="mt-3 rounded-xl2 bg-sky-soft p-4" data-testid="teacher-recommendation">
                <p className="text-xs font-bold uppercase tracking-wider text-sky">Teacher recommendation</p>
                {config.language !== "es" && <p className="mt-1 font-semibold">{rec.en}</p>}
                {config.language !== "en" && <p className="mt-1 text-ink-2" lang="es">{rec.es}</p>}
                {rec.next && <p className="mt-2 text-sm">Next recommended activity: <strong>{rec.next}</strong></p>}
              </div>
            )}
            <div className="mt-3 overflow-x-auto rounded-xl2 border border-line bg-card">
              <table className="w-full text-left text-sm">
                <thead className="bg-paper text-xs uppercase tracking-wider text-muted">
                  <tr>
                    <th className="px-3 py-2">Skill</th>
                    <th className="px-3 py-2">Level</th>
                    <th className="px-3 py-2">Attempts</th>
                    <th className="px-3 py-2">Correct</th>
                    <th className="px-3 py-2">To reinforce</th>
                    <th className="px-3 py-2">Help used</th>
                    <th className="px-3 py-2">Self-corrections</th>
                    <th className="px-3 py-2">Days independent</th>
                    <th className="px-3 py-2">Last practice</th>
                    <th className="px-3 py-2">Adjust level · observation</th>
                  </tr>
                </thead>
                <tbody>
                  {skills.map((x) => (
                    <tr key={x.id} className="border-t border-line align-top" data-testid="skill-row">
                      <td className="px-3 py-2 font-semibold">{x.label}<span className="block text-xs font-normal text-muted">{x.lastActivity}</span></td>
                      <td className="px-3 py-2">
                        <LevelBadge level={eff(x)} teacherSet={!!x.teacherLevel} />
                        {x.teacherLevel && <span className="mt-1 block text-xs text-muted">Recorded: {x.level.toLowerCase()}</span>}
                      </td>
                      <td className="px-3 py-2">{x.attempts}</td>
                      <td className="px-3 py-2">{x.correct} ({x.independentCorrect} with no help)</td>
                      <td className="px-3 py-2">{x.missed}</td>
                      <td className="px-3 py-2">{x.hintsUsed}</td>
                      <td className="px-3 py-2">{x.selfCorrections}</td>
                      <td className="px-3 py-2">{x.independentDays.length}</td>
                      <td className="px-3 py-2">{x.lastPracticedAt.toLocaleDateString("en-US")}</td>
                      <td className="min-w-80 px-3 py-2">
                        <SkillLevelForm skillId={x.id} computed={x.level as ProgressLevel} teacherLevel={x.teacherLevel as ProgressLevel | null} note={x.teacherNote} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}
      <p className="mt-6 text-xs text-muted">Recommendations use only recorded answers (accuracy, help used, self-corrections, consistency across days and activities). They say nothing about feelings, personality or general ability.</p>
    </>
  );
}
