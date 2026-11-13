import Link from "next/link";
import { ButtonLink } from "@/components/ui/Button";
import { PageHeader, Panel } from "@/components/ui/Panel";
import { db } from "@/lib/db";

export const metadata = { title: "Admin" };

export default async function AdminHome() {
  const [published, drafts, archived, topics, tasks] = await Promise.all([
    db.libraryResource.count({ where: { status: "PUBLISHED" } }),
    db.libraryResource.count({ where: { status: "DRAFT" } }),
    db.libraryResource.count({ where: { status: "ARCHIVED" } }),
    db.topic.count(),
    db.assignment.count({ where: { topicId: { not: null } } }),
  ]);
  return (
    <>
      <PageHeader eyebrow="Administrator" title="Content Management" subtitle="Upload and publish songs, videos, games, flashcards, printables and worksheets by grade. Drafts are only visible here." actions={<ButtonLink href="/admin/content/new">Add Content</ButtonLink>} />
      <dl className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        {[["Published", published, "/admin/content?status=PUBLISHED"], ["Drafts", drafts, "/admin/content?status=DRAFT"], ["Archived", archived, "/admin/content?status=ARCHIVED"], ["Topics", topics, "/admin/topics"], ["Tasks assigned", tasks, null]].map(([label, n, href]) => (
          <Panel key={label as string} className="p-4 sm:p-4">
            <dt className="text-sm font-bold text-muted">{label}</dt>
            <dd className="font-display text-4xl font-extrabold">{href ? <Link href={href as string} className="hover:underline">{n}</Link> : n}</dd>
          </Panel>
        ))}
      </dl>
    </>
  );
}
