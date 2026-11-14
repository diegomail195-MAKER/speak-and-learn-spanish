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
import { addResourcesToTopic, archiveResource, duplicateResource, moveInTopic, removeFromTopic, replaceInTopic, restoreResource } from "@/lib/actions/library";
import { db } from "@/lib/db";
import { pickableLibrary } from "@/lib/library/service";
import { KIND_LABEL, type Kind } from "@/lib/library/types";

export const metadata = { title: "Manage Activities" };

// Manage Activities: add, remove, reorder and replace the activities of a topic.
// "Remove from Topic" only unlinks it; "Delete from Library" deletes the resource (refused if
// it's in assigned tasks: archive keeps students' access and progress).
export default async function ManageActivities({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const topic = await db.topic.findUnique({
    where: { id },
    include: { grade: { select: { name: true } }, resources: { orderBy: { position: "asc" }, include: { resource: { include: { currentVersion: { select: { number: true } }, _count: { select: { activities: true } } } } } } },
  });
  if (!topic) notFound();
  const inTopic = new Set(topic.resources.map((r) => r.resourceId));
  const [others, grades, library] = await Promise.all([
    db.libraryResource.findMany({ where: { id: { notIn: [...inTopic] }, status: { not: "ARCHIVED" } }, orderBy: [{ kind: "asc" }, { title: "asc" }], select: { id: true, title: true, kind: true, status: true } }),
    db.grade.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }], select: { id: true, name: true } }),
    pickableLibrary(),
  ]);
  const back = `/admin/topics/${topic.id}`;
  return (
    <>
      <Link href="/admin/topics" className="text-sm font-bold text-sky hover:underline">‹ Topics</Link>
      <div className="mb-6 mt-3 flex flex-wrap items-center gap-5 rounded-[28px] p-6 shadow-pop" style={{ background: topic.color }}>
        <Art k={topic.art} className="h-20 w-20" />
        <div className="flex-1">
          <h1 className="font-display text-4xl font-extrabold leading-none">Manage Activities · {topic.titleEs}</h1>
          <p className="mt-1 font-bold text-ink/75">{topic.titleEn} · {topic.category}{topic.grade ? ` · ${topic.grade.name}` : ""}</p>
        </div>
        <ButtonLink href={`/admin/content/new?topicId=${topic.id}`}>Add content</ButtonLink>
      </div>

      <Panel className="mb-6">
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
        <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-line pt-4">
          <LibraryPicker items={library} excludeIds={[...inTopic]} onAdd={addResourcesToTopic.bind(null, topic.id)} />
          <span className="text-sm text-muted">Pick resources already in the Library. They stay in the Library when you remove them from this topic.</span>
        </div>
      </Panel>
      <Panel>
        <h2 className="mb-3 font-display text-xl font-extrabold">Topic details</h2>
        <TopicForm topic={topic} grades={grades} />
      </Panel>
    </>
  );
}
