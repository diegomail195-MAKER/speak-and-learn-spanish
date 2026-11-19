import Link from "next/link";
import { Card, PageTitle } from "@/components/dashboard/DashBits";
import { LocalTime } from "@/components/dashboard/LocalTime";
import { ProfileForm } from "@/components/teacher/ProfileForm";
import { signOut } from "@/lib/actions/auth";
import { requireTeacherPage } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";

export const metadata = { title: "My Account" };

const ROLE: Record<string, string> = { ADMIN: "Teacher and platform administrator", TEACHER: "Teacher" };

export default async function AccountPage() {
  const { user, teacher } = await requireTeacherPage();
  const [school, owned, coTeaching, settings] = await Promise.all([
    db.school.findUniqueOrThrow({ where: { id: user.schoolId }, select: { name: true } }),
    db.classroom.count({ where: { teacherId: teacher.id, archivedAt: null } }),
    db.classroomTeacher.count({ where: { teacherId: teacher.id, classroom: { archivedAt: null } } }),
    getSettings(),
  ]);
  return (
    <>
      <PageTitle title="My Account" subtitle="Your profile, school and plan." />
      <div className="grid gap-6 xl:grid-cols-2">
        <Card title="Profile">
          <ProfileForm name={user.displayName} />
          <dl className="mt-5 grid gap-3 text-[15px] sm:grid-cols-[10rem_minmax(0,1fr)]">
            <dt className="font-bold text-[#5B6577]">Email</dt>
            <dd className="[overflow-wrap:anywhere]">{user.email ?? "—"} {user.email && (user.emailVerifiedAt ? <span className="ws-pill ws-pill-published ml-1">Verified</span> : <span className="ws-pill ws-pill-draft ml-1">Not verified</span>)}</dd>
            <dt className="font-bold text-[#5B6577]">School</dt>
            <dd data-testid="account-school">{school.name}</dd>
            <dt className="font-bold text-[#5B6577]">Role</dt>
            <dd>{ROLE[user.role] ?? user.role}</dd>
            <dt className="font-bold text-[#5B6577]">Classes</dt>
            <dd>{owned} owned · {coTeaching} co-teaching</dd>
            <dt className="font-bold text-[#5B6577]">Member since</dt>
            <dd><LocalTime iso={user.createdAt.toISOString()} mode="day" /></dd>
          </dl>
        </Card>
        <div className="space-y-6">
          <Card title="Plan">
            <p className="text-[15px] text-[#3D4759]">See your subscription, payments and invoices.</p>
            <Link href="/teacher/billing" className="ws-btn ws-btn-secondary mt-4">Open Plan</Link>
          </Card>
          <Card title="Security">
            <p className="text-[15px] text-[#3D4759]">To change your password, use the reset link: we email you a link that works once.</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link href="/forgot-password" className="ws-btn ws-btn-secondary">Change password</Link>
              <form action={signOut}><button className="ws-btn ws-btn-secondary">Sign out</button></form>
            </div>
          </Card>
          {settings.supportEmail && (
            <Card title="Need help?" testId="support-card">
              <p className="text-[15px] text-[#3D4759]">Write to <a href={`mailto:${settings.supportEmail}`} className="ws-link">{settings.supportEmail}</a>.</p>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
