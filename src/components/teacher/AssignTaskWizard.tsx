"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { KindBadge } from "@/components/library/LibraryBits";
import { Art } from "@/components/ui/Art";
import { Button } from "@/components/ui/Button";
import { FormError, Input, Label, Select } from "@/components/ui/Field";
import { Panel } from "@/components/ui/Panel";
import { createTopicTask } from "@/lib/actions/tasks";
import { GRADES, GRADE_LABEL, KIND_LABEL, type Grade, type Kind } from "@/lib/library/types";
import { dedupeRecipients } from "@/lib/tasks";

type ClassData = { id: string; name: string; groups: Array<{ id: string; name: string; memberIds: string[] }>; students: Array<{ id: string; name: string }> };
type TopicData = { id: string; slug: string; titleEn: string; titleEs: string; category: string; color: string; art: string; resources: Array<{ id: string; kind: string; title: string; grades: string[]; href: string }> };

const chip = "flex cursor-pointer items-center gap-2 rounded-full border border-line bg-card px-3 py-2 text-sm font-bold has-[:checked]:border-teal has-[:checked]:bg-teal-soft has-[:checked]:text-teal-dark";

export function AssignTaskWizard({ classes, topics, classTopics = {}, initialClassId, initialTopicId, initialGrade, initialOnly }: { classes: ClassData[]; topics: TopicData[]; classTopics?: Record<string, Record<string, TopicData["resources"]>>; initialClassId: string; initialTopicId?: string; initialGrade?: Grade; initialOnly?: string }) {
  // A topic's activities for a class: the setup confirmed for that class, or the teacher's default order.
  const resourcesOf = (t: TopicData | undefined, cid: string) => (t ? (classTopics[cid]?.[t.id] ?? t.resources) : []);
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [classId, setClassId] = useState(initialClassId);
  const [groupIds, setGroupIds] = useState<Set<string>>(new Set());
  const [studentIds, setStudentIds] = useState<Set<string>>(new Set());
  const [grade, setGrade] = useState<Grade | "">(initialGrade ?? "");
  const [category, setCategory] = useState("");
  const [q, setQ] = useState("");
  const [topicId, setTopicId] = useState(initialTopicId ?? "");
  // Arriving from "Assign this topic": every activity of that topic (for the grade) starts selected.
  // "Assign" on one activity of the topic starts with only that one selected.
  const [selected, setSelected] = useState<Set<string>>(() => {
    const all = resourcesOf(topics.find((t) => t.id === initialTopicId), initialClassId).filter((r) => !initialGrade || r.grades.includes(initialGrade)).map((r) => r.id);
    return new Set(initialOnly && all.includes(initialOnly) ? [initialOnly] : all);
  });
  const [title, setTitle] = useState(() => topics.find((t) => t.id === initialTopicId)?.titleEs ?? "");
  const [dueAt, setDueAt] = useState("");
  const [error, setError] = useState<string>();
  const [pending, start] = useTransition();

  const cls = classes.find((c) => c.id === classId)!;
  const rec = useMemo(() => dedupeRecipients(cls.groups.filter((g) => groupIds.has(g.id)), [...studentIds]), [cls, groupIds, studentIds]);
  const categories = [...new Set(topics.map((t) => t.category))].sort();
  const visibleTopics = topics.filter(
    (t) => (!category || t.category === category) && (!q || `${t.titleEn} ${t.titleEs}`.toLowerCase().includes(q.toLowerCase())) && (!grade || resourcesOf(t, classId).some((r) => r.grades.includes(grade))),
  );
  const topic = topics.find((t) => t.id === topicId);
  const activities = resourcesOf(topic, classId).filter((r) => !grade || r.grades.includes(grade));
  const toggle = (set: Set<string>, id: string, fn: (s: Set<string>) => void) => { const n = new Set(set); if (n.has(id)) n.delete(id); else n.add(id); fn(n); };

  const chooseTopic = (id: string) => {
    setTopicId(id);
    const t = topics.find((x) => x.id === id)!;
    setSelected(new Set(resourcesOf(t, classId).filter((r) => !grade || r.grades.includes(grade)).map((r) => r.id)));
    setTitle(t.titleEs);
    setStep(3);
  };

  const confirm = () =>
    start(async () => {
      setError(undefined);
      const res = await createTopicTask({ classroomId: classId, groupIds: rec.groupIds, studentIds: rec.studentIds, topicId, stepKeys: activities.filter((a) => selected.has(a.id)).map((a) => a.id), title: title.trim(), dueAt: dueAt || undefined });
      if (res.error) setError(res.error);
      else router.push(`/teacher/tasks/${res.assignmentId}?new=1`);
    });

  const Steps = (
    <ol className="mb-6 flex flex-wrap gap-2 text-sm font-bold">
      {["Who", "Topic", "Preview Task", "Confirm"].map((s, i) => (
        <li key={s} className={`rounded-full px-4 py-2 ${step === i + 1 ? "bg-ink text-white" : step > i + 1 ? "bg-leaf-soft text-leaf" : "bg-paper-2 text-muted"}`}>{i + 1}. {s}</li>
      ))}
    </ol>
  );

  return (
    <div>
      {Steps}
      {step === 1 && (
        <Panel className="space-y-5">
          <div className="max-w-sm">
            <Label htmlFor="cls">Class</Label>
            <Select id="cls" value={classId} onChange={(e) => { const cid = e.target.value; setClassId(cid); setGroupIds(new Set()); setStudentIds(new Set()); if (topic) setSelected(new Set(resourcesOf(topic, cid).filter((r) => !grade || r.grades.includes(grade)).map((r) => r.id))); }}>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </div>
          <fieldset>
            <legend className="mb-2 text-sm font-bold text-ink-2">Groups</legend>
            <div className="flex flex-wrap gap-2">
              {cls.groups.map((g) => (
                <label key={g.id} className={chip}><input type="checkbox" checked={groupIds.has(g.id)} onChange={() => toggle(groupIds, g.id, setGroupIds)} /> {g.name} <span className="text-xs text-muted">({g.memberIds.length})</span></label>
              ))}
              {cls.groups.length === 0 && <p className="text-sm text-muted">This class has no groups yet.</p>}
            </div>
          </fieldset>
          <fieldset>
            <legend className="mb-2 text-sm font-bold text-ink-2">Individual students</legend>
            <div className="flex flex-wrap gap-2">
              {cls.students.map((s) => (
                <label key={s.id} className={chip}><input type="checkbox" checked={studentIds.has(s.id)} onChange={() => toggle(studentIds, s.id, setStudentIds)} /> {s.name}</label>
              ))}
              {cls.students.length === 0 && <p className="text-sm text-muted">No students yet.</p>}
            </div>
          </fieldset>
          <p className="text-sm font-bold text-ink-2" aria-live="polite">
            {rec.studentCount} student{rec.studentCount === 1 ? "" : "s"} will get this task.
            {rec.dropped.length > 0 && <span className="font-semibold text-muted"> {rec.dropped.length} selected student{rec.dropped.length === 1 ? " is" : "s are"} already in a chosen group and will get it once.</span>}
          </p>
          <Button type="button" disabled={rec.studentCount === 0} onClick={() => setStep(topicId ? 3 : 2)}>Next: choose a topic</Button>
        </Panel>
      )}

      {step === 2 && (
        <Panel className="space-y-5">
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <Label>Grade</Label>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => setGrade("")} className={`rounded-full px-4 py-2 font-bold ${!grade ? "bg-ink text-white" : "bg-paper-2"}`}>All grades</button>
                {GRADES.map((g) => <button key={g} type="button" onClick={() => setGrade(g)} className={`rounded-full px-4 py-2 font-bold ${grade === g ? "bg-ink text-white" : "bg-paper-2"}`}>{GRADE_LABEL[g].label}</button>)}
              </div>
            </div>
            <div className="w-48">
              <Label htmlFor="cat">Category</Label>
              <Select id="cat" value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="">All categories</option>
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </Select>
            </div>
            <div className="w-56">
              <Label htmlFor="tq">Search</Label>
              <Input id="tq" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Animals, colores…" />
            </div>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visibleTopics.map((t) => (
              <li key={t.id}>
                <button type="button" data-testid="topic-option" onClick={() => chooseTopic(t.id)} className="flex w-full items-center gap-4 rounded-[22px] p-4 text-left shadow-pop hover:-translate-y-0.5" style={{ background: t.color }}>
                  <Art k={t.art} className="h-16 w-16 shrink-0" />
                  <span>
                    <span className="block font-display text-2xl font-extrabold leading-none">{t.titleEs}</span>
                    <span className="text-sm font-bold text-ink/75">{t.titleEn} · {t.category}</span>
                  </span>
                </button>
              </li>
            ))}
            {visibleTopics.length === 0 && <li className="text-muted">No topics match.</li>}
          </ul>
          <Button type="button" variant="ghost" onClick={() => setStep(1)}>‹ Back</Button>
        </Panel>
      )}

      {step === 3 && topic && (
        <Panel className="space-y-5">
          <div className="flex flex-wrap items-center gap-4 rounded-[22px] p-4" style={{ background: topic.color }}>
            <Art k={topic.art} className="h-16 w-16" />
            <div className="flex-1">
              <h2 className="font-display text-3xl font-extrabold leading-none">Preview Task · {topic.titleEs}</h2>
              <p className="font-bold text-ink/75">{topic.titleEn}{grade && ` · ${GRADE_LABEL[grade].label}`}</p>
            </div>
            <Button type="button" variant="secondary" size="sm" onClick={() => setStep(2)}>Change topic</Button>
          </div>
          <div className="max-w-md">
            <Label htmlFor="lesson-title" hint="students see and hear it">Lesson title</Label>
            <Input id="lesson-title" value={title} maxLength={120} onChange={(e) => setTitle(e.target.value)} placeholder={topic.titleEs} />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="flex-1 text-sm text-ink-2">Students follow these steps in this order. Open each one to try it; uncheck the ones you don’t want to assign.</p>
            <Button type="button" variant="secondary" size="sm" onClick={() => setSelected(new Set(activities.map((a) => a.id)))} data-testid="select-whole-topic">Whole topic</Button>
            <a href={`/teacher/library/topics/${topic.slug}/lesson`} target="_blank" rel="noopener" className="rounded-full px-4 py-2 text-sm font-bold text-sky ring-1 ring-line hover:bg-sky-soft">Change order ↗</a>
          </div>
          <ul className="divide-y divide-line rounded-[22px] border border-line">
            {activities.map((a, i) => (
              <li key={a.id} className="flex flex-wrap items-center gap-3 px-4 py-3" data-testid="wizard-step">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-ink text-xs font-extrabold text-white">{i + 1}</span>
                <label className="flex flex-1 cursor-pointer items-center gap-3">
                  <input type="checkbox" className="h-5 w-5" checked={selected.has(a.id)} onChange={() => toggle(selected, a.id, setSelected)} aria-label={`Assign ${a.title}`} />
                  <KindBadge kind={a.kind as Kind | "SPEAKING"} />
                  <span className="font-bold">{a.title}</span>
                </label>
                <a href={a.href} target="_blank" rel="noopener" className="rounded-full px-4 py-2 text-sm font-bold text-sky ring-1 ring-line hover:bg-sky-soft">
                  {a.kind === "SPEAKING" ? "Try" : KIND_LABEL[a.kind as Kind].verb} ↗
                </a>
              </li>
            ))}
            {activities.length === 0 && <li className="px-4 py-3 text-muted">No activities for this grade.</li>}
          </ul>
          <div className="max-w-xs">
            <Label htmlFor="due" hint="optional">Due date</Label>
            <Input id="due" type="date" value={dueAt} onChange={(e) => setDueAt(e.target.value)} />
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={() => setStep(1)}>‹ Who</Button>
            <Button type="button" disabled={selected.size === 0 || rec.studentCount === 0} onClick={() => setStep(4)}>Next: confirm</Button>
          </div>
        </Panel>
      )}

      {step === 4 && topic && (
        <Panel className="space-y-4">
          <h2 className="font-display text-2xl font-extrabold">Confirm</h2>
          <p><strong>Class:</strong> {cls.name}</p>
          <p><strong>To:</strong> {[...cls.groups.filter((g) => groupIds.has(g.id)).map((g) => `group ${g.name}`), ...cls.students.filter((s) => rec.studentIds.includes(s.id)).map((s) => s.name)].join(", ")} — {rec.studentCount} student{rec.studentCount === 1 ? "" : "s"}</p>
          <p><strong>Topic:</strong> {topic.titleEs} · {topic.titleEn}</p>
          <p><strong>Lesson title:</strong> {title.trim() || `${topic.titleEs} · ${topic.titleEn}`}</p>
          <p><strong>Activities ({selected.size}):</strong> {activities.filter((a) => selected.has(a.id)).map((a) => a.title).join(", ")}</p>
          {dueAt && <p><strong>Due:</strong> {dueAt}</p>}
          <FormError message={error} />
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={() => setStep(3)}>‹ Back</Button>
            <Button type="button" onClick={confirm} disabled={pending}>{pending ? "Assigning…" : "Assign Task"}</Button>
          </div>
        </Panel>
      )}
    </div>
  );
}
