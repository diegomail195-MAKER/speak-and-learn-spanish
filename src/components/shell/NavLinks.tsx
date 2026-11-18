"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavLinks({ links, tone = "coral", dark = false }: { links: Array<{ href: string; label: string; exact?: boolean }>; tone?: "coral" | "teal"; dark?: boolean }) {
  const path = usePathname();
  return (
    <nav aria-label="Main" className="-mx-1 flex gap-1 overflow-x-auto px-1">
      {links.map((l) => {
        const active = l.exact ? path === l.href : path === l.href || path.startsWith(l.href + "/");
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={`whitespace-nowrap inline-flex min-h-11 items-center rounded-[10px] px-3.5 text-[15px] font-semibold transition-colors ${
              active ? (tone === "coral" ? "bg-primary-soft text-primary" : "bg-teal text-white") : tone === "teal" && dark ? "text-white/85 hover:bg-white/10" : "text-ink-2 hover:bg-paper-2"
            }`}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
