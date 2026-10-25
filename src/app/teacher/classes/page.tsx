import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { EmptyState, PageHeader, Panel } from "@/components/ui/Panel";
import { createClassroom } from "@/lib/actions/classroom";
import { requireTeacherPage } from "@/lib/auth/guards";
import { db } from "@/lib/db";

export const metadata = { title: "Classes & Students" };

export default async function ClassesPage() {
  const { teacher } = await requireTeacherPage();
  const classes = await db.classroom.findMany({
    where: { teacherId: teacher.id },
    include: { _count: { select: { students: true, levels: true } } },
    orderBy: { createdAt: "asc" },
  });

  return (
    <>
      <PageHeader eyebrow="Classroom" title="Classes & Students" subtitle="Each class has its own sign-in code. Inside a class you can create levels (LE1, LE2, UE1…) and groups (Group A, B, C…)." />
      <Panel className="mb-6">
        <form action={createClassroom} className="flex flex-wrap items-end gap-3">
          <div className="min-w-60 flex-1">
            <label htmlFor="name" className="mb-1.5 block text-sm font-bold text-ink-2">New class</label>
            <Input id="name" name="name" placeholder="Spanish — Lower Elementary" required maxLength={60} />
          </div>
          <Button type="submit">Create class</Button>
        </form>
      </Panel>
      {classes.length === 0 ? (
        <EmptyState title="No classes yet" body="Create your first class to get a sign-in code for your students." />
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-xl2 border border-line bg-card">
          {classes.map((c) => (
            <li key={c.id}>
              <Link href={`/teacher/classes/${c.id}`} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 hover:bg-paper">
                <span>
                  <span className="block font-display text-lg font-semibold">{c.name}</span>
                  <span className="text-sm text-muted">
                    {c._count.students} students · {c._count.levels} levels
                  </span>
                </span>
                <span className="rounded-lg bg-teal-soft px-3 py-1 font-mono text-sm font-bold tracking-widest text-teal-dark">{c.code}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
