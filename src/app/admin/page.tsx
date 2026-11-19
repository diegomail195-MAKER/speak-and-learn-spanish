import Link from "next/link";
import { Suspense } from "react";
import { DashLoading } from "@/components/dashboard/Loading";
import { AdminTopicRow } from "@/components/admin/AdminTopicRow";
import { AutoSubmitSelect } from "@/components/dashboard/AutoSubmitSelect";
import { Card, Empty, PageTitle, StatCard, TopicThumb } from "@/components/dashboard/DashBits";
import { LocalTime } from "@/components/dashboard/LocalTime";
import { WsIcon } from "@/components/shell/WsIcons";
import { requireAdminPage } from "@/lib/auth/guards";
import { recentContentChanges } from "@/lib/dashboard/activity";
import { adminTopics, topicsReadyToPublish } from "@/lib/dashboard/adminTopics";
import { db } from "@/lib/db";
import { publishedWhere } from "@/lib/library/service";

export const metadata = { title: "Platform Admin" };

// Platform Admin › Overview: real counts (each opens its list), the latest topics with Preview and
// Edit, drafts ready to publish and the latest content changes.
async function AdminOverviewContent({ searchParams }: { searchParams: Promise<{ q?: string; status?: string }> }) {
  await requireAdminPage();
  const sp = await searchParams;
  const [published, drafts, resources, schools, topics, ready, changes] = await Promise.all([
    db.topic.count({ where: { status: "PUBLISHED" } }),
    db.topic.count({ where: { status: "DRAFT" } }),
    db.libraryResource.count({ where: publishedWhere }),
    db.school.count(),
    adminTopics({ q: sp.q, status: sp.status }, { take: 3 }),
    topicsReadyToPublish(1),
    recentContentChanges(3),
  ]);
  const filtered = !!(sp.q || sp.status);

  return (
    <>
      <PageTitle
        title="Content overview"
        action={
          <Link href="/admin/topics/new" className="ws-btn ws-btn-primary ws-btn-lg" data-testid="create-topic">
            <WsIcon name="plus" /> Create topic
          </Link>
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 xl:grid-cols-4" data-testid="admin-stats">
        <StatCard href="/admin/topics?status=PUBLISHED" icon="layers" value={published} label="Published topics" />
        <StatCard href="/admin/topics?status=DRAFT" icon="file" value={drafts} label="Drafts" tone="purple" />
        <StatCard href="/admin/content?status=PUBLISHED" icon="folder" value={resources} label="Resources" />
        <StatCard href="/admin/users?tab=schools" icon="school" value={schools} label="Schools" tone="purple" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Card title="Topics" testId="overview-topics">
          <form className="mb-4 flex flex-wrap gap-3" role="search">
            <label className="relative min-w-0 flex-1 basis-56 sm:max-w-[360px]">
              <span className="sr-only">Search topics</span>
              <WsIcon name="search" className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#5B6577]" />
              <input name="q" defaultValue={sp.q} placeholder="Search topics..." className="ws-input pl-11" />
            </label>
            <label className="basis-44">
              <span className="sr-only">Status</span>
              <AutoSubmitSelect name="status" defaultValue={sp.status ?? ""} className="ws-select">
                <option value="">All statuses</option>
                <option value="PUBLISHED">Published</option>
                <option value="DRAFT">Draft</option>
                <option value="ARCHIVED">Archived</option>
              </AutoSubmitSelect>
            </label>
            <button className="sr-only">Search</button>
          </form>
          {topics.rows.length === 0 ? (
            <Empty
              title={filtered ? "No topics match" : "No topics yet"}
              body={filtered ? "Try another word or status." : "Create the first topic and add its videos, games, flashcards and more."}
              action={filtered ? <Link href="/admin" className="ws-btn ws-btn-secondary">Clear filters</Link> : <Link href="/admin/topics/new" className="ws-btn ws-btn-primary">Create topic</Link>}
            />
          ) : (
            <ul className="divide-y divide-[#E2E6EC] border-t border-[#E2E6EC]">
              {topics.rows.map((t) => <AdminTopicRow key={t.id} topic={t} />)}
            </ul>
          )}
          {topics.total > topics.rows.length && (
            <p className="mt-1 border-t border-[#E2E6EC] pt-3 text-[15px] text-[#5B6577]">
              <Link className="ws-link inline-flex min-h-11 items-center gap-1" href={`/admin/topics?${new URLSearchParams({ ...(sp.q ? { q: sp.q } : {}), ...(sp.status ? { status: sp.status } : {}) })}`}>See all {topics.total} topics <WsIcon name="arrowRight" className="h-5 w-5" /></Link>
            </p>
          )}
        </Card>

        <div className="space-y-6">
          <Card title="Ready to publish" testId="ready-to-publish">
            {ready.length === 0 ? (
              <Empty title="Nothing waiting" body="Draft topics with resources appear here for review." />
            ) : (
              <ul className="space-y-4">
                {ready.map((t) => (
                  <li key={t.id}>
                    <div className="flex items-center gap-3 rounded-xl border border-[#E2E6EC] p-3">
                      <TopicThumb topic={t} size="lg" />
                      <div className="min-w-0">
                        <p className="font-display text-lg font-extrabold leading-tight [overflow-wrap:anywhere] line-clamp-2">{t.titleEs}</p>
                        <p className="text-[15px] text-[#5B6577]">{t.resources.length} resource{t.resources.length === 1 ? "" : "s"} · Draft</p>
                      </div>
                    </div>
                    <Link href={`/admin/topics/${t.id}`} className="ws-btn ws-btn-primary ws-btn-lg mt-3 w-full" data-testid="review-topic">Review topic</Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title="Recent changes" testId="recent-changes">
            {changes.length === 0 ? (
              <Empty title="No changes yet" body="Edits to topics and resources will appear here." />
            ) : (
              <ul className="divide-y divide-[#E2E6EC]">
                {changes.map((c) => (
                  <li key={c.id} className="flex gap-3 py-3 first:pt-0 last:pb-0">
                    <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-lg ${c.published ? "bg-[#F3E8FF] text-[#7E22CE]" : "bg-[#EEF3FF] text-[#2563EB]"}`}>
                      <WsIcon name={c.published ? "check" : "file"} className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold leading-snug line-clamp-2 [overflow-wrap:anywhere]">{c.href ? <Link href={c.href} className="hover:underline">{c.text}</Link> : c.text}</p>
                      <p className="mt-0.5 text-[15px] text-[#5B6577]" title={c.actor}><LocalTime iso={c.at} /></p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}

// The data part streams in behind a loading state (a loading.tsx at this level would hold back
// server-action results on the other admin pages).
export default function AdminOverview(props: { searchParams: Promise<{ q?: string; status?: string }> }) {
  return (
    <Suspense fallback={<DashLoading />}>
      <AdminOverviewContent {...props} />
    </Suspense>
  );
}
