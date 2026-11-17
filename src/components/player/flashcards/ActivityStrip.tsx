"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState, useTransition } from "react";
import { PrintablesViewer } from "@/components/printables/PrintablesViewer";
import { FontPreview } from "@/components/editor/FontPreview";
import { renameGame, setGameFont } from "@/lib/actions/games";
import type { PlayGame } from "@/lib/games/types";
import { printCardsFrom } from "@/lib/printables/fromGame";

export type StripRole = "ADMIN" | "TEACHER" | "STUDENT";

/** One assignment of this activity, as the Assignments section lists it. */
export interface StripAssignment {
  id: string;
  who: string;
  due: string;
  active: boolean;
  completed: number;
}

/**
 * The bar under every game: its title and type, and the actions this person may use.
 * Teachers and administrators get Edit Content, Print Worksheet (when the activity has a printable
 * sheet), Set Assignment and Rename, plus the list of this activity's assignments. Students only
 * see the title.
 */
export function ActivityStrip({ game, role, typeName, status, author, assignments }: { game: PlayGame; role: StripRole; typeName: string; status?: "DRAFT" | "PUBLISHED" | "ARCHIVED"; author?: string; assignments?: StripAssignment[] }) {
  const router = useRouter();
  const [printing, setPrinting] = useState(false);
  const [title, setTitle] = useState(game.title);
  const [renaming, setRenaming] = useState(false);
  const [draft, setDraft] = useState(game.title);
  const [renameError, setRenameError] = useState("");
  const [saving, startSaving] = useTransition();
  const [assigning, setAssigning] = useState(false);
  const [problems, setProblems] = useState<string[]>([]);
  const input = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<"settings" | "assignments">("settings");
  const [font, setFont] = useState(String(game.options.font ?? "default"));
  const [fontStatus, setFontStatus] = useState("");
  const cards = useMemo(() => printCardsFrom(game), [game]);
  const staff = role === "ADMIN" || role === "TEACHER";
  const isCards = game.board === "flashcards";
  // Only flashcards have a printable sheet so far (cards, bingo, matching…).
  const printable = isCards && cards.some((c) => c.front.text.trim() || c.front.imageUrl);
  const assignHref = `/teacher/assignments/new?gameId=${game.gameId}`;
  const action = "inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-sm font-bold text-ink-2 hover:bg-paper-2 hover:text-ink disabled:opacity-50";
  const primary = "inline-flex h-9 items-center gap-1.5 rounded-full bg-teal px-4 text-sm font-bold text-white hover:bg-teal-dark disabled:opacity-60";

  function startRename() {
    setDraft(title);
    setRenameError("");
    setRenaming(true);
    requestAnimationFrame(() => input.current?.select());
  }

  function saveRename() {
    startSaving(async () => {
      const r = await renameGame(game.gameId, draft);
      if (!r.ok) return setRenameError(r.error);
      setTitle(r.title);
      setRenaming(false);
      router.refresh();
    });
  }

  async function saveFont(value: string) {
    const before = font;
    setFont(value);
    setFontStatus("Saving…");
    const r = await setGameFont(game.gameId, value).catch(() => ({
      ok: false as const,
      error: "Couldn't save. Try again.",
    }));
    if (!r.ok) {
      setFont(before);
      return setFontStatus(r.error);
    }
    setFontStatus("Saved. The game uses this font.");
    router.refresh();
  }

  // A draft is published first (as the editor's Assign does), then the assign flow opens.
  async function setAssignment() {
    if (status === "PUBLISHED") return router.push(assignHref);
    setAssigning(true);
    setProblems([]);
    const res = await fetch(`/api/games/${game.gameId}/publish`, {
      method: "POST",
    }).catch(() => null);
    const body = (await res?.json().catch(() => null)) as {
      ok?: boolean;
      problems?: string[];
    } | null;
    if (body?.ok) return router.push(assignHref);
    setAssigning(false);
    setProblems(body?.problems?.length ? body.problems : ["The activity couldn't be published. Try again."]);
  }

  return (
    <section aria-label="About this activity" data-testid="activity-strip" className="mt-3 w-full">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl2 border border-line bg-card px-4 py-3">
        <div className="min-w-0 flex-1">
          {renaming ? (
            <form
              className="flex flex-wrap items-center gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                saveRename();
              }}
            >
              <label htmlFor="activity-title" className="sr-only">
                Activity title
              </label>
              <input
                ref={input}
                id="activity-title"
                data-testid="rename-input"
                value={draft}
                maxLength={120}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === "Escape" && setRenaming(false)}
                className="h-10 min-w-0 flex-1 rounded-xl border border-line bg-paper px-3 font-display text-lg font-bold focus:border-teal focus:outline-none"
                autoFocus
              />
              <button type="submit" className={primary} disabled={saving} data-testid="rename-save">
                {saving ? "Saving…" : "Save"}
              </button>
              <button type="button" className={action} onClick={() => setRenaming(false)}>
                Cancel
              </button>
              {renameError && (
                <p role="alert" className="w-full text-sm font-bold text-coral">
                  {renameError}
                </p>
              )}
            </form>
          ) : (
            <h2 className="truncate font-display text-lg font-bold sm:text-xl" data-testid="activity-title">
              {title || "Untitled"}
            </h2>
          )}
          <p className="text-xs font-bold text-muted">
            {typeName} · {game.questions.length} {isCards ? (game.questions.length === 1 ? "card" : "cards") : game.questions.length === 1 ? "item" : "items"}
            {author ? ` · by ${author}` : ""}
            {status && status !== "PUBLISHED" && <span className="ml-2 rounded-full bg-paper-2 px-2 py-0.5 text-ink-2">{status === "DRAFT" ? "Draft" : "Archived"}</span>}
          </p>
        </div>
        {staff && !renaming && (
          <div className="flex flex-wrap items-center gap-1" data-testid="activity-actions">
            <Link href={`/teacher/games/${game.gameId}/edit`} className={action} data-testid="action-edit">
              ✏️ Edit Content
            </Link>
            {printable && (
              <button type="button" className={action} onClick={() => setPrinting(true)} data-testid="action-print">
                🖨️ Print Worksheet
              </button>
            )}
            <button type="button" className={action} onClick={startRename} data-testid="action-rename">
              🏷️ Rename
            </button>
            {status !== "ARCHIVED" && (
              <button type="button" className={primary} onClick={setAssignment} disabled={assigning} data-testid="action-assign">
                📌 {assigning ? "Publishing…" : "Set Assignment"}
              </button>
            )}
          </div>
        )}
        {problems.length > 0 && (
          <div role="alert" className="w-full rounded-xl bg-coral/10 px-3 py-2 text-sm text-ink" data-testid="assign-problems">
            <p className="font-bold">Before assigning it, finish the activity:</p>
            <ul className="list-disc pl-5">
              {problems.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
            <Link href={`/teacher/games/${game.gameId}/edit`} className="font-bold text-coral">
              Open the editor →
            </Link>
          </div>
        )}
      </div>

      {staff && assignments && (
        <div className="mt-3 rounded-xl2 border border-line bg-card px-4 py-3">
          <div role="tablist" aria-label="Activity details" className="flex gap-1 border-b border-line">
            {(["settings", "assignments"] as const).map((k) => (
              <button
                key={k}
                type="button"
                role="tab"
                id={`tab-${k}`}
                aria-selected={tab === k}
                aria-controls={`panel-${k}`}
                onClick={() => setTab(k)}
                data-testid={`tab-${k}`}
                className={`-mb-px border-b-2 px-3 py-2 text-sm font-bold ${tab === k ? "border-teal text-ink" : "border-transparent text-muted hover:text-ink"}`}
              >
                {k === "settings" ? "Activity settings" : <>Assignments {assignments.length > 0 && <span className="text-muted">({assignments.length})</span>}</>}
              </button>
            ))}
          </div>
          {tab === "settings" ? (
            <div id="panel-settings" role="tabpanel" aria-labelledby="tab-settings" className="space-y-3 py-4" data-testid="activity-settings">
              <div className="max-w-sm">
                <label htmlFor="activity-font" className="mb-1 block text-sm font-bold text-ink-2">
                  Font
                </label>
                <select id="activity-font" data-testid="font-select" value={font} onChange={(e) => saveFont(e.target.value)} className="h-10 w-full rounded-xl border border-line bg-paper px-3 font-semibold">
                  <option value="default">LextroSpeak (default)</option>
                  <option value="montessori">Montessori Cursive</option>
                </select>
                <p className="mt-1 text-xs text-muted" aria-live="polite" data-testid="font-status">
                  {fontStatus}
                </p>
              </div>
              <FontPreview font={font} />
            </div>
          ) : (
            <div id="panel-assignments" role="tabpanel" aria-labelledby="tab-assignments" data-testid="activity-assignments">
              {assignments.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-6 text-center">
                  <p className="text-ink-2">You haven&apos;t set any assignments yet.</p>
                  {status !== "ARCHIVED" && (
                    <button type="button" className={primary} onClick={setAssignment} disabled={assigning}>
                      📌 Set Assignment
                    </button>
                  )}
                </div>
              ) : (
                <ul className="mt-2 divide-y divide-line">
                  {assignments.map((a) => (
                    <li key={a.id}>
                      <Link href={`/teacher/assignments/${a.id}`} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2 text-sm hover:text-coral">
                        <span className="font-bold">👥 {a.who || "—"}</span>
                        <span className="text-muted">{a.due}</span>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${a.active ? "bg-leaf/20 text-ink" : "bg-paper-2 text-ink-2"}`}>{a.active ? "open" : "closed"}</span>
                        <span className="ml-auto font-bold text-teal-dark">{a.completed} completed · See results →</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}
      {printing && <PrintablesViewer title={title} cards={cards} lang={game.language?.startsWith("fr") ? "fr" : game.language?.startsWith("en") ? "en" : "es"} onClose={() => setPrinting(false)} />}
    </section>
  );
}
