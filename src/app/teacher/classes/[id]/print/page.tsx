import Link from "next/link";
import { PrintButton } from "@/components/teacher/PrintButton";
import { teacherClass } from "@/lib/class-page";
import { db } from "@/lib/db";
import { appUrl } from "@/lib/email";

export const metadata = { title: "Access Instructions" };

// One card per student with the class code and username. PINs/passwords are never printed
// here (they're stored encrypted); the teacher writes them in or resets them.
export default async function PrintAccess({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { classroom } = await teacherClass(id);
  const students = await db.student.findMany({ where: { classroomId: classroom.id, active: true }, orderBy: { firstName: "asc" }, select: { id: true, firstName: true, lastInitial: true, username: true, loginType: true } });
  const url = `${appUrl().replace(/^https?:\/\//, "")}/student`;
  return (
    <>
      <div className="no-print mb-5 flex flex-wrap items-center justify-between gap-3">
        <Link href={`/teacher/classes/${classroom.id}`} className="text-sm font-bold text-sky hover:underline">‹ {classroom.name}</Link>
        <PrintButton />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {students.map((s) => (
          <div key={s.id} className="break-inside-avoid rounded-2xl border-2 border-dashed border-line bg-card p-4">
            <p className="font-display text-2xl font-bold">{s.firstName} {s.lastInitial && `${s.lastInitial}.`}</p>
            <p className="mt-2 text-sm">1. Go to <strong>{url}</strong></p>
            <p className="text-sm">2. Class code: <strong className="font-mono tracking-widest">{classroom.code}</strong></p>
            <p className="text-sm">3. Find your name (username <span className="font-mono">{s.username}</span>)</p>
            <p className="text-sm">4. {s.loginType === "PASSWORD" ? "Password" : "PIN"}: ________________</p>
          </div>
        ))}
      </div>
    </>
  );
}
