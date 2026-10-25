import Link from "next/link";
import { notFound } from "next/navigation";
import { StudentPicker } from "@/components/auth/StudentPicker";
import { PublicHeader } from "@/components/shell/PublicHeader";
import { db } from "@/lib/db";

export const metadata = { title: "Student sign in" };

export default async function ClassLogin({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const classroom = await db.classroom.findUnique({
    where: { code: code.toUpperCase() },
    select: {
      name: true,
      code: true,
      // Only first name + last initial and avatar are exposed on this screen.
      students: { where: { active: true }, select: { id: true, firstName: true, lastInitial: true, avatar: true }, orderBy: { firstName: "asc" } },
    },
  });
  if (!classroom) notFound();

  return (
    <div className="min-h-dvh">
      <PublicHeader />
      <main className="mx-auto max-w-3xl px-5 pb-16 pt-4">
        <Link href="/student" className="text-sm font-bold text-muted hover:text-ink">← Other class</Link>
        <h1 className="mt-3 font-display text-3xl font-semibold">{classroom.name}</h1>
        <p className="mt-1 text-lg text-ink-2">Find your name.</p>
        <StudentPicker code={classroom.code} students={classroom.students} />
      </main>
    </div>
  );
}
