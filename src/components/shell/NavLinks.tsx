"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavLinks({ links, tone = "coral" }: { links: Array<{ href: string; label: string; exact?: boolean }>; tone?: "coral" | "teal" }) {
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
            className={`whitespace-nowrap rounded-full px-3.5 py-2 text-sm font-bold transition-colors ${
              active ? (tone === "coral" ? "bg-ink text-white" : "bg-teal text-white") : "text-ink-2 hover:bg-paper-2"
            }`}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
