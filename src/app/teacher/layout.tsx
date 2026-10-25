import { TeacherShell } from "@/components/shell/TeacherShell";
import { requireTeacherPage } from "@/lib/auth/guards";
import { db } from "@/lib/db";

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requireTeacherPage();
  const school = await db.school.findUniqueOrThrow({ where: { id: user.schoolId }, select: { name: true } });
  return (
    <TeacherShell name={user.displayName} school={school.name}>
      {children}
    </TeacherShell>
  );
}
