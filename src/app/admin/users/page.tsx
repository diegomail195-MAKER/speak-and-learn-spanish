import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { AdminActionForm } from "@/components/admin/AdminActionForm";
import { Card, Empty, PageTitle } from "@/components/dashboard/DashBits";
import { LocalTime } from "@/components/dashboard/LocalTime";
import { WsIcon } from "@/components/shell/WsIcons";
import { createSchool, endSessions, inviteAdmin, renameSchool, revokeAdmin } from "@/lib/actions/admin";
import { requireAdminPage } from "@/lib/auth/guards";
import { db } from "@/lib/db";

export const metadata = { title: "Users & Schools" };

const PAGE = 25;
const ROLES = ["ADMIN", "TEACHER", "STUDENT"] as const;
const ROLE_LABEL: Record<string, string> = { ADMIN: "Administrator", TEACHER: "Teacher", STUDENT: "Student" };

// Platform Admin › Users & Schools. Students are managed by their teachers (classes); here they are
// listed for support. Administrator access goes through the project's grant process.
export default async function UsersAndSchools({ searchParams }: { searchParams: Promise<{ tab?: string; q?: string; role?: string; school?: string; page?: string }> }) {
  const { user: me } = await requireAdminPage();
  const sp = await searchParams;
  const tab = sp.tab === "schools" ? "schools" : "users";
  const page = Math.max(1, Number(sp.page) || 1);
  const role = ROLES.find((r) => r === sp.role);
  const q = sp.q?.trim();

  const tabLink = (t: string, label: string) => (
    <Link href={t === "users" ? "/admin/users" : "/admin/users?tab=schools"} aria-current={tab === t ? "page" : undefined} className="inline-flex min-h-11 items-center rounded-full border border-[#E2E6EC] bg-white px-5 font-bold text-[#3D4759] aria-[current=page]:border-[#2563EB] aria-[current=page]:bg-[#E8EFFF] aria-[current=page]:text-[#1D4ED8]">
      {label}
    </Link>
  );

  return (
    <>
      <PageTitle title="Users & Schools" subtitle="Accounts, roles and schools. Every change is recorded in the Activity Log." />
      <nav aria-label="Sections" className="mb-5 flex gap-2">{tabLink("users", "Users")}{tabLink("schools", "Schools")}</nav>
      {tab === "users" ? <Users me={me.id} q={q} role={role} school={sp.school} page={page} /> : <Schools q={q} page={page} />}
    </>
  );
}

async function Users({ me, q, role, school, page }: { me: string; q?: string; role?: string; school?: string; page: number }) {
  const where: Prisma.UserWhereInput = {
    // Students are many and managed in their classes: shown only when asked for.
    ...(role ? { role: role as (typeof ROLES)[number] } : { role: { in: ["ADMIN", "TEACHER"] } }),
    ...(school ? { schoolId: school } : {}),
    ...(q ? { OR: [{ displayName: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }] } : {}),
  };
  const [users, total, schools, admins] = await Promise.all([
    db.user.findMany({ where, orderBy: [{ role: "asc" }, { createdAt: "desc" }], take: PAGE, skip: (page - 1) * PAGE, include: { school: { select: { id: true, name: true } }, _count: { select: { sessions: true } } } }),
    db.user.count({ where }),
    db.school.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    db.user.count({ where: { role: "ADMIN" } }),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE));
  const href = (n: number) => `/admin/users?${new URLSearchParams({ ...(q ? { q } : {}), ...(role ? { role } : {}), ...(school ? { school } : {}), page: String(n) })}`;
  return (
    <div className="space-y-6">
      <Card title="Add an administrator">
        <p className="-mt-2 mb-3 text-[15px] text-[#5B6577]">Verified teacher accounts become administrators right away. Unverified accounts get the verification email first, and new emails an invitation to create the account.</p>
        <AdminActionForm action={inviteAdmin} className="flex flex-wrap items-center gap-3" testId="invite-admin">
          <label className="min-w-0 flex-1 basis-64"><span className="sr-only">Email</span><input name="email" type="email" required placeholder="name@school.org" className="ws-input" /></label>
          <button className="ws-btn ws-btn-primary">Give admin access</button>
        </AdminActionForm>
      </Card>

      <Card title={`Users (${total})`}>
        <form className="mb-4 grid gap-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_auto]" role="search">
          <label className="relative"><span className="sr-only">Search users</span>
            <WsIcon name="search" className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#5B6577]" />
            <input name="q" defaultValue={q} placeholder="Name or email" className="ws-input pl-11" />
          </label>
          <label><span className="sr-only">Role</span>
            <select name="role" defaultValue={role ?? ""} className="ws-select">
              <option value="">Admins and teachers</option>
              {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}s</option>)}
            </select>
          </label>
          <label><span className="sr-only">School</span>
            <select name="school" defaultValue={school ?? ""} className="ws-select">
              <option value="">All schools</option>
              {schools.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </label>
          <button className="ws-btn ws-btn-secondary">Apply</button>
        </form>
        {users.length === 0 ? (
          <Empty title="No users match" />
        ) : (
          <div className="-mx-4 overflow-x-auto sm:mx-0">
            <table className="ws-table min-w-[860px]" data-testid="users-table">
              <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>School</th><th>Joined</th><th><span className="sr-only">Actions</span></th></tr></thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} data-testid="user-row">
                    <td className="font-bold [overflow-wrap:anywhere]">{u.displayName}{u.id === me && <span className="ml-2 text-sm font-semibold text-[#5B6577]">(you)</span>}</td>
                    <td className="[overflow-wrap:anywhere]">{u.email ?? <span className="text-[#5B6577]">—</span>}{u.email && !u.emailVerifiedAt && <span className="ml-2 text-xs font-bold text-[#B54708]">unverified</span>}</td>
                    <td><span className={`ws-pill ${u.role === "ADMIN" ? "ws-pill-active" : u.role === "TEACHER" ? "ws-pill-published" : "ws-pill-archived"}`}>{ROLE_LABEL[u.role]}</span></td>
                    <td className="[overflow-wrap:anywhere]">{u.school.name}</td>
                    <td className="whitespace-nowrap"><LocalTime iso={u.createdAt.toISOString()} mode="day" /></td>
                    <td>
                      <div className="flex flex-wrap justify-end gap-2">
                        {u.role === "TEACHER" && u.email && (
                          <AdminActionForm action={inviteAdmin} className="flex flex-wrap gap-2" confirm={`Give administrator access to ${u.displayName}?`}>
                            <input type="hidden" name="email" value={u.email} />
                            <button className="ws-btn ws-btn-secondary">Make admin</button>
                          </AdminActionForm>
                        )}
                        {u.role === "ADMIN" && u.id !== me && admins > 1 && (
                          <AdminActionForm action={revokeAdmin} className="flex flex-wrap gap-2" confirm={`Remove administrator access from ${u.displayName}?`}>
                            <input type="hidden" name="userId" value={u.id} />
                            <button className="ws-btn ws-btn-danger">Remove admin</button>
                          </AdminActionForm>
                        )}
                        {u.id !== me && u._count.sessions > 0 && (
                          <AdminActionForm action={endSessions} className="flex flex-wrap gap-2" confirm={`Sign ${u.displayName} out of every device?`}>
                            <input type="hidden" name="userId" value={u.id} />
                            <button className="ws-btn ws-btn-secondary">Sign out</button>
                          </AdminActionForm>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {pages > 1 && (
          <nav aria-label="Pages" className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#E2E6EC] pt-4">
            <p className="text-[15px] text-[#5B6577]">Page {page} of {pages}</p>
            <div className="flex gap-2">
              {page > 1 && <Link className="ws-btn ws-btn-secondary" href={href(page - 1)}>Previous</Link>}
              {page < pages && <Link className="ws-btn ws-btn-secondary" href={href(page + 1)}>Next</Link>}
            </div>
          </nav>
        )}
      </Card>
    </div>
  );
}

async function Schools({ q, page }: { q?: string; page: number }) {
  const where: Prisma.SchoolWhereInput = q ? { name: { contains: q, mode: "insensitive" } } : {};
  const [schools, total] = await Promise.all([
    db.school.findMany({ where, orderBy: { name: "asc" }, take: PAGE, skip: (page - 1) * PAGE, include: { _count: { select: { classrooms: true, students: true } }, users: { where: { role: { in: ["ADMIN", "TEACHER"] } }, select: { id: true } } } }),
    db.school.count({ where }),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE));
  const href = (n: number) => `/admin/users?${new URLSearchParams({ tab: "schools", ...(q ? { q } : {}), page: String(n) })}`;
  return (
    <div className="space-y-6">
      <Card title="Add a school">
        <AdminActionForm action={createSchool} className="flex flex-wrap items-center gap-3" testId="create-school">
          <label className="min-w-0 flex-1 basis-64"><span className="sr-only">School name</span><input name="name" required maxLength={120} placeholder="Montessori School of Raleigh" className="ws-input" /></label>
          <button className="ws-btn ws-btn-primary">Add school</button>
        </AdminActionForm>
      </Card>
      <Card title={`Schools (${total})`}>
        <form className="mb-4 flex flex-wrap gap-3" role="search">
          <input type="hidden" name="tab" value="schools" />
          <label className="relative min-w-0 flex-1 basis-64"><span className="sr-only">Search schools</span>
            <WsIcon name="search" className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#5B6577]" />
            <input name="q" defaultValue={q} placeholder="School name" className="ws-input pl-11" />
          </label>
          <button className="ws-btn ws-btn-secondary">Search</button>
        </form>
        {schools.length === 0 ? (
          <Empty title="No schools match" />
        ) : (
          <div className="-mx-4 overflow-x-auto sm:mx-0">
            <table className="ws-table min-w-[760px]" data-testid="schools-table">
              <thead><tr><th>Name</th><th>Teachers</th><th>Classes</th><th>Students</th><th>Created</th></tr></thead>
              <tbody>
                {schools.map((s) => (
                  <tr key={s.id} data-testid="school-row">
                    <td>
                      <AdminActionForm action={renameSchool} className="flex flex-wrap items-center gap-2">
                        <input type="hidden" name="schoolId" value={s.id} />
                        <label className="min-w-0 flex-1 basis-48"><span className="sr-only">Name of {s.name}</span><input name="name" defaultValue={s.name} required maxLength={120} className="ws-input" /></label>
                        <button className="ws-btn ws-btn-secondary">Save</button>
                      </AdminActionForm>
                    </td>
                    <td><Link className="ws-link" href={`/admin/users?school=${s.id}`}>{s.users.length}</Link></td>
                    <td>{s._count.classrooms}</td>
                    <td>{s._count.students}</td>
                    <td className="whitespace-nowrap"><LocalTime iso={s.createdAt.toISOString()} mode="day" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {pages > 1 && (
          <nav aria-label="Pages" className="mt-4 flex items-center justify-between gap-3 border-t border-[#E2E6EC] pt-4">
            <p className="text-[15px] text-[#5B6577]">Page {page} of {pages}</p>
            <div className="flex gap-2">
              {page > 1 && <Link className="ws-btn ws-btn-secondary" href={href(page - 1)}>Previous</Link>}
              {page < pages && <Link className="ws-btn ws-btn-secondary" href={href(page + 1)}>Next</Link>}
            </div>
          </nav>
        )}
      </Card>
    </div>
  );
}
