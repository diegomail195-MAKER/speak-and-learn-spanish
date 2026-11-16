"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { PrintablesViewer } from "@/components/printables/PrintablesViewer";
import type { PlayGame } from "@/lib/games/types";
import { printCardsFrom } from "@/lib/printables/fromGame";

export type StripRole = "ADMIN" | "TEACHER" | "STUDENT";

/**
 * The compact strip under a game: its title and type, and the actions this person may use.
 * Teachers and administrators get Edit Content and Printables side by side (plus Assign once
 * the activity is published); students only see the title.
 */
export function ActivityStrip({ game, role, typeName, status, author }: { game: PlayGame; role: StripRole; typeName: string; status?: "DRAFT" | "PUBLISHED" | "ARCHIVED"; author?: string }) {
  const [printing, setPrinting] = useState(false);
  const cards = useMemo(() => printCardsFrom(game), [game]);
  const staff = role === "ADMIN" || role === "TEACHER";
  const action = "inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-sm font-bold text-ink-2 hover:bg-paper-2 hover:text-ink";
  return (
    <section aria-label="About this activity" data-testid="activity-strip" className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl2 border border-line bg-card px-4 py-3">
      <div className="min-w-0 flex-1">
        <h2 className="truncate font-display text-lg font-bold sm:text-xl">{game.title || "Untitled"}</h2>
        <p className="text-xs font-bold text-muted">
          {typeName} · {game.questions.length} {game.questions.length === 1 ? "card" : "cards"}
          {author ? ` · by ${author}` : ""}
          {status && status !== "PUBLISHED" && <span className="ml-2 rounded-full bg-paper-2 px-2 py-0.5 text-ink-2">{status === "DRAFT" ? "Draft" : "Archived"}</span>}
        </p>
      </div>
      {staff && (
        <div className="flex flex-wrap items-center gap-1">
          <Link href={`/teacher/games/${game.gameId}/edit`} className={action}>✏ Edit Content</Link>
          <button type="button" className={action} onClick={() => setPrinting(true)}>🖨 Printables</button>
          {status === "PUBLISHED" && (
            <Link href={`/teacher/assignments/new?gameId=${game.gameId}`} className="inline-flex h-9 items-center rounded-full bg-teal px-4 text-sm font-bold text-white hover:bg-teal-dark">
              Assign
            </Link>
          )}
        </div>
      )}
      {printing && <PrintablesViewer title={game.title} cards={cards} lang={game.language?.startsWith("fr") ? "fr" : game.language?.startsWith("en") ? "en" : "es"} onClose={() => setPrinting(false)} />}
    </section>
  );
}
