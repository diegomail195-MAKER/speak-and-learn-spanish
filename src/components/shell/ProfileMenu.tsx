"use client";

import { Menu, MenuHeader, MenuItem, MenuLink, MenuSeparator } from "@/components/ui/Menu";
import { UiIcon } from "@/components/ui/icons";

/** Avatar + name button; the menu holds who is signed in (name, school), Plan and Sign out. */
export function ProfileMenu({ name, school, signOut }: { name: string; school: string; signOut: () => Promise<void> }) {
  const initial = name.trim().slice(0, 1).toUpperCase() || "?";
  return (
    <Menu
      label="Account"
      width={280}
      testId="profile-menu"
      trigger={({ ref, props, open }) => (
        <button
          ref={ref}
          {...props}
          aria-label={`Account: ${name}`}
          data-testid="profile-button"
          className={`inline-flex h-11 max-w-56 items-center gap-2 rounded-[10px] pl-1 pr-2 ${open ? "bg-paper-2" : "hover:bg-paper-2"}`}
        >
          <span aria-hidden className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary-soft text-[15px] font-bold text-primary">{initial}</span>
          <span className="hidden min-w-0 truncate text-[15px] font-semibold text-ink sm:block">{name}</span>
          <UiIcon name="chevronDown" size={16} className="shrink-0 text-muted" />
        </button>
      )}
    >
      <MenuHeader>
        <span className="block truncate text-base font-bold text-ink">{name}</span>
        <span className="block truncate text-sm text-muted">{school}</span>
      </MenuHeader>
      <MenuSeparator />
      <MenuLink href="/teacher/billing" icon="card">Plan &amp; billing</MenuLink>
      <MenuSeparator />
      <form action={signOut}>
        <MenuItem type="submit" icon="logout">Sign out</MenuItem>
      </form>
    </Menu>
  );
}
