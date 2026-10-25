import Link from "next/link";
import { ButtonLink } from "@/components/ui/Button";
import { Badge, EmptyState, PageHeader } from "@/components/ui/Panel";
import { requireTeacherPage } from "@/lib/auth/guards";
import { db } from "@/lib/db";

export const metadata = { title: "Assignments & Results" };

function recipientLabel(r: { type: string; classroom: { name: string } | null; level: { name: string } | null; group: { name: string; level: { name: string } } | null; student: { firstName: string; lastInitial: string } | null }) {
  if (r.type === "CLASSROOM") return r.classroom?.name ?? "Class";
  if (r.type === "LEVEL") return `Level ${r.level?.name}`;
  if (r.type === "GROUP") return `${r.group?.level.name} ${r.group?.name}`;
  return `${r.student?.firstName} ${r.student?.lastInitial}`.trim();
}

export default async function AssignmentsPage() {
  const { teacher } = await requireTeacherPage();
  const list = await db.assignment.findMany({
    where: { teacherId: teacher.id },
    include: {
      game: { select: { title: true } },
      video: { select: { title: true } },
      collection: { select: { title: true } },
      recipients: { include: { classroom: true, level: true, group: { include: { level: true } }, student: true } },
      _count: { select: { attempts: { where: { completedAt: { not: null } } } } },
    },
    orderBy: { createdAt: "desc" },
  });
  return (
    <>
      <PageHeader eyebrow="Assignments" title="Assignments & Results" actions={<ButtonLink href="/teacher/assignments/new" variant="voice">New assignment</ButtonLink>} />
      {list.length === 0 ? (
        <EmptyState title="Nothing assigned yet" body="Publish a game or video, then assign it to a class, level, group or student." />
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-xl2 border border-line bg-card">
          {list.map((a) => (
            <li key={a.id}>
              <Link href={`/teacher/assignments/${a.id}`} className="flex flex-wrap items-center gap-3 px-5 py-4 hover:bg-paper">
                <span className="min-w-60 flex-1">
                  <span className="block font-display text-lg font-semibold">
                    {a.game?.title ?? a.video?.title ?? a.collection?.title ?? "Activity"}
                    <span className="ml-2 align-middle text-xs font-bold uppercase tracking-wider text-muted">{a.game ? "game" : a.video ? "video" : "collection"}</span>
                  </span>
                  <span className="text-sm text-muted">
                    {a.recipients.map(recipientLabel).join(", ")} · {a.dueAt ? `due ${a.dueAt.toLocaleDateString("en-US")}` : "no due date"}
                  </span>
                </span>
                {a.gameId && <span className="text-sm text-ink-2">{a._count.attempts} completed</span>}
                <Badge tone={a.active ? "leaf" : "neutral"}>{a.active ? "open" : "closed"}</Badge>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
