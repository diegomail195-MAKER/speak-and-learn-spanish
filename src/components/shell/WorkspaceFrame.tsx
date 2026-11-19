"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { WsIcon, type WsIconName } from "./WsIcons";

// The shared workspace layout of Platform Admin and Teacher View: a left sidebar (logo, workspace
// selector, navigation), a top bar with the workspace title and the account menu, and the page.
// Below 1024 px the sidebar becomes a menu opened from the top bar.

export type Workspace = "admin" | "teacher";
export type WsLink = { href: string; label: string; icon: WsIconName; exact?: boolean; match?: string[] };

const WORKSPACES: Record<Workspace, { label: string; href: string }> = {
  admin: { label: "Platform Admin", href: "/admin" },
  teacher: { label: "Teacher View", href: "/teacher" },
};

function isActive(path: string, l: WsLink) {
  if (l.exact) return path === l.href;
  const prefixes = [l.href, ...(l.match ?? [])];
  return prefixes.some((p) => path === p || path.startsWith(p + "/"));
}

/** Closes a popup on Escape or a click outside it. */
function useDismiss(open: boolean, close: () => void, ref: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    const onDown = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && close();
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
    };
  }, [open, close, ref]);
}

/** "Platform Admin / Teacher View" selector, shown when the account has both roles. */
export function WorkspaceSwitcher({ active, available }: { active: Workspace; available: Workspace[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useDismiss(open, () => setOpen(false), ref);
  if (available.length < 2) {
    return (
      <p className="ws-switch ws-switch-static" data-testid="workspace-current">
        {WORKSPACES[active].label}
      </p>
    );
  }
  return (
    <div className="relative" ref={ref}>
      <button type="button" className="ws-switch" aria-haspopup="true" aria-expanded={open} onClick={() => setOpen((o) => !o)} data-testid="workspace-switcher">
        <span className="sr-only">Workspace: </span>
        <span className="truncate">{WORKSPACES[active].label}</span>
        <WsIcon name="chevron" className={`h-5 w-5 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <ul className="ws-popup left-0 right-0 top-full mt-1" data-testid="workspace-options">
          {available.map((w) => (
            <li key={w}>
              <Link href={WORKSPACES[w].href} className="ws-popup-item" aria-current={w === active ? "page" : undefined} onClick={() => setOpen(false)} data-testid={`workspace-${w}`}>
                <span className="flex-1">{WORKSPACES[w].label}</span>
                {w === active && <WsIcon name="check" className="h-5 w-5 text-[#2563EB]" />}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function UserMenu({ name, email, school, accountHref, signOut }: { name: string; email: string | null; school: string; accountHref: string | null; signOut: () => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useDismiss(open, () => setOpen(false), ref);
  return (
    <div className="relative" ref={ref}>
      <button type="button" className="ws-user" aria-haspopup="true" aria-expanded={open} onClick={() => setOpen((o) => !o)} data-testid="user-menu">
        <span className="ws-avatar" aria-hidden>{name.trim().charAt(0).toUpperCase() || "?"}</span>
        <span className="hidden max-w-40 truncate font-bold sm:block">{name.trim().split(/\s+/)[0]}</span>
        <span className="sr-only sm:hidden">Account menu for {name}</span>
        <WsIcon name="chevron" className="h-5 w-5" />
      </button>
      {open && (
        <div className="ws-popup right-0 top-full mt-2 w-72">
          <div className="border-b border-[#E2E6EC] px-4 py-3">
            <p className="truncate font-bold">{name}</p>
            {email && <p className="truncate text-sm text-[#5B6577]">{email}</p>}
            <p className="truncate text-sm text-[#5B6577]">{school}</p>
          </div>
          <ul className="py-1">
            {accountHref && (
              <li><Link href={accountHref} className="ws-popup-item" onClick={() => setOpen(false)}><WsIcon name="user" className="h-5 w-5" />My Account</Link></li>
            )}
            <li><Link href="/teacher/billing" className="ws-popup-item" onClick={() => setOpen(false)}><WsIcon name="card" className="h-5 w-5" />Plan</Link></li>
            <li>
              <form action={signOut}>
                <button className="ws-popup-item w-full text-left"><WsIcon name="logout" className="h-5 w-5" />Sign out</button>
              </form>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}

export function WorkspaceFrame({
  workspace,
  available,
  title,
  links,
  extraLinks = [],
  user,
  accountHref,
  signOut,
  banner,
  children,
}: {
  workspace: Workspace;
  available: Workspace[];
  title: string;
  links: WsLink[];
  extraLinks?: WsLink[];
  user: { name: string; email: string | null; school: string };
  accountHref: string | null;
  signOut: () => Promise<void>;
  banner?: ReactNode;
  children: ReactNode;
}) {
  const path = usePathname();
  const [menu, setMenu] = useState(false);
  const menuBtn = useRef<HTMLButtonElement>(null);
  // Close the mobile menu after navigating.
  useEffect(() => setMenu(false), [path]);
  useEffect(() => {
    if (!menu) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenu(false);
        menuBtn.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menu]);

  const nav = (
    <>
      <div className="px-4 pb-2 pt-5">
        <Link href={WORKSPACES[workspace].href} aria-label={`LextroSpeak · ${WORKSPACES[workspace].label} home`} className="inline-block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/lextrospeak-logo.png" alt="LextroSpeak" width={884} height={160} className="h-8 w-auto" />
        </Link>
      </div>
      <div className="px-4 pb-4 pt-3">
        <p className="mb-1.5 text-sm text-[#5B6577]" id="ws-label">Workspace</p>
        <WorkspaceSwitcher active={workspace} available={available} />
      </div>
      <nav aria-label={`${WORKSPACES[workspace].label} navigation`} className="flex-1 overflow-y-auto px-3 pb-6">
        <ul className="space-y-1">
          {links.map((l) => {
            const on = isActive(path, l);
            return (
              <li key={l.href}>
                <Link href={l.href} className="ws-nav" aria-current={on ? "page" : undefined}>
                  <WsIcon name={l.icon} className="h-6 w-6 shrink-0" />
                  {l.label}
                </Link>
              </li>
            );
          })}
        </ul>
        {extraLinks.length > 0 && (
          <ul className="mt-4 space-y-1 border-t border-[#E2E6EC] pt-4">
            {extraLinks.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="ws-nav ws-nav-sm" aria-current={isActive(path, l) ? "page" : undefined}>
                  <WsIcon name={l.icon} className="h-5 w-5 shrink-0" />
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </nav>
    </>
  );

  return (
    <div className="ws min-h-dvh" data-workspace={workspace}>
      <a href="#ws-main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:font-bold">Skip to content</a>
      {/* Desktop sidebar */}
      <aside className="no-print fixed inset-y-0 left-0 z-30 hidden w-[264px] flex-col border-r border-[#E2E6EC] bg-white lg:flex" data-testid="ws-sidebar">
        {nav}
      </aside>
      {/* Mobile menu */}
      {menu && (
        <div className="no-print fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <button type="button" className="absolute inset-0 bg-[#172033]/40" aria-label="Close menu" onClick={() => setMenu(false)} tabIndex={-1} />
          <aside className="relative flex h-full w-[min(300px,86vw)] flex-col bg-white shadow-xl" data-testid="ws-drawer">
            <button type="button" onClick={() => setMenu(false)} className="ws-icon-btn absolute right-2 top-3" aria-label="Close menu" autoFocus>
              <WsIcon name="x" />
            </button>
            {nav}
          </aside>
        </div>
      )}
      <div className="lg:pl-[264px]">
        <header className="no-print sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-[#E2E6EC] bg-white px-4 sm:px-6">
          <button ref={menuBtn} type="button" className="ws-icon-btn -ml-1 lg:hidden" aria-label="Open menu" aria-expanded={menu} onClick={() => setMenu(true)} data-testid="ws-menu-button">
            <WsIcon name="menu" />
          </button>
          <p className="min-w-0 flex-1 truncate font-display text-xl font-extrabold text-[#172033] sm:text-2xl">{title}</p>
          <UserMenu name={user.name} email={user.email} school={user.school} accountHref={accountHref} signOut={signOut} />
        </header>
        {banner}
        <main id="ws-main" className="mx-auto w-full max-w-[1280px] px-5 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
