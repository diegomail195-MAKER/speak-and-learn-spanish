"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/Art";
import { GRADE_FILTERS, type GradeFilter } from "./gradeFilters";

// Top block of Library: title, description, the four grade filters, the theme/activity search
// and "My favorites". Everything lives in the URL (?grade=&q=&fav=1), so the server page does
// the filtering and links can be shared or reopened.

export function LibraryHeader({ grade, q, fav }: { grade: GradeFilter; q: string; fav: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [text, setText] = useState(q);
  const typed = useRef(false);

  const go = (change: Record<string, string | null>, replace = false) => {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(change)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    const url = next.size ? `${pathname}?${next}` : pathname;
    if (replace) router.replace(url, { scroll: false });
    else router.push(url, { scroll: false });
  };

  // Search as the teacher types (350 ms after the last key); Enter searches right away.
  useEffect(() => {
    if (!typed.current) return;
    const t = setTimeout(() => go({ q: text.trim() || null }, true), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  return (
    <section aria-labelledby="library-title" className="lib-head mb-6 rounded-xl2 border border-line bg-card p-4 sm:p-6" data-testid="library-header">
      <h1 id="library-title" className="font-display text-[32px] font-extrabold leading-tight tracking-tight text-plum">Library</h1>
      <p className="mt-2 text-base text-ink-2">Filter by grade or search by topic to find the content your students need.</p>

      <div role="group" aria-label="Grade" className="mt-6 grid grid-cols-2 gap-2 sm:gap-4 md:grid-cols-4">
        {GRADE_FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            aria-pressed={grade === f.id}
            onClick={() => go({ grade: f.id === "all" ? null : f.id })}
            className="lib-filter"
            style={{ "--c": f.color, "--shade": f.shade } as React.CSSProperties}
            data-testid={`grade-${f.id}`}
          >
            <Icon name={f.icon} className="h-6 w-6" />
            <span>{f.label}</span>
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:gap-4">
        <form role="search" className="lib-search flex-1" onSubmit={(e) => (e.preventDefault(), go({ q: text.trim() || null }, true))}>
          <label htmlFor="library-search" className="sr-only">Search theme or activity</label>
          <span className="text-plum"><Icon name="search" className="h-5 w-5" /></span>
          <input
            id="library-search"
            type="search"
            value={text}
            onChange={(e) => ((typed.current = true), setText(e.target.value))}
            placeholder="Search theme or activity"
            maxLength={80}
            autoComplete="off"
            data-testid="library-search"
          />
        </form>
        <button type="button" aria-pressed={fav} onClick={() => go({ fav: fav ? null : "1" })} className="lib-fav" data-testid="library-favorites">
          <span className={fav ? "lib-heart-on" : ""}><Icon name="heart" className="h-6 w-6" /></span>
          My favorites
        </button>
      </div>
    </section>
  );
}
