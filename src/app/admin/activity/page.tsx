import Link from "next/link";
import { Card, Empty, PageTitle } from "@/components/dashboard/DashBits";
import { LocalTime } from "@/components/dashboard/LocalTime";
import { requireAdminPage } from "@/lib/auth/guards";
import { ACTION_GROUPS, actionWhere, describeActivity } from "@/lib/dashboard/activity";
import { db } from "@/lib/db";

export const metadata = { title: "Activity Log" };

const PAGE = 50;

// Platform Admin › Activity Log: important changes with author, date and action.
export default async function ActivityLog({ searchParams }: { searchParams: Promise<{ group?: string; page?: string }> }) {
  await requireAdminPage();
  const sp = await searchParams;
  const group = sp.group && ACTION_GROUPS[sp.group] ? sp.group : null;
  const page = Math.max(1, Number(sp.page) || 1);
  const where = actionWhere(group);
  const [rows, total] = await Promise.all([db.auditLog.findMany({ where, orderBy: { createdAt: "desc" }, take: PAGE, skip: (page - 1) * PAGE }), db.auditLog.count({ where })]);
  const entries = await describeActivity(rows);
  const pages = Math.max(1, Math.ceil(total / PAGE));
  const href = (g: string | null, n = 1) => `/admin/activity?${new URLSearchParams({ ...(g ? { group: g } : {}), ...(n > 1 ? { page: String(n) } : {}) })}`;
  const chip = (g: string | null, label: string) => (
    <Link href={href(g)} aria-current={group === g ? "page" : undefined} className="inline-flex min-h-11 items-center rounded-full border border-[#E2E6EC] bg-white px-4 font-bold text-[#3D4759] aria-[current=page]:border-[#2563EB] aria-[current=page]:bg-[#E8EFFF] aria-[current=page]:text-[#1D4ED8]">{label}</Link>
  );
  return (
    <>
      <PageTitle title="Activity Log" subtitle="Who changed what, and when. Times are shown in your time zone." />
      <nav aria-label="Filter" className="mb-4 flex flex-wrap gap-2">
        {chip(null, "Platform changes")}
        {Object.entries(ACTION_GROUPS).map(([k, g]) => chip(k, g.label))}
      </nav>
      <Card>
        {entries.length === 0 ? (
          <Empty title="Nothing recorded yet" />
        ) : (
          <div className="-mx-4 overflow-x-auto sm:mx-0">
            <table className="ws-table min-w-[720px]" data-testid="activity-table">
              <thead><tr><th>Date</th><th>Author</th><th>Change</th><th>Action</th></tr></thead>
              <tbody>
                {entries.map((e) => (
                  <tr key={e.id} data-testid="activity-row">
                    <td className="whitespace-nowrap"><LocalTime iso={e.at} mode="full" /></td>
                    <td className="font-semibold [overflow-wrap:anywhere]">{e.actor}</td>
                    <td className="[overflow-wrap:anywhere]">{e.href ? <Link href={e.href} className="hover:underline">{e.text}</Link> : e.text}</td>
                    <td><code className="rounded bg-[#EEF1F5] px-1.5 py-0.5 text-[13px] text-[#3D4759]">{e.action}</code></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {pages > 1 && (
          <nav aria-label="Pages" className="mt-4 flex items-center justify-between gap-3 border-t border-[#E2E6EC] pt-4">
            <p className="text-[15px] text-[#5B6577]">Page {page} of {pages} · {total} entries</p>
            <div className="flex gap-2">
              {page > 1 && <Link className="ws-btn ws-btn-secondary" href={href(group, page - 1)}>Previous</Link>}
              {page < pages && <Link className="ws-btn ws-btn-secondary" href={href(group, page + 1)}>Next</Link>}
            </div>
          </nav>
        )}
      </Card>
    </>
  );
}
