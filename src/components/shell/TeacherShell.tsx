import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/ui/Logo";
import { UiIcon } from "@/components/ui/icons";
import { signOut } from "@/lib/actions/auth";
import { ProfileMenu } from "./ProfileMenu";
import { TeacherNav, type NavItem } from "./TeacherNav";
import { VerifyBanner } from "./VerifyBanner";

const LINKS: NavItem[] = [
  { href: "/teacher", label: "Dashboard", icon: "home", exact: true },
  { href: "/teacher/classes", label: "My Classes", icon: "users" },
  { href: "/teacher/library", label: "Library", icon: "book" },
  { href: "/teacher/my-activities", label: "My Activities", icon: "layers" },
  { href: "/teacher/tasks/assign", label: "Assign Task", icon: "clipboard" },
  { href: "/teacher/videos", label: "Videos", icon: "play" },
  { href: "/teacher/assignments", label: "My Assignments", icon: "list" },
];

/**
 * Teacher header, two compact rows: logo + Create Activity / Plan / profile, then the sections.
 * Sections that don't fit move into "More"; account options and Sign out live in the profile menu.
 */
export function TeacherShell({ name, school, isAdmin, unverifiedEmail, children }: { name: string; school: string; isAdmin: boolean; unverifiedEmail: string | null; children: ReactNode }) {
  const links: NavItem[] = isAdmin ? [...LINKS, { href: "/admin", label: "Admin", icon: "settings" }] : LINKS;
  return (
    <div className="min-h-dvh">
      <header className="no-print sticky top-0 z-30 border-b border-line bg-card">
        <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-2 sm:gap-4 sm:px-6">
          <Link href="/teacher" aria-label="Teacher dashboard" className="mr-auto inline-flex h-11 items-center rounded-lg">
            <Logo compact />
          </Link>
          <Link href="/teacher/games/new" className="inline-flex h-11 items-center gap-2 rounded-[10px] bg-primary px-3 text-[15px] font-bold text-white shadow-sm hover:bg-primary-dark sm:px-4" data-testid="create-activity">
            <UiIcon name="plus" />
            <span className="hidden min-[420px]:inline">Create Activity</span>
            <span className="sr-only min-[420px]:hidden">Create Activity</span>
          </Link>
          <Link href="/teacher/billing" className="hidden h-11 items-center gap-2 rounded-[10px] border border-line bg-card px-4 text-[15px] font-semibold text-ink-2 hover:bg-paper-2 md:inline-flex">
            <UiIcon name="layers" className="text-muted" />
            Plan
          </Link>
          <ProfileMenu name={name} school={school} signOut={signOut} />
        </div>
        <div className="border-t border-line">
          <div className="mx-auto flex max-w-6xl px-4 py-1 sm:px-6">
            <TeacherNav links={links} />
          </div>
        </div>
      </header>
      {unverifiedEmail && <VerifyBanner email={unverifiedEmail} />}
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
