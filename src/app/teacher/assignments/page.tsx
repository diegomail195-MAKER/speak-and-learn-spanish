import Link from "next/link";
import { assignmentsForTeacherWhere } from "@/lib/access";
import { openAssignmentWhere } from "@/lib/dashboard/teacher";
import { DeleteAssignmentButton } from "@/components/teacher/DeleteAssignmentButton";
import { ButtonLink } from "@/components/ui/Button";
import { Badge, EmptyState, PageHeader } from "@/components/ui/Panel";
import { requireTeacherPage } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { templateByKey } from "@/lib/games/templates";
import { ACTIVE_KINDS, KIND_LABEL, displayKind } from "@/lib/library/types";
import { mediaUrl } from "@/lib/media/save";

export const metadata = { title: "My Assignments" };

type Kind = keyof typeof KIND_LABEL;
const KINDS: readonly Kind[] = ACTIVE_KINDS;
const ICON: Record<Kind, string> = { VIDEO: "🎬", SONG: "🎵", GAME: "🎮", FLASHCARDS: "🃏", PRINTABLE: "📝", WORKSHEET: "📝", LISTENING: "🎧" };

function recipientLabel(r: { type: string; classroom: { name: string } | null; level: { name: string } | null; group: { name: string; level: { name: string } } | null; student: { firstName: string; lastInitial: string } | null }) {
  if (r.type === "CLASSROOM") return r.classroom?.name ?? "Class";
  if (r.type === "LEVEL") return `Level ${r.level?.name}`;
  if (r.type === "GROUP") return `${r.group?.level.name} ${r.group?.name}`;
  return `${r.student?.firstName} ${r.student?.lastInitial}`.trim();
}

export default async function AssignmentsPage({ searchParams }: { searchParams: Promise<{ kind?: string; open?: string }> }) {
  const sp = await searchParams;
  const { teacher } = await requireTeacherPage();
  const list = await db.assignment.findMany({
    where: sp.open === "1" ? { AND: [assignmentsForTeacherWhere(teacher.id), openAssignmentWhere()] } : assignmentsForTeacherWhere(teacher.id),
    include: {
      game: { select: { title: true, templateKey: true, _count: { select: { items: true } }, items: { where: { imageAssetId: { not: null } }, orderBy: { position: "asc" }, take: 1, select: { imageAssetId: true } } } },
      video: { select: { title: true, youtubeId: true } },
      collection: { select: { title: true } },
      topic: { select: { titleEn: true } },
      activities: { orderBy: { position: "asc" }, select: { resource: { select: { kind: true, title: true } }, game: { select: { title: true, templateKey: true } } } },
      recipients: { include: { classroom: true, level: true, group: { include: { level: true } }, student: true } },
      _count: { select: { attempts: { where: { completedAt: { not: null } } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  const rows = list.map((a) => {
    // The categories of what was assigned: a game is Flashcards or Games, a video or collection
    // is Videos, a Library task has the kinds of its activities.
    const kinds: Kind[] = a.game
      ? [a.game.templateKey === "FLASHCARDS" ? "FLASHCARDS" : "GAME"]
      : a.video || a.collectionId
        ? ["VIDEO"]
        : [...new Set(a.activities.map((x) => (x.game ? (x.game.templateKey === "FLASHCARDS" ? "FLASHCARDS" : "GAME") : x.resource?.kind && displayKind(x.resource.kind)) as Kind))].filter((k) => k in KIND_LABEL);
    const thumb = a.game?.items[0]?.imageAssetId ? mediaUrl(a.game.items[0].imageAssetId) : a.video?.youtubeId ? `https://i.ytimg.com/vi/${a.video.youtubeId}/mqdefault.jpg` : null;
    const detail = a.game
      ? `${templateByKey(a.game.templateKey)?.name ?? "Game"} · ${a.game._count.items} ${a.game.templateKey === "FLASHCARDS" ? "cards" : "items"}`
      : a.topicId
        ? a.activities.map((x) => x.resource?.title ?? x.game?.title ?? "Activity").slice(0, 3).join(" · ") + (a.activities.length > 3 ? ` +${a.activities.length - 3}` : "")
        : "";
    return {
      id: a.id,
      href: a.topicId ? `/teacher/tasks/${a.id}` : `/teacher/assignments/${a.id}`,
      title: a.game?.title || a.video?.title || a.collection?.title || a.title || a.topic?.titleEn || "Activity",
      kinds,
      thumb,
      detail,
      who: a.recipients.map(recipientLabel).join(", "),
      due: a.dueAt ? `due ${a.dueAt.toLocaleDateString("en-US", { month: "short", day: "numeric" })}` : "no due date",
      completed: a.gameId ? a._count.attempts : null,
      active: a.active,
      mine: a.teacherId === teacher.id,
    };
  });

  const filter = KINDS.includes(sp.kind as Kind) ? (sp.kind as Kind) : null;
  const count = (k: Kind) => rows.filter((r) => r.kinds.includes(k)).length;
  const shown = filter ? rows.filter((r) => r.kinds.includes(filter)) : rows;
  const chip = (on: boolean) => `inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-bold ring-1 ${on ? "bg-ink text-white ring-ink" : "bg-card text-ink-2 ring-line hover:ring-ink-2/40"}`;

  return (
    <>
      <PageHeader
        eyebrow="Assignments"
        title={sp.open === "1" ? "Active assignments" : "My Assignments"}
        subtitle={sp.open === "1" ? <Link href="/teacher/assignments" className="ws-link">Show all assignments</Link> : undefined}
        actions={<ButtonLink href="/teacher/tasks/assign" variant="voice">Assign a task</ButtonLink>}
      />
      {rows.length === 0 ? (
        <EmptyState title="Nothing assigned yet" body="Assign a Library topic or one of your activities to a class, level, group or student." />
      ) : (
        <>
          <nav aria-label="Categories" className="mb-5 flex flex-wrap gap-2" data-testid="assignment-filters">
            <Link href="/teacher/assignments" className={chip(!filter)} aria-current={!filter ? "page" : undefined}>
              All <span className="opacity-70">{rows.length}</span>
            </Link>
            {KINDS.map((k) => (
              <Link key={k} href={`/teacher/assignments?kind=${k}`} className={chip(filter === k)} aria-current={filter === k ? "page" : undefined}>
                <span aria-hidden>{ICON[k]}</span> {KIND_LABEL[k].plural} <span className="opacity-70">{count(k)}</span>
              </Link>
            ))}
          </nav>
          {shown.length === 0 ? (
            <EmptyState title={`No ${filter ? KIND_LABEL[filter].plural.toLowerCase() : "assignments"} assigned yet`} body="Choose another category to see your other assignments." />
          ) : (
            <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3" data-testid="assignment-list">
              {shown.map((r) => {
                const main = r.kinds[0] ?? "GAME";
                return (
                  <li key={r.id} data-testid="assignment-card" className="relative">
                    {/* Compact card: a 16:9 thumbnail beside the details, so covers never stretch the card. */}
                    <Link href={r.href} className="group flex h-full gap-3 rounded-xl2 border border-line bg-card p-3 transition hover:-translate-y-0.5 hover:shadow-soft focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-coral">
                      <span className="relative grid aspect-video w-28 shrink-0 place-items-center self-start overflow-hidden rounded-lg sm:w-32" style={{ background: `${KIND_LABEL[main].color}22` }}>
                        {r.thumb ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={r.thumb} alt="" className="h-full w-full object-contain p-1.5" loading="lazy" />
                        ) : (
                          <span className="text-3xl" aria-hidden>{ICON[main]}</span>
                        )}
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col gap-1">
                        <span className="flex items-start gap-2">
                          <span className="line-clamp-2 flex-1 font-display text-base font-semibold leading-snug group-hover:text-coral">{r.title}</span>
                          <Badge tone={r.active ? "leaf" : "neutral"}>{r.active ? "open" : "closed"}</Badge>
                        </span>
                        <span className="flex flex-wrap gap-1">
                          {r.kinds.slice(0, r.kinds.length > 3 ? 2 : 3).map((k) => (
                            <span key={k} className="whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-extrabold text-ink" style={{ background: KIND_LABEL[k].color }} data-testid="assignment-kind">
                              {ICON[k]} {KIND_LABEL[k].label}
                            </span>
                          ))}
                          {r.kinds.length > 3 && (
                            <span className="whitespace-nowrap rounded-full bg-paper-2 px-2 py-0.5 text-[11px] font-extrabold text-ink-2" title={r.kinds.slice(2).map((k) => KIND_LABEL[k].label).join(", ")}>
                              +{r.kinds.length - 2}
                            </span>
                          )}
                        </span>
                        {r.detail && <span className="line-clamp-1 text-xs text-ink-2">{r.detail}</span>}
                        <span className="mt-auto truncate pr-10 text-xs text-muted">👥 {r.who || "—"} · {r.due}</span>
                        {r.completed !== null && <span className="pr-10 text-xs font-bold text-teal-dark">{r.completed} completed · See results →</span>}
                      </span>
                    </Link>
                    {r.mine && (
                      <span className="absolute bottom-2 right-2">
                        <DeleteAssignmentButton id={r.id} title={r.title} />
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </>
  );
}
