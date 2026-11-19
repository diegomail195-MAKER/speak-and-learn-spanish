import { WorkspaceShell } from "@/components/shell/WorkspaceShell";
import { requireTeacherPage } from "@/lib/auth/guards";
import { db } from "@/lib/db";

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requireTeacherPage();
  const school = await db.school.findUniqueOrThrow({ where: { id: user.schoolId }, select: { name: true } });
  return (
    <WorkspaceShell workspace="teacher" user={user} school={school.name}>
      {children}
    </WorkspaceShell>
  );
}
