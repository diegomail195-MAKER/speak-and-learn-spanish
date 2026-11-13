import { NavLinks } from "@/components/shell/NavLinks";
import { TeacherShell } from "@/components/shell/TeacherShell";
import { requireAdminPage } from "@/lib/auth/guards";
import { db } from "@/lib/db";

// Administrator panel. Every page and action here is checked on the server (requireAdmin*).
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requireAdminPage();
  const school = await db.school.findUniqueOrThrow({ where: { id: user.schoolId }, select: { name: true } });
  return (
    <TeacherShell name={user.displayName} school={school.name} isAdmin unverifiedEmail={null}>
      <div className="no-print mb-6 rounded-[22px] bg-ink p-2">
        <NavLinks
          tone="teal"
          dark
          links={[
            { href: "/admin", label: "Admin", exact: true },
            { href: "/admin/content", label: "Content" },
            { href: "/admin/topics", label: "Topics & Activities" },
            { href: "/admin/content/new", label: "+ Add Content", exact: true },
          ]}
        />
      </div>
      {children}
    </TeacherShell>
  );
}
