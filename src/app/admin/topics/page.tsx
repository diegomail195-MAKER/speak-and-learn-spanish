import Link from "next/link";
import { AdminTopicRow } from "@/components/admin/AdminTopicRow";
import { Card, Empty, PageTitle } from "@/components/dashboard/DashBits";
import { WsIcon } from "@/components/shell/WsIcons";
import { requireAdminPage } from "@/lib/auth/guards";
import { adminTopics } from "@/lib/dashboard/adminTopics";
import { db } from "@/lib/db";
import { LANGUAGE_LABEL, TOPIC_LANGUAGES } from "@/lib/library/topicMeta";

export const metadata = { title: "Topics" };

const PAGE = 20;

// Platform Admin › Topics: every topic (published, drafts, archived) filtered by status, grade,
// language and category, with Preview, Edit and publish / unpublish / archive.
export default async function AdminTopics({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; language?: string; gradeId?: string; category?: string; page?: string }> }) {
  await requireAdminPage();
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const filter = { q: sp.q, status: sp.status, language: sp.language, gradeId: sp.gradeId, category: sp.category };
  const [{ rows, total }, grades, categories, counts] = await Promise.all([
    adminTopics(filter, { take: PAGE, skip: (page - 1) * PAGE }),
    db.grade.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }], select: { id: true, name: true } }),
    db.topic.findMany({ select: { category: true }, distinct: ["category"], orderBy: { category: "asc" } }),
    db.topic.groupBy({ by: ["status"], _count: true }),
  ]);
  const count = (s: string) => counts.find((c) => c.status === s)?._count ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE));
  const qs = (over: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...filter, page: String(page), ...over })) if (v && !(k === "page" && v === "1")) p.set(k, v);
    const s = p.toString();
    return s ? `/admin/topics?${s}` : "/admin/topics";
  };
  const tab = (s: string | undefined, label: string, n: number) => (
    <Link href={qs({ status: s, page: "1" })} aria-current={sp.status === s || (!s && !sp.status) ? "page" : undefined} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#E2E6EC] bg-white px-4 font-bold text-[#3D4759] hover:border-[#9AA5B5] aria-[current=page]:border-[#2563EB] aria-[current=page]:bg-[#E8EFFF] aria-[current=page]:text-[#1D4ED8]">
      {label} <span className="text-sm opacity-70">{n}</span>
    </Link>
  );
  const filtered = !!(sp.q || sp.status || sp.language || sp.gradeId || sp.category);

  return (
    <>
      <PageTitle
        title="Topics"
        subtitle="Create topics, order their resources and decide what teachers see."
        action={<Link href="/admin/topics/new" className="ws-btn ws-btn-primary ws-btn-lg" data-testid="create-topic"><WsIcon name="plus" /> Create topic</Link>}
      />
      <nav aria-label="Status" className="mb-4 flex flex-wrap gap-2">
        {tab(undefined, "All", count("PUBLISHED") + count("DRAFT") + count("ARCHIVED"))}
        {tab("PUBLISHED", "Published", count("PUBLISHED"))}
        {tab("DRAFT", "Drafts", count("DRAFT"))}
        {tab("ARCHIVED", "Archived", count("ARCHIVED"))}
      </nav>
      <Card>
        <form className="mb-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))_auto]" role="search">
          {sp.status && <input type="hidden" name="status" value={sp.status} />}
          <label className="relative">
            <span className="sr-only">Search topics</span>
            <WsIcon name="search" className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#5B6577]" />
            <input name="q" defaultValue={sp.q} placeholder="Search topics..." className="ws-input pl-11" />
          </label>
          <label><span className="sr-only">Grade</span>
            <select name="gradeId" defaultValue={sp.gradeId ?? ""} className="ws-select">
              <option value="">All grades</option>
              {grades.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </label>
          <label><span className="sr-only">Language</span>
            <select name="language" defaultValue={sp.language ?? ""} className="ws-select">
              <option value="">All languages</option>
              {TOPIC_LANGUAGES.map((l) => <option key={l} value={l}>{LANGUAGE_LABEL[l]}</option>)}
            </select>
          </label>
          <label><span className="sr-only">Category</span>
            <select name="category" defaultValue={sp.category ?? ""} className="ws-select">
              <option value="">All categories</option>
              {categories.map((c) => <option key={c.category} value={c.category}>{c.category}</option>)}
            </select>
          </label>
          <button className="ws-btn ws-btn-secondary">Apply</button>
        </form>
        {rows.length === 0 ? (
          <Empty title={filtered ? "No topics match these filters" : "No topics yet"} action={filtered ? <Link href="/admin/topics" className="ws-btn ws-btn-secondary">Clear filters</Link> : <Link href="/admin/topics/new" className="ws-btn ws-btn-primary">Create topic</Link>} />
        ) : (
          <ul className="divide-y divide-[#E2E6EC] border-t border-[#E2E6EC]" data-testid="admin-topic-list">
            {rows.map((t) => <AdminTopicRow key={t.id} topic={t} detailed />)}
          </ul>
        )}
        {pages > 1 && (
          <nav aria-label="Pages" className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#E2E6EC] pt-4">
            <p className="text-[15px] text-[#5B6577]">Page {page} of {pages} · {total} topics</p>
            <div className="flex gap-2">
              {page > 1 && <Link className="ws-btn ws-btn-secondary" href={qs({ page: String(page - 1) })}>Previous</Link>}
              {page < pages && <Link className="ws-btn ws-btn-secondary" href={qs({ page: String(page + 1) })}>Next</Link>}
            </div>
          </nav>
        )}
      </Card>
    </>
  );
}
