import { WorkspaceShell } from "@/components/shell/WorkspaceShell";
import { requireAdminPage } from "@/lib/auth/guards";
import { db } from "@/lib/db";

// Platform Admin. Every page and action here is checked on the server (requireAdmin*): teachers
// and students are redirected, and server actions answer 403.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requireAdminPage();
  const school = await db.school.findUniqueOrThrow({ where: { id: user.schoolId }, select: { name: true } });
  return (
    <WorkspaceShell workspace="admin" user={user} school={school.name}>
      {children}
    </WorkspaceShell>
  );
}
