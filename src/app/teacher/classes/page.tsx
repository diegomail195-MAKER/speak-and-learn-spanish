import Link from "next/link";
import { Card, Empty, PageTitle } from "@/components/dashboard/DashBits";
import { WsIcon } from "@/components/shell/WsIcons";
import { createClassroom, setClassArchived } from "@/lib/actions/classroom";
import { requireTeacherPage } from "@/lib/auth/guards";
import { teacherClasses } from "@/lib/dashboard/teacher";

export const metadata = { title: "My Classes" };

// My Classes: classes the teacher owns and the ones shared with them as co-teacher. Each class has
// its own sign-in code; archived classes are kept (students and results) and can be restored.
export default async function ClassesPage() {
  const { teacher } = await requireTeacherPage();
  const [classes, archived] = await Promise.all([teacherClasses(teacher.id), teacherClasses(teacher.id, { archived: true })]);

  return (
    <>
      <PageTitle title="My Classes" subtitle="Open a class to add students, make groups, share it with a co-teacher and assign topics." />
      <Card className="mb-6">
        <form action={createClassroom} className="flex flex-wrap items-end gap-3">
          <label className="min-w-0 flex-1 basis-64">
            <span className="mb-1.5 block font-bold text-[#3D4759]">New class</span>
            <input id="name" name="name" placeholder="LE1 — Spanish" required maxLength={60} className="ws-input" />
          </label>
          <button type="submit" className="ws-btn ws-btn-primary">Create class</button>
        </form>
      </Card>
      {classes.length === 0 ? (
        <Empty title="No classes yet" body="Create your first class to get a sign-in code for your students." />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3" data-testid="class-list">
          {classes.map((c) => (
            <li key={c.id} className="flex items-center gap-3 rounded-xl border border-[#E2E6EC] bg-white p-4" data-testid="class-card">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-[#F1F4F8] text-[#3D4759]"><WsIcon name="board" /></span>
              <div className="min-w-0 flex-1">
                <Link href={`/teacher/classes/${c.id}`} className="block truncate font-display text-lg font-extrabold hover:underline" title={c.name}>{c.name}</Link>
                <p className="text-[15px] text-[#3D4759]">
                  {c._count.students} student{c._count.students === 1 ? "" : "s"} · <span className="font-mono font-bold tracking-widest">{c.code}</span>
                </p>
                {c.teacher.id !== teacher.id ? (
                  <p className="text-sm text-[#5B6577]">Co-teaching with {c.teacher.user.displayName}</p>
                ) : c.coTeachers.length > 0 ? (
                  <p className="text-sm text-[#5B6577]">{c.coTeachers.length} co-teacher{c.coTeachers.length === 1 ? "" : "s"}</p>
                ) : null}
              </div>
              <Link href={`/teacher/classes/${c.id}`} className="ws-link inline-flex min-h-11 shrink-0 items-center border-l border-[#E2E6EC] pl-3" aria-label={`Manage class ${c.name}`}>Manage class</Link>
            </li>
          ))}
        </ul>
      )}
      {archived.length > 0 && (
        <details className="mt-8" data-testid="archived-classes">
          <summary className="inline-flex min-h-11 cursor-pointer items-center font-bold text-[#3D4759]">Archived classes ({archived.length})</summary>
          <ul className="mt-3 divide-y divide-[#E2E6EC] rounded-xl border border-[#E2E6EC] bg-white">
            {archived.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <Link href={`/teacher/classes/${c.id}`} className="min-w-0 flex-1 truncate font-bold hover:underline">{c.name}</Link>
                <span className="text-sm text-[#5B6577]">{c._count.students} students</span>
                {c.teacher.id === teacher.id && (
                  <form action={setClassArchived}>
                    <input type="hidden" name="classroomId" value={c.id} />
                    <input type="hidden" name="archive" value="0" />
                    <button className="ws-btn ws-btn-secondary">Restore</button>
                  </form>
                )}
              </li>
            ))}
          </ul>
        </details>
      )}
    </>
  );
}
