"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition, type KeyboardEvent, type PointerEvent } from "react";
import { saveTopicPlan } from "@/lib/actions/topicPlans";

export type PlanItem = { key: string; kind: string; title: string };

const ICON: Record<string, string> = {
  VIDEO: "/topic-icons/videos.webp",
  GAME: "/topic-icons/games.webp",
  FLASHCARDS: "/topic-icons/flashcards.webp",
  SONG: "/topic-icons/music-videos.webp",
  SPEAKING: "/topic-icons/speaking.webp",
};
const LABEL: Record<string, string> = { VIDEO: "Video", GAME: "Game", FLASHCARDS: "Flashcards", SONG: "Music video", SPEAKING: "Speaking", PRINTABLE: "Printable", WORKSHEET: "Worksheet" };
const PURPLE = "#620D78";

function KindIcon({ kind }: { kind: string }) {
  return ICON[kind] ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={ICON[kind]} alt="" width={44} height={44} className="h-11 w-11 shrink-0 object-contain" />
  ) : (
    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#FFF3CC] text-xl" aria-hidden>🖨️</span>
  );
}

/**
 * The teacher's lesson order for a topic: drag the handle (mouse or finger), or use ↑/↓ (buttons
 * or arrow keys on the handle). Remove a step, or add the teacher's own activities and removed
 * library items back. Saved per teacher; the five category icons keep their fixed order.
 */
export function TopicPlanEditor({ topicId, initial, removed, own }: { topicId: string; initial: PlanItem[]; removed: PlanItem[]; own: PlanItem[] }) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [hidden, setHidden] = useState(removed);
  const [status, setStatus] = useState("");
  const [dirty, setDirty] = useState(false);
  const [dragKey, setDragKey] = useState<string | null>(null);
  const [saving, start] = useTransition();
  const listRef = useRef<HTMLOListElement>(null);
  const handles = useRef(new Map<string, HTMLButtonElement | null>());
  const addable = [...hidden, ...own.filter((o) => !items.some((i) => i.key === o.key))];

  const change = (next: PlanItem[]) => {
    setItems(next);
    setDirty(true);
    setStatus("");
  };
  const move = (from: number, to: number, focus = false) => {
    if (to < 0 || to >= items.length || from === to) return;
    const next = [...items];
    const [it] = next.splice(from, 1);
    next.splice(to, 0, it);
    change(next);
    setStatus(`${it.title}: step ${to + 1} of ${next.length}`);
    if (focus) requestAnimationFrame(() => handles.current.get(it.key)?.focus());
  };
  const remove = (i: number) => {
    const it = items[i];
    change(items.filter((_, j) => j !== i));
    if (it.key.startsWith("r:")) setHidden((h) => [...h, it]);
  };
  const add = (it: PlanItem) => {
    change([...items, it]);
    setHidden((h) => h.filter((x) => x.key !== it.key));
  };

  // Pointer drag (mouse, pen and touch): the item follows the finger over the others' midpoints.
  function onPointerDown(e: PointerEvent<HTMLButtonElement>, key: string) {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragKey(key);
  }
  function onPointerMove(e: PointerEvent<HTMLButtonElement>) {
    if (!dragKey || !listRef.current) return;
    const rows = [...listRef.current.querySelectorAll<HTMLLIElement>("li[data-key]")];
    const from = items.findIndex((i) => i.key === dragKey);
    let to = from;
    rows.forEach((row, i) => {
      const r = row.getBoundingClientRect();
      if (e.clientY > r.top + r.height / 2) to = i;
      if (i === 0 && e.clientY < r.top + r.height / 2) to = 0;
    });
    if (e.clientY < rows[0]?.getBoundingClientRect().top + 10) to = 0;
    if (to !== from) move(from, to);
  }
  function onPointerUp() {
    setDragKey(null);
  }
  function onHandleKey(e: KeyboardEvent<HTMLButtonElement>, i: number) {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      move(i, i - 1, true);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      move(i, i + 1, true);
    }
  }

  const save = () =>
    start(async () => {
      const r = await saveTopicPlan({ topicId, steps: items.map((i) => i.key), hidden: hidden.map((h) => h.key) });
      if (!r.ok) return setStatus(r.error);
      setDirty(false);
      setStatus("Saved. New assignments of this topic follow this order.");
      router.refresh();
    });

  const small = "grid h-9 w-9 place-items-center rounded-full text-ink-2 ring-1 ring-line hover:bg-paper-2 disabled:opacity-30 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[#FF5148]";

  return (
    <div className="space-y-5" data-testid="plan-editor">
      <ol ref={listRef} className="space-y-2" aria-label="Lesson order" data-testid="plan-list">
        {items.map((it, i) => (
          <li
            key={it.key}
            data-key={it.key}
            data-testid="plan-item"
            className={`flex items-center gap-3 rounded-2xl border-2 bg-white p-2.5 pr-3 transition-shadow motion-reduce:transition-none ${dragKey === it.key ? "border-[#620D78] shadow-[0_12px_24px_-12px_rgba(98,13,120,0.6)]" : "border-[#620D78]/10"}`}
          >
            <button
              ref={(el) => {
                handles.current.set(it.key, el);
              }}
              type="button"
              aria-label={`Move ${it.title}. Use the up and down arrow keys.`}
              onPointerDown={(e) => onPointerDown(e, it.key)}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              onKeyDown={(e) => onHandleKey(e, i)}
              className="grid h-11 w-8 shrink-0 cursor-grab touch-none place-items-center rounded-lg text-ink-2/60 hover:bg-paper-2 active:cursor-grabbing focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-[#FF5148]"
              data-testid="plan-handle"
            >
              <svg viewBox="0 0 12 20" className="h-5 w-3 fill-current" aria-hidden><circle cx="3" cy="4" r="1.6" /><circle cx="9" cy="4" r="1.6" /><circle cx="3" cy="10" r="1.6" /><circle cx="9" cy="10" r="1.6" /><circle cx="3" cy="16" r="1.6" /><circle cx="9" cy="16" r="1.6" /></svg>
            </button>
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-sm font-extrabold text-white" style={{ background: PURPLE }}>{i + 1}</span>
            <KindIcon kind={it.kind} />
            <span className="min-w-0 flex-1">
              <span className="block truncate font-display font-extrabold text-ink">{it.title}</span>
              <span className="text-xs font-bold text-muted">{LABEL[it.kind] ?? it.kind}{it.key.startsWith("g:") ? " · my activity" : ""}</span>
            </span>
            <span className="flex shrink-0 items-center gap-1">
              <button type="button" className={small} onClick={() => move(i, i - 1, true)} disabled={i === 0} aria-label={`Move ${it.title} up`} data-testid="plan-up">↑</button>
              <button type="button" className={small} onClick={() => move(i, i + 1, true)} disabled={i === items.length - 1} aria-label={`Move ${it.title} down`} data-testid="plan-down">↓</button>
              <button type="button" className={`${small} hover:text-coral-dark`} onClick={() => remove(i)} aria-label={`Remove ${it.title}`} data-testid="plan-remove">✕</button>
            </span>
          </li>
        ))}
        {items.length === 0 && <li className="rounded-2xl border-2 border-dashed border-line p-6 text-center text-ink-2">No steps yet. Add activities below.</li>}
      </ol>

      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={save} disabled={saving || !dirty} className="inline-flex h-11 items-center rounded-full px-6 font-bold text-white disabled:opacity-50" style={{ background: PURPLE }} data-testid="plan-save">
          {saving ? "Saving…" : "Save order"}
        </button>
        <p role="status" aria-live="polite" className="text-sm font-bold text-ink-2" data-testid="plan-status">{status || (dirty ? "Unsaved changes" : "")}</p>
      </div>

      <section aria-labelledby="add-heading" className="rounded-2xl border border-line bg-card p-4">
        <h2 id="add-heading" className="font-display text-lg font-extrabold">Add activities</h2>
        <p className="mb-3 text-sm text-ink-2">Your own published activities (Speaking games and flashcards) and the library items you removed.</p>
        {addable.length === 0 ? (
          <p className="text-sm text-muted">Nothing else to add. Create a Speaking activity in My Activities and publish it to add it here.</p>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {addable.map((it) => (
              <li key={it.key} className="flex items-center gap-3 rounded-xl border border-line bg-white p-2">
                <KindIcon kind={it.kind} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-bold">{it.title}</span>
                  <span className="text-xs text-muted">{LABEL[it.kind] ?? it.kind}{it.key.startsWith("g:") ? " · my activity" : " · library"}</span>
                </span>
                <button type="button" onClick={() => add(it)} className="rounded-full px-3 py-1.5 text-sm font-bold text-white" style={{ background: PURPLE }} data-testid="plan-add" aria-label={`Add ${it.title}`}>
                  + Add
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
