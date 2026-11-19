import Link from "next/link";
import { notFound } from "next/navigation";
import { DeleteButton } from "@/components/admin/ResourceForms";
import { TopicForm } from "@/components/admin/TopicForm";
import { GradeChips, KindBadge } from "@/components/library/LibraryBits";
import { Art } from "@/components/ui/Art";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Select } from "@/components/ui/Field";
import { Badge, Panel } from "@/components/ui/Panel";
import { LibraryPicker } from "@/components/admin/LibraryPicker";
import { TopicStatusBar } from "@/components/admin/TopicStatusBar";
import { LANGUAGE_LABEL } from "@/lib/library/topicMeta";
import { addResourcesToTopic, archiveResource, duplicateResource, moveInTopic, removeFromTopic, replaceInTopic, restoreResource } from "@/lib/actions/library";
import { db } from "@/lib/db";
import { pickableLibrary } from "@/lib/library/service";
import { KIND_LABEL, type Kind } from "@/lib/library/types";

export const metadata = { title: "Edit topic" };

// Manage Activities: add, remove, reorder and replace the activities of a topic.
// "Remove from Topic" only unlinks it; "Delete from Library" deletes the resource (refused if
// it's in assigned tasks: archive keeps students' access and progress).
export default async function ManageActivities({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const topic = await db.topic.findUnique({
    where: { id },
    include: { _count: { select: { assignments: true } }, grade: { select: { name: true } }, resources: { orderBy: { position: "asc" }, include: { resource: { include: { currentVersion: { select: { number: true } }, _count: { select: { activities: true } } } } } } },
  });
  if (!topic) notFound();
  const inTopic = new Set(topic.resources.map((r) => r.resourceId));
  const [others, grades, library, categories] = await Promise.all([
    db.libraryResource.findMany({ where: { id: { notIn: [...inTopic] }, status: { not: "ARCHIVED" } }, orderBy: [{ kind: "asc" }, { title: "asc" }], select: { id: true, title: true, kind: true, status: true } }),
    db.grade.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }], select: { id: true, name: true } }),
    pickableLibrary(),
    db.topic.findMany({ select: { category: true }, distinct: ["category"], orderBy: { category: "asc" } }),
  ]);
  const back = `/admin/topics/${topic.id}`;
  return (
    <>
      <Link href="/admin/topics" className="ws-link inline-flex min-h-11 items-center">‹ Topics</Link>
      <div className="mb-6 mt-3 flex flex-wrap items-center gap-5 rounded-[12px] border border-[#E2E6EC] bg-white p-5">
        <span className="grid h-24 w-24 shrink-0 place-items-center rounded-[12px]" style={{ background: `color-mix(in srgb, ${topic.color} 22%, white)` }}>
          <Art k={topic.art} className="h-[72px] w-[72px]" />
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-3xl font-extrabold leading-tight [overflow-wrap:anywhere]">{topic.titleEs}</h1>
          <p className="mt-1 font-bold text-ink/70">{topic.titleEn} · {topic.category} · {LANGUAGE_LABEL[topic.language] ?? topic.language}{topic.grade ? ` · ${topic.grade.name}` : ""}</p>
          {topic.description && <p className="mt-1 text-[15px] text-[#3B4252]">{topic.description}</p>}
        </div>
      </div>

      <TopicStatusBar topicId={topic.id} status={topic.status} assignments={topic._count.assignments} />

      <Panel className="mb-6">
        <h2 className="mb-2 font-display text-xl font-extrabold">Resources</h2>
        <ol className="divide-y divide-line">
          {topic.resources.map(({ resource: r }, i) => (
            <li key={r.id} data-testid="topic-activity" className="flex flex-wrap items-center gap-3 py-3">
              <span className="w-6 text-sm font-bold text-muted">{i + 1}</span>
              <KindBadge kind={r.kind as Kind} />
              <Link href={`/admin/content/${r.id}`} className="min-w-40 flex-1 font-bold text-sky hover:underline">{r.title}</Link>
              <GradeChips grades={r.grades} />
              <Badge tone={r.status === "PUBLISHED" ? "leaf" : r.status === "DRAFT" ? "sun" : "neutral"}>{r.status.toLowerCase()}{r.currentVersion ? ` v${r.currentVersion.number}` : ""}</Badge>
              <div className="flex gap-1">
                <form action={moveInTopic}><input type="hidden" name="topicId" value={topic.id} /><input type="hidden" name="resourceId" value={r.id} /><input type="hidden" name="dir" value="up" /><button disabled={i === 0} className="grid h-9 w-9 place-items-center rounded-full font-bold hover:bg-paper-2 disabled:opacity-30" aria-label={`Move ${r.title} up`}>↑</button></form>
                <form action={moveInTopic}><input type="hidden" name="topicId" value={topic.id} /><input type="hidden" name="resourceId" value={r.id} /><input type="hidden" name="dir" value="down" /><button disabled={i === topic.resources.length - 1} className="grid h-9 w-9 place-items-center rounded-full font-bold hover:bg-paper-2 disabled:opacity-30" aria-label={`Move ${r.title} down`}>↓</button></form>
              </div>
              <details className="w-full sm:w-auto">
                <summary className="cursor-pointer rounded-full px-3 py-1.5 text-sm font-bold text-ink-2 ring-1 ring-line hover:bg-paper-2">More</summary>
                <div className="mt-2 space-y-3 rounded-2xl border border-line bg-paper p-3">
                  <form action={replaceInTopic} className="flex flex-wrap items-center gap-2">
                    <input type="hidden" name="topicId" value={topic.id} /><input type="hidden" name="resourceId" value={r.id} />
                    <Select name="replacementId" aria-label={`Replace ${r.title} with`} className="w-64 py-1.5 text-sm" defaultValue="">
                      <option value="" disabled>Replace with…</option>
                      {others.filter((o) => o.kind === r.kind).concat(others.filter((o) => o.kind !== r.kind)).map((o) => <option key={o.id} value={o.id}>{KIND_LABEL[o.kind as Kind].label}: {o.title}{o.status === "DRAFT" ? " (draft)" : ""}</option>)}
                    </Select>
                    <Button size="sm" variant="secondary">Replace</Button>
                  </form>
                  <div className="flex flex-wrap gap-2">
                    <form action={duplicateResource}><input type="hidden" name="resourceId" value={r.id} /><Button size="sm" variant="secondary">Duplicate</Button></form>
                    <form action={removeFromTopic}><input type="hidden" name="topicId" value={topic.id} /><input type="hidden" name="resourceId" value={r.id} /><Button size="sm" variant="secondary">Remove from Topic</Button></form>
                    {r.status === "ARCHIVED" ? (
                      <form action={restoreResource}><input type="hidden" name="resourceId" value={r.id} /><Button size="sm" variant="secondary">Restore</Button></form>
                    ) : (
                      r.currentVersionId && <form action={archiveResource}><input type="hidden" name="resourceId" value={r.id} /><Button size="sm" variant="secondary">Archive</Button></form>
                    )}
                  </div>
                  <DeleteButton resourceId={r.id} back={back} />
                  {r._count.activities > 0 && <p className="text-xs text-muted">Used in {r._count.activities} assigned task activit{r._count.activities === 1 ? "y" : "ies"}. Archiving hides it from new tasks; students who have it keep access and progress.</p>}
                </div>
              </details>
            </li>
          ))}
          {topic.resources.length === 0 && <li className="py-3 text-muted">No activities yet.</li>}
        </ol>
        <div className="mt-4 border-t border-line pt-4" data-testid="add-resource">
          <h2 className="font-display text-lg font-extrabold">+ Add resource</h2>
          <p className="mb-3 text-sm text-muted">Each resource has a title, a type and its content. It stays in the Library if you remove it from this topic; use ↑ ↓ to change the order and its title to edit it.</p>
          <div className="flex flex-wrap items-center gap-3">
            <LibraryPicker items={library} excludeIds={[...inTopic]} onAdd={addResourcesToTopic.bind(null, topic.id)} label="Choose existing content" />
            <ButtonLink href={`/admin/content/new?topicId=${topic.id}`} variant="secondary" size="sm" data-testid="add-new-resource">Upload a file or add a link</ButtonLink>
          </div>
        </div>
      </Panel>
      <Panel>
        <h2 className="mb-3 font-display text-xl font-extrabold">Topic details</h2>
        <p className="-mt-2 mb-3 text-sm text-muted">Title, thumbnail and short description shown in the teachers&apos; Library.</p>
        <TopicForm topic={topic} grades={grades} categories={categories.map((c) => c.category)} />
      </Panel>
    </>
  );
}
