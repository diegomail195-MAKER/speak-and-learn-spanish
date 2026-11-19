import Link from "next/link";
import { RosterRow } from "@/components/teacher/RosterRow";
import { Icon } from "@/components/ui/Art";
import { ButtonLink } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { EmptyState, Panel } from "@/components/ui/Panel";
import { teacherClass } from "@/lib/class-page";
import { db } from "@/lib/db";

export const metadata = { title: "Roster" };

export default async function RosterPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ q?: string }> }) {
  const { id } = await params;
  const { q = "" } = await searchParams;
  const { classroom } = await teacherClass(id);
  const students = await db.student.findMany({
    where: { classroomId: classroom.id, ...(q.trim() ? { OR: [{ firstName: { contains: q.trim(), mode: "insensitive" } }, { username: { contains: q.trim(), mode: "insensitive" } }] } : {}) },
    select: { id: true, firstName: true, lastInitial: true, username: true, loginType: true, active: true, memberships: { select: { group: { select: { name: true } } } } },
    orderBy: [{ firstName: "asc" }, { lastInitial: "asc" }],
  });
  const total = await db.student.count({ where: { classroomId: classroom.id } });
  return (
    <>
      <Link href={`/teacher/classes/${classroom.id}`} className="text-sm font-bold text-sky hover:underline">‹ {classroom.name}</Link>
      <div className="mb-5 mt-2 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-bold">Roster</h1>
          <p className="font-bold text-muted">{total} Total Students</p>
        </div>
        <ButtonLink href={`/teacher/classes/${classroom.id}/students/new`}>Add new student</ButtonLink>
      </div>
      <div className="mb-4 flex flex-wrap items-center gap-x-5 gap-y-2">
        <form className="min-w-64">
          <Input name="q" defaultValue={q} placeholder="Search by name or username" aria-label="Search students" className="rounded-full" />
        </form>
        <Link href={`/teacher/classes/${classroom.id}/students/list`} className="inline-flex items-center gap-1.5 font-bold text-sky hover:underline"><Icon name="book" /> Add List</Link>
        <Link href={`/teacher/classes/${classroom.id}/print`} className="inline-flex items-center gap-1.5 font-bold text-sky hover:underline"><Icon name="printables" /> Print Access Instructions</Link>
      </div>
      <p className="mb-3 text-sm text-muted">Passwords and PINs are stored encrypted and are never shown. Use <strong>Reset</strong> to give a student a new one.</p>
      <Panel className="overflow-x-auto p-0 sm:p-0">
        {students.length === 0 ? (
          <div className="p-6"><EmptyState title={q ? "No student matches" : "No students yet"} /></div>
        ) : (
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-sky-soft">
              <tr>
                <th className="px-3 py-3">Name</th>
                <th className="px-3 py-3">Last initial</th>
                <th className="px-3 py-3">Username</th>
                <th className="px-3 py-3">Login Type</th>
                <th className="px-3 py-3">Groups</th>
                <th className="px-3 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {students.map((s) => (
                <RosterRow key={s.id} student={{ ...s, groups: s.memberships.map((m) => m.group.name) }} />
              ))}
            </tbody>
          </table>
        )}
      </Panel>
    </>
  );
}
