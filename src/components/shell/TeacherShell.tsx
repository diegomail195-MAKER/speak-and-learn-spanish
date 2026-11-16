import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/ui/Logo";
import { signOut } from "@/lib/actions/auth";
import { NavLinks } from "./NavLinks";
import { VerifyBanner } from "./VerifyBanner";

const LINKS = [
  { href: "/teacher", label: "Dashboard", exact: true },
  { href: "/teacher/classes", label: "My Classes" },
  { href: "/teacher/library", label: "Library" },
  { href: "/teacher/my-activities", label: "My Activities" },
  { href: "/teacher/tasks/assign", label: "Assign Task" },
  { href: "/teacher/videos", label: "Videos" },
  { href: "/teacher/assignments", label: "Results" },
];

export function TeacherShell({ name, school, isAdmin, unverifiedEmail, children }: { name: string; school: string; isAdmin: boolean; unverifiedEmail: string | null; children: ReactNode }) {
  const links = isAdmin ? [...LINKS, { href: "/admin", label: "Admin" }] : LINKS;
  return (
    <div className="min-h-dvh">
      <header className="no-print sticky top-0 z-20 border-b-[3px] border-line bg-card">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-5 py-3">
          <Link href="/teacher" aria-label="Teacher dashboard">
            <Logo compact />
          </Link>
          <div className="order-3 w-full lg:order-none lg:w-auto lg:flex-1">
            <NavLinks links={links} />
          </div>
          <div className="ml-auto flex items-center gap-3 text-sm">
            <Link href="/teacher/games/new" className="rounded-full bg-coral px-4 py-2 font-bold text-white shadow-[0_2px_0_var(--color-coral-dark)] hover:bg-coral-dark">+ Create Activity</Link>
            <span className="hidden text-right leading-tight 2xl:block">
              <span className="block font-bold">{name}</span>
              <span className="block text-xs text-muted">{school}</span>
            </span>
            <Link href="/teacher/billing" className="rounded-full px-3 py-1.5 font-bold text-muted hover:bg-paper-2 hover:text-ink">Plan</Link>
            <form action={signOut}>
              <button className="rounded-full px-3 py-1.5 font-bold text-muted hover:bg-paper-2 hover:text-ink">Sign out</button>
            </form>
          </div>
        </div>
      </header>
      {unverifiedEmail && <VerifyBanner email={unverifiedEmail} />}
      <main className="mx-auto max-w-6xl px-5 py-8">{children}</main>
    </div>
  );
}
