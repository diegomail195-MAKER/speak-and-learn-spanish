"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** Main navigation. The current page is an indigo tab with the brand's tilde underneath. */
export function NavLinks({ links, tone = "coral" }: { links: Array<{ href: string; label: string; exact?: boolean }>; tone?: "coral" | "teal" }) {
  const path = usePathname();
  const big = tone === "teal"; // student navigation: larger touch targets
  return (
    <nav aria-label="Main" className="-mx-1 flex gap-1 overflow-x-auto px-1 py-1">
      {links.map((l) => {
        const active = l.exact ? path === l.href : path === l.href || path.startsWith(l.href + "/");
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={`relative inline-flex items-center whitespace-nowrap rounded-lg px-3.5 font-bold transition-colors ${big ? "min-h-11 text-[0.95rem]" : "min-h-10 text-sm"} ${
              active ? "bg-indigo text-white" : "text-ink-2 hover:bg-paper-2 hover:text-ink"
            }`}
          >
            {l.label}
            {active && (
              <svg viewBox="0 0 40 6" className="pointer-events-none absolute -bottom-1 left-1/2 h-1.5 w-8 -translate-x-1/2" aria-hidden="true">
                <path d="M2 4c6-3 10-3 16 0s10 3 20-1" fill="none" stroke="#f16b50" strokeWidth="2.6" strokeLinecap="round" />
              </svg>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
