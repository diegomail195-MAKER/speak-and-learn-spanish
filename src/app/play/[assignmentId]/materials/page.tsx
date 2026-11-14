import Link from "next/link";
import { notFound } from "next/navigation";
import { KindBadge } from "@/components/library/LibraryBits";
import { ResourcePlayer } from "@/components/library/Players";
import { assignmentsForStudentWhere } from "@/lib/access";
import { requireStudentPage } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { safeContent, type AnyContent, type Kind } from "@/lib/library/types";

export const metadata = { title: "Materials" };

/** Library resources an administrator added to the assigned activity (published versions only). */
export default async function ActivityMaterials({ params }: { params: Promise<{ assignmentId: string }> }) {
  const { assignmentId } = await params;
  const { student } = await requireStudentPage();
  const a = await db.assignment.findFirst({ where: { id: assignmentId, ...assignmentsForStudentWhere(student) }, select: { id: true, title: true, gameId: true } });
  if (!a?.gameId) notFound();
  const rows = await db.gameResource.findMany({
    where: { gameId: a.gameId, resource: { status: { in: ["PUBLISHED", "ARCHIVED"] }, currentVersionId: { not: null } } },
    orderBy: { position: "asc" },
    include: { resource: { select: { kind: true, currentVersion: { select: { title: true, content: true } } } } },
  });
  return (
    <main className="mx-auto max-w-4xl px-5 py-8">
      <Link href={`/play/${a.id}`} className="font-bold text-coral">← Back to the activity</Link>
      <h1 className="mb-6 mt-3 font-display text-4xl font-extrabold">Materials · {a.title}</h1>
      {rows.length === 0 && <p className="text-muted">No materials for this activity.</p>}
      <div className="space-y-10">
        {rows.map(({ resourceId, resource: r }) => {
          const kind = r.kind as Kind;
          const v = r.currentVersion!;
          return (
            <section key={resourceId} data-testid="material">
              <KindBadge kind={kind} />
              <h2 className="mb-4 mt-2 font-display text-2xl font-extrabold">{v.title}</h2>
              <ResourcePlayer kind={kind} content={safeContent(kind, v.content) as AnyContent} title={v.title} />
            </section>
          );
        })}
      </div>
    </main>
  );
}
