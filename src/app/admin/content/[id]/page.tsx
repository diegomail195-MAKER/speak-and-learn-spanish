import Link from "next/link";
import { notFound } from "next/navigation";
import { ContentEditor } from "@/components/admin/ContentEditor";
import { DeleteButton, MetaForm, PublishButton } from "@/components/admin/ResourceForms";
import { KindBadge } from "@/components/library/LibraryBits";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Badge, Panel } from "@/components/ui/Panel";
import { archiveResource, duplicateResource, restoreResource } from "@/lib/actions/library";
import { db } from "@/lib/db";
import { safeContent, type AnyContent, type Kind } from "@/lib/library/types";

export default async function EditResource({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const r = await db.libraryResource.findUnique({
    where: { id },
    include: { topics: { include: { topic: true } }, currentVersion: true, versions: { orderBy: { number: "desc" }, take: 10, include: { _count: { select: { activities: true } } } }, _count: { select: { activities: true } } },
  });
  if (!r) notFound();
  const topics = await db.topic.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, titleEn: true, titleEs: true } });
  const kind = r.kind as Kind;
  const draft = safeContent(kind, r.draft) as AnyContent;
  const changed = !r.currentVersion || JSON.stringify(safeContent(kind, r.currentVersion.content)) !== JSON.stringify(draft);
  return (
    <>
      <Link href="/admin/content" className="text-sm font-bold text-sky hover:underline">‹ Library</Link>
      <div className="mb-6 mt-2 flex flex-wrap items-center gap-3">
        <KindBadge kind={kind} />
        <h1 className="font-display text-4xl font-extrabold">{r.title}</h1>
        <Badge tone={r.status === "PUBLISHED" ? "leaf" : r.status === "DRAFT" ? "sun" : "neutral"}>{r.status.toLowerCase()}{r.currentVersion ? ` · v${r.currentVersion.number}` : ""}</Badge>
        {r.status !== "DRAFT" && changed && <Badge tone="sun">unpublished changes</Badge>}
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <ContentEditor resourceId={r.id} kind={kind} initial={draft} />
        <div className="space-y-6">
          <Panel className="space-y-3">
            <h2 className="font-display text-xl font-extrabold">Publish</h2>
            <p className="text-sm text-muted">Preview the saved draft, then publish. Tasks already assigned keep the version they have, so students’ attempts and progress are never lost.</p>
            <ButtonLink href={`/admin/content/${r.id}/preview`} variant="secondary" size="sm" target="_blank">Preview draft ↗</ButtonLink>
            {r.status !== "ARCHIVED" && <PublishButton resourceId={r.id} label={r.currentVersion ? "Publish new version" : "Publish"} />}
            <div className="flex flex-wrap gap-2 border-t border-line pt-3">
              {r.status === "ARCHIVED" ? (
                <form action={restoreResource}><input type="hidden" name="resourceId" value={r.id} /><Button variant="secondary" size="sm">Restore</Button></form>
              ) : (
                r.currentVersion && <form action={archiveResource}><input type="hidden" name="resourceId" value={r.id} /><Button variant="secondary" size="sm">Archive</Button></form>
              )}
              <form action={duplicateResource}><input type="hidden" name="resourceId" value={r.id} /><Button variant="secondary" size="sm">Duplicate</Button></form>
            </div>
            <DeleteButton resourceId={r.id} />
            {r._count.activities > 0 && <p className="text-xs text-muted">In {r._count.activities} assigned task activit{r._count.activities === 1 ? "y" : "ies"}: archive instead of deleting.</p>}
          </Panel>
          <Panel>
            <h2 className="mb-3 font-display text-xl font-extrabold">Details</h2>
            <MetaForm resourceId={r.id} topics={topics} title={r.title} description={r.description} grades={r.grades} topicIds={r.topics.map((t) => t.topicId)} />
          </Panel>
          {r.versions.length > 0 && (
            <Panel>
              <h2 className="mb-2 font-display text-xl font-extrabold">Versions</h2>
              <ul className="divide-y divide-line text-sm">
                {r.versions.map((v) => (
                  <li key={v.id} className="flex justify-between py-2">
                    <span className="font-bold">v{v.number} {v.id === r.currentVersionId && <Badge tone="leaf">current</Badge>}</span>
                    <span className="text-muted">{v.createdAt.toLocaleDateString("en-US")} · {v._count.activities} assigned</span>
                  </li>
                ))}
              </ul>
            </Panel>
          )}
        </div>
      </div>
    </>
  );
}
