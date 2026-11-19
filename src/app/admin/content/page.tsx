import Link from "next/link";
import { GradeChips, KindBadge } from "@/components/library/LibraryBits";
import { ButtonLink } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Field";
import { Badge, EmptyState, PageHeader, Panel } from "@/components/ui/Panel";
import { db } from "@/lib/db";
import { ACTIVE_KINDS, GRADES, GRADE_LABEL, KIND_LABEL, storedKinds, type Kind } from "@/lib/library/types";

export const metadata = { title: "Resources" };

const PAGE = 50;

const STATUS = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;

export default async function ContentList({ searchParams }: { searchParams: Promise<{ status?: string; kind?: string; grade?: string; q?: string; saved?: string; page?: string }> }) {
  const sp = await searchParams;
  const status = STATUS.find((s) => s === sp.status);
  const kind = ACTIVE_KINDS.find((k) => k === (sp.kind === "PRINTABLE" ? "WORKSHEET" : sp.kind));
  const grade = GRADES.find((g) => g === sp.grade);
  const page = Math.max(1, Number(sp.page) || 1);
  const where = { ...(status ? { status } : {}), ...(kind ? { kind: { in: storedKinds(kind) } } : {}), ...(grade ? { grades: { has: grade } } : {}), ...(sp.q ? { title: { contains: sp.q, mode: "insensitive" as const } } : {}) };
  const total = await db.libraryResource.count({ where });
  const pages = Math.max(1, Math.ceil(total / PAGE));
  const pageHref = (n: number) => `/admin/content?${new URLSearchParams({ ...(sp.q ? { q: sp.q } : {}), ...(status ? { status } : {}), ...(kind ? { kind } : {}), ...(grade ? { grade } : {}), page: String(n) })}`;
  const items = await db.libraryResource.findMany({
    where,
    include: { topics: { include: { topic: { select: { titleEn: true } } } }, currentVersion: { select: { number: true } }, _count: { select: { activities: true } } },
    orderBy: { updatedAt: "desc" },
    take: PAGE,
    skip: (page - 1) * PAGE,
  });
  const saved = sp.saved ? await db.libraryResource.findUnique({ where: { id: sp.saved }, select: { title: true } }) : null;
  return (
    <>
      <PageHeader title="Resources" subtitle="Every resource is uploaded once and can be added to many topics and activities. Publishing creates a new version; assignments keep the version they pinned." actions={<ButtonLink href="/admin/content/new">Add Content</ButtonLink>} />
      {saved && <p role="status" className="mb-4 rounded-[18px] bg-leaf-soft px-4 py-2 font-bold text-leaf">Saved “{saved.title}” to the Library.</p>}
      <form className="mb-4 flex flex-wrap gap-2">
        <Input name="q" defaultValue={sp.q} placeholder="Search titles" className="w-56" aria-label="Search" />
        <Select name="status" defaultValue={status ?? ""} className="w-40" aria-label="Status"><option value="">Any status</option>{STATUS.map((s) => <option key={s} value={s}>{s.toLowerCase()}</option>)}</Select>
        <Select name="kind" defaultValue={kind ?? ""} className="w-40" aria-label="Type"><option value="">Any type</option>{ACTIVE_KINDS.map((k) => <option key={k} value={k}>{KIND_LABEL[k].label}</option>)}</Select>
        <Select name="grade" defaultValue={grade ?? ""} className="w-48" aria-label="Grade"><option value="">Any grade</option>{GRADES.map((g) => <option key={g} value={g}>{GRADE_LABEL[g].label}</option>)}</Select>
        <button className="ws-btn ws-btn-secondary">Filter</button>
      </form>
      {items.length === 0 ? (
        <EmptyState title="Nothing here yet" action={<ButtonLink href="/admin/content/new">Add Content</ButtonLink>} />
      ) : (
        <Panel className="relative overflow-x-auto p-0 sm:p-0">
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
      {pages > 1 && (
        <nav aria-label="Pages" className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted">Page {page} of {pages} · {total} resources</p>
          <div className="flex gap-2">
            {page > 1 && <Link className="ws-btn ws-btn-secondary" href={pageHref(page - 1)}>Previous</Link>}
            {page < pages && <Link className="ws-btn ws-btn-secondary" href={pageHref(page + 1)}>Next</Link>}
          </div>
        </nav>
      )}
    </>
  );
}
