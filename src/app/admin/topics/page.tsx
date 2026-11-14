import { TopicForm } from "@/components/admin/TopicForm";
import { TopicCard } from "@/components/library/LibraryBits";
import { ButtonLink } from "@/components/ui/Button";
import { PageHeader, Panel } from "@/components/ui/Panel";
import { db } from "@/lib/db";
import { pickableLibrary } from "@/lib/library/service";
import type { Kind } from "@/lib/library/types";

export const metadata = { title: "Topics & Activities" };

export default async function AdminTopics() {
  const [topics, grades, library] = await Promise.all([
    db.topic.findMany({ orderBy: [{ sortOrder: "asc" }, { titleEn: "asc" }], include: { grade: { select: { name: true } }, resources: { include: { resource: { select: { kind: true, status: true } } } } } }),
    db.grade.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }], select: { id: true, name: true } }),
    pickableLibrary(),
  ]);
  return (
    <>
      <PageHeader title="Topics & Activities" subtitle="Each topic groups its activities. Use “Edit activities” to add, remove, reorder or replace them." actions={<ButtonLink href="/admin/content/new">Add content</ButtonLink>} />
      <Panel className="mb-6">
        <h2 className="mb-3 font-display text-xl font-extrabold">New topic</h2>
        <TopicForm grades={grades} library={library} />
      </Panel>
      <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {topics.map((t) => (
          <li key={t.id}>
            <TopicCard href={`/admin/topics/${t.id}`} topic={t} kinds={t.resources.filter((r) => r.resource.status !== "ARCHIVED").map((r) => r.resource.kind as Kind)}
              footer={<div className="flex flex-wrap items-center justify-center gap-2">{t.grade && <span className="rounded-full bg-paper-2 px-2.5 py-1 text-xs font-bold text-ink-2">{t.grade.name}</span>}<ButtonLink href={`/admin/topics/${t.id}`} variant="secondary" size="sm">Edit activities</ButtonLink></div>} />
          </li>
        ))}
      </ul>
    </>
  );
}
