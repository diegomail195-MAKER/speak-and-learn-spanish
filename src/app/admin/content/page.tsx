import Link from "next/link";
import { GradeChips, KindBadge } from "@/components/library/LibraryBits";
import { ButtonLink } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Field";
import { Badge, EmptyState, PageHeader, Panel } from "@/components/ui/Panel";
import { db } from "@/lib/db";
import { GRADES, GRADE_LABEL, KINDS, KIND_LABEL, type Kind } from "@/lib/library/types";

export const metadata = { title: "Library" };

const STATUS = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;

export default async function ContentList({ searchParams }: { searchParams: Promise<{ status?: string; kind?: string; grade?: string; q?: string; saved?: string }> }) {
  const sp = await searchParams;
  const status = STATUS.find((s) => s === sp.status);
  const kind = KINDS.find((k) => k === sp.kind);
  const grade = GRADES.find((g) => g === sp.grade);
  const items = await db.libraryResource.findMany({
    where: { ...(status ? { status } : {}), ...(kind ? { kind } : {}), ...(grade ? { grades: { has: grade } } : {}), ...(sp.q ? { title: { contains: sp.q, mode: "insensitive" } } : {}) },
    include: { topics: { include: { topic: { select: { titleEn: true } } } }, currentVersion: { select: { number: true } }, _count: { select: { activities: true } } },
    orderBy: { updatedAt: "desc" },
    take: 200,
  });
  const saved = sp.saved ? await db.libraryResource.findUnique({ where: { id: sp.saved }, select: { title: true } }) : null;
  return (
    <>
      <PageHeader title="Library" subtitle="Every resource is uploaded once and can be added to many topics and activities." actions={<ButtonLink href="/admin/content/new">Add Content</ButtonLink>} />
      {saved && <p role="status" className="mb-4 rounded-[18px] bg-leaf-soft px-4 py-2 font-bold text-leaf">Saved “{saved.title}” to the Library.</p>}
      <form className="mb-4 flex flex-wrap gap-2">
        <Input name="q" defaultValue={sp.q} placeholder="Search titles" className="w-56" aria-label="Search" />
        <Select name="status" defaultValue={status ?? ""} className="w-40" aria-label="Status"><option value="">Any status</option>{STATUS.map((s) => <option key={s} value={s}>{s.toLowerCase()}</option>)}</Select>
        <Select name="kind" defaultValue={kind ?? ""} className="w-40" aria-label="Type"><option value="">Any type</option>{KINDS.map((k) => <option key={k} value={k}>{KIND_LABEL[k].label}</option>)}</Select>
        <Select name="grade" defaultValue={grade ?? ""} className="w-48" aria-label="Grade"><option value="">Any grade</option>{GRADES.map((g) => <option key={g} value={g}>{GRADE_LABEL[g].label}</option>)}</Select>
        <button className="rounded-full bg-ink px-5 font-bold text-white">Filter</button>
      </form>
      {items.length === 0 ? (
        <EmptyState title="Nothing here yet" action={<ButtonLink href="/admin/content/new">Add Content</ButtonLink>} />
      ) : (
        <Panel className="overflow-x-auto p-0 sm:p-0">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-sky-soft"><tr><th className="px-3 py-3">Title</th><th className="px-3 py-3">Type</th><th className="px-3 py-3">Topics</th><th className="px-3 py-3">Grades</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Tasks</th><th className="px-3 py-3"><span className="sr-only">Actions</span></th></tr></thead>
            <tbody className="divide-y divide-line">
              {items.map((r) => (
                <tr key={r.id} data-testid="library-row">
                  <td className="px-3 py-3"><Link href={`/admin/content/${r.id}`} className="font-bold text-sky hover:underline">{r.title}</Link></td>
                  <td className="px-3 py-3"><KindBadge kind={r.kind as Kind} /></td>
                  <td className="px-3 py-3">{r.topics.map((t) => t.topic.titleEn).join(", ") || <span className="text-muted">—</span>}</td>
                  <td className="px-3 py-3"><GradeChips grades={r.grades} /></td>
                  <td className="px-3 py-3"><Badge tone={r.status === "PUBLISHED" ? "leaf" : r.status === "DRAFT" ? "sun" : "neutral"}>{r.status.toLowerCase()}{r.currentVersion ? ` · v${r.currentVersion.number}` : ""}</Badge></td>
                  <td className="px-3 py-3">{r._count.activities}</td>
                  <td className="whitespace-nowrap px-3 py-3 text-right">
                    <Link href={`/admin/content/${r.id}/preview`} className="font-bold text-sky hover:underline">Preview</Link>
                    <span className="mx-1 text-line">·</span>
                    <Link href={`/admin/content/${r.id}`} className="font-bold text-sky hover:underline">Open</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      )}
    </>
  );
}
