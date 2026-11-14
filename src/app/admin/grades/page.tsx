import { GradeForm } from "@/components/admin/GradeForm";
import { EmptyState, PageHeader, Panel } from "@/components/ui/Panel";
import { db } from "@/lib/db";

export const metadata = { title: "Grades" };

export default async function AdminGrades() {
  const grades = await db.grade.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }], include: { _count: { select: { topics: true } } } });
  return (
    <>
      <PageHeader title="Grades" subtitle="Grades you add here appear in the Grade selector of every topic." />
      <Panel className="mb-6"><GradeForm /></Panel>
      {grades.length === 0 ? (
        <EmptyState title="No grades yet" body="Add your first grade, for example Kindergarten or 1st Grade." />
      ) : (
        <Panel className="p-0 sm:p-0">
          <ul className="divide-y divide-line" data-testid="grade-list">
            {grades.map((g) => (
              <li key={g.id} className="flex items-center justify-between px-5 py-3">
                <span className="font-bold">{g.name}</span>
                <span className="text-sm text-muted">{g._count.topics} topic{g._count.topics === 1 ? "" : "s"}</span>
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </>
  );
}
