import { notFound } from "next/navigation";
import { AddStudentForm, ResetPinButton } from "@/components/teacher/StudentForms";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { Badge, EmptyState, PageHeader, Panel } from "@/components/ui/Panel";
import { createGroup, createLevel, deleteGroup, setStudentGroups, updateStudent } from "@/lib/actions/classroom";
import { requireTeacherPage } from "@/lib/auth/guards";
import { db } from "@/lib/db";

export default async function ClassPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { teacher } = await requireTeacherPage();
  const c = await db.classroom.findFirst({
    where: { id, teacherId: teacher.id },
    include: {
      levels: { orderBy: { sortOrder: "asc" }, include: { groups: { orderBy: { name: "asc" }, include: { _count: { select: { memberships: true } } } } } },
      students: { orderBy: { firstName: "asc" }, include: { memberships: { include: { group: { include: { level: true } } } } } },
    },
  });
  if (!c) notFound();
  const allGroups = c.levels.flatMap((l) => l.groups.map((g) => ({ id: g.id, label: `${l.name} · ${g.name}` })));

  return (
    <>
      <PageHeader
        eyebrow="Class"
        title={c.name}
        subtitle={
          <>
            Students sign in at <strong>/student</strong> with code{" "}
            <span className="rounded-md bg-teal-soft px-2 py-0.5 font-mono font-bold tracking-widest text-teal-dark">{c.code}</span>, then pick their name and type their PIN.
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_1.6fr]">
        <Panel>
          <h2 className="font-display text-xl font-semibold">Levels &amp; groups</h2>
          <p className="mt-1 text-sm text-muted">Any names work. A student can be in more than one group.</p>
          <div className="mt-4 space-y-4">
            {c.levels.map((l) => (
              <div key={l.id} className="rounded-xl border border-line p-3.5">
                <p className="font-display text-lg font-semibold">{l.name}</p>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {l.groups.map((g) => (
                    <li key={g.id} className="flex items-center gap-1 rounded-full bg-paper-2 py-1 pl-3 pr-1 text-sm font-bold">
                      {g.name}
                      <span className="text-xs font-semibold text-muted">({g._count.memberships})</span>
                      <form action={deleteGroup}>
                        <input type="hidden" name="groupId" value={g.id} />
                        <button className="ml-1 grid h-6 w-6 place-items-center rounded-full text-muted hover:bg-coral-soft hover:text-coral-dark" aria-label={`Delete ${g.name}`} title="Delete group (students stay in the class)">
                          ×
                        </button>
                      </form>
                    </li>
                  ))}
                </ul>
                <form action={createGroup} className="mt-3 flex gap-2">
                  <input type="hidden" name="levelId" value={l.id} />
                  <Input name="name" placeholder="Group A" required maxLength={60} className="py-1.5" aria-label={`New group in ${l.name}`} />
                  <Button size="sm" variant="secondary">Add group</Button>
                </form>
              </div>
            ))}
            <form action={createLevel} className="flex gap-2">
              <input type="hidden" name="classroomId" value={c.id} />
              <Input name="name" placeholder="LE2" required maxLength={60} aria-label="New level" />
              <Button size="md" variant="secondary">Add level</Button>
            </form>
          </div>
        </Panel>

        <Panel>
          <h2 className="font-display text-xl font-semibold">Students</h2>
          <p className="mt-1 text-sm text-muted">Only a first name and last initial are needed. Full name is optional and only used by “Spell Your Name”.</p>
          <div className="mt-4">
            <AddStudentForm classroomId={c.id} groups={allGroups} />
          </div>
          {c.students.length === 0 ? (
            <div className="mt-5">
              <EmptyState title="No students yet" />
            </div>
          ) : (
            <ul className="mt-5 divide-y divide-line">
              {c.students.map((s) => (
                <li key={s.id} className="py-3">
                  <details>
                    <summary className="flex cursor-pointer list-none items-center gap-3">
                      <Avatar name={s.firstName} kind={s.avatar} size={36} />
                      <span className="flex-1">
                        <span className="font-bold">
                          {s.firstName} {s.lastInitial && `${s.lastInitial}.`}
                        </span>
                        {!s.active && <Badge tone="coral">inactive</Badge>}
                        <span className="ml-2 inline-flex flex-wrap gap-1 align-middle">
                          {s.memberships.map((m) => (
                            <Badge key={m.groupId} tone="teal">
                              {m.group.level.name} · {m.group.name}
                            </Badge>
                          ))}
                        </span>
                      </span>
                      <span className="text-sm font-bold text-muted">Edit</span>
                    </summary>
                    <div className="mt-3 grid gap-4 rounded-xl bg-paper p-4 sm:grid-cols-2">
                      <form action={updateStudent} className="space-y-2">
                        <input type="hidden" name="studentId" value={s.id} />
                        <Input name="firstName" defaultValue={s.firstName} required aria-label="First name" />
                        <Input name="lastInitial" defaultValue={s.lastInitial} maxLength={1} aria-label="Last initial" placeholder="Last initial" />
                        <Input name="spellingName" defaultValue={s.spellingName} aria-label="Full name for spelling" placeholder="Full name for spelling (optional)" />
                        <label className="flex items-center gap-2 text-sm font-semibold">
                          <input type="checkbox" name="active" defaultChecked={s.active} /> Can sign in
                        </label>
                        <Button size="sm" variant="secondary">Save</Button>
                      </form>
                      <div className="space-y-4">
                        <form action={setStudentGroups}>
                          <input type="hidden" name="studentId" value={s.id} />
                          <p className="mb-1.5 text-sm font-bold text-ink-2">Groups</p>
                          {allGroups.length === 0 && <p className="text-sm text-muted">Create a level and a group first.</p>}
                          <div className="flex flex-col gap-1">
                            {allGroups.map((g) => (
                              <label key={g.id} className="flex items-center gap-2 text-sm">
                                <input type="checkbox" name="groupId" value={g.id} defaultChecked={s.memberships.some((m) => m.groupId === g.id)} /> {g.label}
                              </label>
                            ))}
                          </div>
                          {allGroups.length > 0 && <Button size="sm" variant="secondary" className="mt-2">Update groups</Button>}
                        </form>
                        <ResetPinButton studentId={s.id} />
                      </div>
                    </div>
                  </details>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}
