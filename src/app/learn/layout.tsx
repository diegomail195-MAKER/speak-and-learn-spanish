import Link from "next/link";
import { NavLinks } from "@/components/shell/NavLinks";
import { Avatar } from "@/components/ui/Avatar";
import { Logo } from "@/components/ui/Logo";
import { signOut } from "@/lib/actions/auth";
import { requireStudentPage } from "@/lib/auth/guards";

// Student area: only their own activities. No admin tools, no other students.
export default async function LearnLayout({ children }: { children: React.ReactNode }) {
  const { student } = await requireStudentPage();
  return (
    <div className="min-h-dvh">
      <header className="border-b border-line bg-card">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 px-5 py-3">
          <Link href="/learn" aria-label="My Learning"><Logo compact /></Link>
          <div className="order-3 w-full sm:order-none sm:w-auto sm:flex-1">
            <NavLinks tone="teal" links={[{ href: "/learn", label: "My Activities", exact: true }, { href: "/learn/videos", label: "My Videos" }, { href: "/learn/alphabet", label: "ABC" }, { href: "/learn/progress", label: "My Progress" }]} />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Avatar name={student.firstName} kind={student.avatar} size={34} />
            <span className="font-bold">{student.firstName}</span>
            <form action={signOut}><button className="rounded-full px-3 py-1.5 text-sm font-bold text-muted hover:bg-paper-2">Salir</button></form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-5 py-8">{children}</main>
    </div>
  );
}
