import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/ui/Logo";
import { signOut } from "@/lib/actions/auth";
import { NavLinks } from "./NavLinks";

const LINKS = [
  { href: "/teacher", label: "Dashboard", exact: true },
  { href: "/teacher/games", label: "Interactive Games" },
  { href: "/teacher/classes", label: "Classes" },
  { href: "/teacher/assignments", label: "Results" },
  { href: "/teacher/categories", label: "Categories" },
];

export function TeacherShell({ name, school, children }: { name: string; school: string; children: ReactNode }) {
  return (
    <div className="min-h-dvh">
      <header className="no-print border-b border-line bg-paper">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-5 py-3">
          <Link href="/teacher" aria-label="Teacher dashboard">
            <Logo compact />
          </Link>
          <div className="order-3 w-full md:order-none md:w-auto md:flex-1">
            <NavLinks links={LINKS} />
          </div>
          <div className="ml-auto flex items-center gap-3 text-sm">
            <span className="hidden text-right leading-tight lg:block">
              <span className="block font-bold">{name}</span>
              <span className="block text-xs text-muted">{school}</span>
            </span>
            <form action={signOut}>
              <button className="rounded-full px-3 py-1.5 font-bold text-muted hover:bg-paper-2 hover:text-ink">Sign out</button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-5 py-8">{children}</main>
    </div>
  );
}
