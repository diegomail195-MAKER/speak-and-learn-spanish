import Link from "next/link";
import { notFound } from "next/navigation";
import { KindDot } from "@/components/library/LibraryBits";
import { Art, Pinita } from "@/components/ui/Art";
import { assignmentsForStudentWhere } from "@/lib/access";
import { requireStudentPage } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { KIND_LABEL, type Kind } from "@/lib/library/types";

export const metadata = { title: "My Task" };

export default async function StudentTask({ params }: { params: Promise<{ assignmentId: string }> }) {
  const { student } = await requireStudentPage();
  const { assignmentId } = await params;
  const t = await db.assignment.findFirst({
    where: { id: assignmentId, topicId: { not: null }, ...assignmentsForStudentWhere(student) },
    include: { topic: true, activities: { orderBy: { position: "asc" }, include: { resource: { select: { kind: true } }, version: { select: { title: true } }, progress: { where: { studentId: student.id, completedAt: { not: null } }, select: { id: true }, take: 1 } } } },
  });
  if (!t) notFound();
  return (
    <>
      <Link href="/learn" className="font-bold text-sky hover:underline">‹ My Activities</Link>
      <div className="mb-6 mt-3 flex flex-wrap items-center gap-5 rounded-[28px] p-6 shadow-pop" style={{ background: t.topic?.color }}>
        <Art k={t.topic?.art} className="h-24 w-24" />
        <div className="flex-1">
          <h1 className="font-display text-4xl font-extrabold leading-none">{t.topic?.titleEs}</h1>
          <p className="mt-1 text-lg font-bold text-ink/75">{t.topic?.titleEn}</p>
        </div>
        <Pinita className="h-20 w-20" />
      </div>
      {t.instructions && <p className="mb-5 rounded-[22px] bg-card p-4 font-bold">{t.instructions}</p>}
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {t.activities.map((a) => (
          <li key={a.id}>
            <Link href={`/learn/tasks/${t.id}/${a.id}`} data-testid="student-activity" className="flex items-center gap-4 rounded-[22px] bg-card p-4 shadow-pop transition hover:-translate-y-0.5">
              <KindDot kind={a.resource.kind as Kind} size="h-12 w-12" />
              <span className="flex-1">
                <span className="block font-display text-xl font-extrabold">{a.version.title}</span>
                <span className="text-sm font-bold text-muted">{KIND_LABEL[a.resource.kind as Kind].label}</span>
              </span>
              {a.progress.length ? <span className="font-display text-2xl text-leaf" aria-label="Done">✓</span> : <span className="rounded-full bg-ink px-4 py-2 font-bold text-white">{KIND_LABEL[a.resource.kind as Kind].verb}</span>}
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
