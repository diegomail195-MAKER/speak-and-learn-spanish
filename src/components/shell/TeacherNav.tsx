"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLayoutEffect, useRef, useState } from "react";
import { Menu, MenuLink } from "@/components/ui/Menu";
import { UiIcon, type IconName } from "@/components/ui/icons";

export type NavItem = { href: string; label: string; icon: IconName; exact?: boolean };

const isActive = (path: string, l: NavItem) => (l.exact ? path === l.href : path === l.href || path.startsWith(l.href + "/"));

/**
 * Second header row. Shows as many sections as fit the row; the rest go into a "More" menu
 * (priority+ pattern), so nothing wraps or scrolls sideways at any width.
 */
export function TeacherNav({ links }: { links: NavItem[] }) {
  const path = usePathname();
  const row = useRef<HTMLDivElement>(null);
  const measure = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState(links.length);

  useLayoutEffect(() => {
    const r = row.current;
    const m = measure.current;
    if (!r || !m) return;
    const calc = () => {
      const widths = [...m.children].map((c) => (c as HTMLElement).offsetWidth + 4);
      const more = widths.pop() ?? 0; // last child is the "More" button
      const avail = r.clientWidth;
      const total = widths.reduce((a, b) => a + b, 0);
      if (total <= avail) return setFit(widths.length);
      let used = more;
      let n = 0;
      while (n < widths.length && used + widths[n] <= avail) used += widths[n++];
      setFit(Math.max(1, n));
    };
    calc();
    const ro = new ResizeObserver(calc);
    ro.observe(r);
    return () => ro.disconnect();
  }, [links.length]);

  const shown = links.slice(0, fit);
  const extra = links.slice(fit);
  const extraActive = extra.some((l) => isActive(path, l));
  const item = (active: boolean) =>
    `inline-flex h-11 items-center gap-2 whitespace-nowrap rounded-[10px] px-3 text-[15px] font-semibold ${active ? "bg-primary-soft text-primary" : "text-ink-2 hover:bg-paper-2 hover:text-ink"}`;

  return (
    <div ref={row} className="relative min-w-0 flex-1">
      {/* Off-screen copy used only to measure each link's width. */}
      <div aria-hidden="true" className="pointer-events-none invisible absolute inset-x-0 top-0 h-0 overflow-hidden">
      <div ref={measure} className="flex w-max gap-1">
        {links.map((l) => (
          <span key={l.href} className={item(false)}>
            <UiIcon name={l.icon} />
            {l.label}
          </span>
        ))}
        <span className={item(false)}>
          More <UiIcon name="chevronDown" size={16} />
        </span>
      </div>
      </div>
      <nav aria-label="Main" className="-m-1 flex items-center gap-1 overflow-x-clip p-1">
        {shown.map((l) => {
          const active = isActive(path, l);
          return (
            <Link key={l.href} href={l.href} aria-current={active ? "page" : undefined} className={item(active)}>
              <UiIcon name={l.icon} className={active ? "text-primary" : "text-muted"} />
              {l.label}
            </Link>
          );
        })}
        {extra.length > 0 && (
          <Menu
            label="More sections"
            align="start"
            trigger={({ ref, props, open }) => (
              <button ref={ref} {...props} aria-label={extraActive ? `More sections (current: ${extra.find((l) => isActive(path, l))!.label})` : "More sections"} className={item(extraActive || open)} data-testid="nav-more">
                More
                <UiIcon name="chevronDown" size={16} />
              </button>
            )}
          >
            {extra.map((l) => (
              <MenuLink key={l.href} href={l.href} icon={l.icon} active={isActive(path, l)}>
                {l.label}
              </MenuLink>
            ))}
          </Menu>
        )}
      </nav>
    </div>
  );
}
