"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { KindBadge } from "@/components/library/LibraryBits";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Field";
import { KINDS, KIND_LABEL, type Kind } from "@/lib/library/types";

export type PickItem = { id: string; title: string; kind: string; status: string };
type AddResult = { error?: string; message?: string } | undefined | void;

/**
 * "Add from Library": search, filter by type, preview and pick one or more library resources.
 * `onAdd` is either a server action (bound to a topic or activity) or a local callback (forms
 * that create something new keep the picks until they're saved).
 */
export function LibraryPicker({ items, excludeIds = [], onAdd, label = "Add from Library", testId = "add-from-library" }: { items: PickItem[]; excludeIds?: string[]; onAdd: (ids: string[]) => Promise<AddResult> | AddResult; label?: string; testId?: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const router = useRouter();
  const [q, setQ] = useState("");
  const [kind, setKind] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [error, setError] = useState<string>();
  const [pending, start] = useTransition();
  const excluded = useMemo(() => new Set(excludeIds), [excludeIds]);
  const shown = items.filter((i) => !excluded.has(i.id) && (!kind || i.kind === kind) && (!q.trim() || i.title.toLowerCase().includes(q.trim().toLowerCase())));

  const open = () => { setPicked([]); setError(undefined); dialog.current?.showModal(); };
  const close = () => dialog.current?.close();
  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const add = () => start(async () => {
    const r = await onAdd(picked);
    if (r && r.error) return setError(r.error);
    close();
    router.refresh();
  });

  return (
    <>
      <Button type="button" variant="secondary" size="sm" onClick={open} data-testid={testId}>{label}</Button>
      <dialog ref={dialog} aria-label={label} className="m-auto w-[min(44rem,calc(100vw-2rem))] rounded-[24px] border border-line bg-card p-0 text-ink shadow-pop backdrop:bg-ink/40">
        <div className="flex max-h-[80vh] flex-col">
          <div className="border-b border-line p-5">
            <h2 className="font-display text-2xl font-extrabold">{label}</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by title" aria-label="Search the library" className="min-w-48 flex-1" />
              <Select value={kind} onChange={(e) => setKind(e.target.value)} aria-label="Type of content" className="w-44">
                <option value="">All types</option>
                {KINDS.map((k) => <option key={k} value={k}>{KIND_LABEL[k].label}</option>)}
              </Select>
            </div>
          </div>
          <ul className="flex-1 divide-y divide-line overflow-y-auto px-5" data-testid="library-picker-list">
            {shown.map((i) => (
              <li key={i.id} className="flex items-center gap-3 py-3">
                <input id={`pick-${i.id}`} type="checkbox" checked={picked.includes(i.id)} onChange={() => toggle(i.id)} className="h-5 w-5" />
                <label htmlFor={`pick-${i.id}`} className="flex min-w-0 flex-1 cursor-pointer flex-wrap items-center gap-2">
                  <KindBadge kind={i.kind as Kind} />
                  <span className="font-bold">{i.title}</span>
                  {i.status === "DRAFT" && <span className="text-xs font-bold text-[#8a5a00]">draft</span>}
                </label>
                <a href={`/admin/content/${i.id}/preview`} target="_blank" rel="noopener" className="shrink-0 text-sm font-bold text-sky hover:underline">Preview ↗</a>
              </li>
            ))}
            {shown.length === 0 && <li className="py-6 text-center text-muted">Nothing matches. Add it first with Add Content.</li>}
          </ul>
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line p-4">
            {error && <p role="alert" className="mr-auto text-sm font-bold text-coral-dark">{error}</p>}
            <Button type="button" variant="ghost" size="sm" onClick={close}>Cancel</Button>
            <Button type="button" size="sm" disabled={!picked.length || pending} onClick={add}>{pending ? "Adding…" : `Add selected${picked.length ? ` (${picked.length})` : ""}`}</Button>
          </div>
        </div>
      </dialog>
    </>
  );
}

/** Picks kept in a form that creates something (hidden inputs named `name`), with Remove. */
export function PickedResources({ items, picked, onRemove, name = "resourceIds" }: { items: PickItem[]; picked: string[]; onRemove: (id: string) => void; name?: string }) {
  const byId = new Map(items.map((i) => [i.id, i]));
  if (!picked.length) return <p className="text-sm text-muted">No library resources yet.</p>;
  return (
    <ul className="space-y-2" data-testid="picked-resources">
      {picked.map((id) => {
        const i = byId.get(id);
        return (
          <li key={id} className="flex items-center gap-2 rounded-xl border border-line bg-paper px-3 py-2">
            <input type="hidden" name={name} value={id} />
            {i && <KindBadge kind={i.kind as Kind} />}
            <span className="flex-1 font-bold">{i?.title ?? id}</span>
            <button type="button" onClick={() => onRemove(id)} className="text-sm font-bold text-coral-dark">Remove</button>
          </li>
        );
      })}
    </ul>
  );
}
