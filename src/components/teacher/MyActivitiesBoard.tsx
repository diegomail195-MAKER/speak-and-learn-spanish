"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition, type DragEvent, type ReactNode } from "react";
import { PREVIEW_BG, TemplatePreview } from "@/components/editor/TemplatePreview";
import { Button, ButtonLink } from "@/components/ui/Button";
import { duplicateGame } from "@/lib/actions/games";
import { createFolder, deleteFolder, emptyBin, moveFolder, moveGame, restoreGame, trashGame, updateFolder } from "@/lib/actions/folders";
import { FOLDER_COLORS, folderColor, folderColorKey } from "@/lib/folders";
import type { FolderSaveResult } from "@/lib/actions/folders";
import { useFolderStrings, type FolderStrings } from "./folderStrings";

export type BoardFolder = { id: string; name: string; color: string; count: number; subfolders: number; updatedAt: string };
export type BoardActivity = {
  id: string;
  title: string;
  templateKey: string;
  template: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  items: number;
  assignments: number;
  thumb: string | null;
  updatedAt: string;
  lastPlayed: string | null;
  folderName: string | null;
  folderColor: string | null;
};
export type BoardSort = { by: "name" | "modified" | "played"; dir: "asc" | "desc" };

type Props = {
  folder: { id: string; name: string; color: string; parentId: string | null } | null;
  path: Array<{ id: string; name: string; color: string }>;
  folders: BoardFolder[];
  activities: BoardActivity[];
  tree: FolderTree;
  sort: BoardSort;
  view: "large" | "small";
  q: string;
  bin: boolean;
};

type FolderTree = Array<{ id: string; name: string; color: string; depth: number }>;
type Drag = { kind: "game" | "folder"; id: string };
const DRAG_TYPE = "application/x-lextro-item";

/** Builds a My Activities URL that keeps the current view settings. */
function href(p: Record<string, string | null | undefined>) {
  const u = new URLSearchParams();
  for (const [k, v] of Object.entries(p)) if (v) u.set(k, v);
  const s = u.toString();
  return `/teacher/my-activities${s ? `?${s}` : ""}`;
}

export function MyActivitiesBoard({ folder, path, folders, activities, tree, sort, view, q, bin }: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  const [hidden, setHidden] = useState<Set<string>>(() => new Set());
  const [over, setOver] = useState<string | null>(null);
  const [dialog, setDialog] = useState<null | { mode: "new" } | { mode: "edit"; folder: BoardFolder }>(null);
  const drag = useRef<Drag | null>(null);
  const t = useFolderStrings();

  const keep = { folder: folder?.id, sort: sort.by === "modified" && sort.dir === "desc" ? null : sort.by, dir: sort.by === "modified" && sort.dir === "desc" ? null : sort.dir, view: view === "small" ? "small" : null };

  /** Runs a server action, hides the moved item right away, and refreshes the page. */
  function run(fn: () => Promise<unknown>, hide?: string) {
    setError("");
    if (hide) setHidden((h) => new Set(h).add(hide));
    start(async () => {
      try {
        await fn();
      } catch (e) {
        setError((e as Error).message || "Something went wrong. Try again.");
        if (hide) setHidden((h) => { const n = new Set(h); n.delete(hide); return n; });
      }
      router.refresh();
    });
  }

  function moveTo(item: Drag, target: string | null) {
    if (item.kind === "folder" && item.id === target) return;
    if (item.kind === "game") run(() => moveGame({ gameId: item.id, folderId: target }), item.id);
    else run(() => moveFolder({ id: item.id, parentId: target }), item.id);
  }

  // Drag and drop: activities and folders can be dropped on a folder (or on "up" to leave it).
  const dragProps = (item: Drag) => ({
    draggable: !bin,
    onDragStart: (e: DragEvent) => {
      drag.current = item;
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData(DRAG_TYPE, JSON.stringify(item));
    },
    onDragEnd: () => {
      drag.current = null;
      setOver(null);
    },
  });
  const dropProps = (target: string | null) => {
    const key = target ?? "__root";
    return {
      onDragOver: (e: DragEvent) => {
        const d = drag.current;
        if (!d || (d.kind === "folder" && d.id === target)) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        if (over !== key) setOver(key);
      },
      onDragLeave: () => setOver((o) => (o === key ? null : o)),
      onDrop: (e: DragEvent) => {
        e.preventDefault();
        setOver(null);
        let d = drag.current;
        try {
          d = d ?? (JSON.parse(e.dataTransfer.getData(DRAG_TYPE)) as Drag);
        } catch {}
        drag.current = null;
        if (d) moveTo(d, target);
      },
      "data-over": over === key ? "" : undefined,
    };
  };

  const shownFolders = folders.filter((f) => !hidden.has(f.id));
  const shownActivities = activities.filter((a) => !hidden.has(a.id));
  const empty = shownFolders.length === 0 && shownActivities.length === 0;
  const grid = view === "small" ? "grid-cols-2 sm:grid-cols-4 lg:grid-cols-6" : "grid-cols-1 sm:grid-cols-3 lg:grid-cols-5";

  return (
    <div className={pending ? "cursor-progress" : undefined}>
      {/* Header: title or breadcrumb, folder / bin buttons, search, view */}
      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl2 border border-line bg-card px-5 py-4 shadow-soft">
        <div className="min-w-0 flex-1">
          {bin ? (
            <>
              <Link href={href({ ...keep, folder: null })} className="text-sm font-bold text-muted hover:text-ink">My Activities ›</Link>
              <h1 className="flex items-center gap-2 font-display text-3xl font-semibold"><TrashIcon className="h-7 w-7" /> Recycle Bin</h1>
            </>
          ) : path.length ? (
            <>
              <nav aria-label="Folder path" className="flex flex-wrap items-center gap-1 text-sm font-bold text-muted">
                <Link href={href({ ...keep, folder: null })} className="hover:text-ink" {...dropProps(null)}>My Activities</Link>
                {path.slice(0, -1).map((p) => (
                  <span key={p.id} className="flex items-center gap-1">
                    <span aria-hidden>›</span>
                    <Link href={href({ ...keep, folder: p.id })} className="hover:text-ink" {...dropProps(p.id)}>{p.name}</Link>
                  </span>
                ))}
                <span aria-hidden>›</span>
              </nav>
              <h1 className="flex items-center gap-2 font-display text-3xl font-semibold">
                <FolderGlyph color={folder!.color} /> {folder!.name}
              </h1>
            </>
          ) : (
            <h1 className="whitespace-nowrap font-display text-3xl font-semibold">{q ? `Results for “${q}”` : "My Activities"}</h1>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {!bin && <Button size="sm" variant="secondary" onClick={() => setDialog({ mode: "new" })}>{t.newFolderButton}</Button>}
          {!bin && <ButtonLink size="sm" variant="secondary" href={href({ bin: "1", view: keep.view })}><TrashIcon className="h-4 w-4" /> Recycle Bin</ButtonLink>}
          <form action="/teacher/my-activities" className="flex">
            {keep.view && <input type="hidden" name="view" value={keep.view} />}
            <input name="q" defaultValue={q} placeholder="Search my activities…" aria-label="Search my activities" className="h-9 w-48 rounded-l-full border border-line bg-card px-4 text-sm sm:w-56" />
            <button className="h-9 rounded-r-full border border-l-0 border-line bg-paper-2 px-3 text-sm font-bold" aria-label="Search">⌕</button>
          </form>
          <div className="flex overflow-hidden rounded-full border border-line text-sm" role="group" aria-label="View">
            <Link href={href({ ...keep, view: null, bin: bin ? "1" : null, q: q || null })} aria-label="Large tiles" aria-current={view === "large" ? "true" : undefined} className={`px-3 py-1.5 ${view === "large" ? "bg-ink text-white" : "bg-card hover:bg-paper-2"}`}>▦</Link>
            <Link href={href({ ...keep, view: "small", bin: bin ? "1" : null, q: q || null })} aria-label="Small tiles" aria-current={view === "small" ? "true" : undefined} className={`px-3 py-1.5 ${view === "small" ? "bg-ink text-white" : "bg-card hover:bg-paper-2"}`}>⋮⋮⋮</Link>
          </div>
        </div>
      </div>

      <div className="rounded-xl2 border border-line bg-card px-5 py-4">
        <div className="mb-4 flex flex-wrap items-center justify-end gap-x-4 gap-y-2 text-sm">
          {bin && shownActivities.length > 0 && (
            <Button size="sm" variant="danger" className="mr-auto" onClick={() => window.confirm(`Delete ${shownActivities.length} activities forever, with their student results? This can't be undone.`) && run(() => emptyBin())}>
              Empty Recycle Bin
            </Button>
          )}
          {bin && <p className="mr-auto text-muted">Activities in the bin are hidden from students. Restore them any time.</p>}
          <span className="text-muted">Order by:</span>
          {(["name", "modified", "played"] as const).map((by) => {
            const active = sort.by === by;
            const dir = active ? (sort.dir === "asc" ? "desc" : "asc") : by === "name" ? "asc" : "desc";
            return (
              <Link
                key={by}
                href={href({ ...keep, sort: by === "modified" && dir === "desc" ? null : by, dir: by === "modified" && dir === "desc" ? null : dir, bin: bin ? "1" : null, q: q || null })}
                className={`inline-flex items-center gap-1 ${active ? "font-bold text-ink" : "text-ink-2 hover:text-ink"}`}
                aria-current={active ? "true" : undefined}
              >
                {by === "name" ? "Name" : by === "modified" ? "Modified" : "Last played"}
                <span aria-hidden className={active ? "" : "opacity-30"}>{active && sort.dir === "desc" ? "▼" : "▲"}</span>
              </Link>
            );
          })}
        </div>

        {error && <p role="alert" className="mb-3 rounded-xl bg-coral-soft px-4 py-2 text-sm font-semibold text-coral-dark">{error}</p>}

        {empty && !folder ? (
          <div className="grid place-items-center gap-3 py-14 text-center">
            <p className="font-display text-xl font-semibold">{bin ? "The Recycle Bin is empty" : q ? "No activities match your search" : "You haven't created any activities yet"}</p>
            {!bin && !q && <p className="max-w-md text-sm text-muted">Every activity you create is saved here. Make folders to organise them, then drag activities into the folders.</p>}
            {!bin && !q && <ButtonLink href="/teacher/games/new">+ Create Activity</ButtonLink>}
          </div>
        ) : (folder || shownFolders.length > 0) && (
          <ul className={`grid gap-4 ${grid}`}>
            {folder && (
              <li>
                <Link href={href({ ...keep, folder: folder.parentId })} aria-label="Up one folder" className="block" {...dropProps(folder.parentId)}>
                  <FolderShape color={folder.color} small={view === "small"}>
                    <span className="grid h-full place-items-center text-4xl text-ink/50" aria-hidden>↑</span>
                  </FolderShape>
                </Link>
              </li>
            )}
            {shownFolders.map((f) => (
              <li key={f.id} {...dragProps({ kind: "folder", id: f.id })} data-testid="folder">
                <div className="relative" {...dropProps(f.id)}>
                  <Link href={href({ ...keep, folder: f.id })} className="block">
                    <FolderShape color={f.color} small={view === "small"}>
                      <span className="line-clamp-2 break-words pr-12 font-display text-lg font-semibold uppercase leading-tight">{f.name}</span>
                      <span className="block text-xs opacity-85">
                        {f.count} {f.count === 1 ? "activity" : "activities"}
                        {f.subfolders ? ` · ${f.subfolders} ${f.subfolders === 1 ? "folder" : "folders"}` : ""}
                      </span>
                    </FolderShape>
                  </Link>
                  <div className="absolute bottom-2 right-2">
                  <Menu label={t.options(f.name)} glyph="⋯" size="lg" testId="folder-menu">
                    {(close) => (
                      <>
                        <MenuItem onClick={() => (close(), setDialog({ mode: "edit", folder: f }))}>{t.editFolder}</MenuItem>
                        <MoveMenu tree={tree} exclude={f.id} current={folder?.id ?? null} onPick={(t) => (close(), moveTo({ kind: "folder", id: f.id }, t))} />
                        <MenuItem danger onClick={() => { close(); if (window.confirm(`Delete the folder “${f.name}”? Its activities and folders move to ${folder ? `“${folder.name}”` : "My Activities"}.`)) run(() => deleteFolder({ id: f.id }), f.id); }}>
                          {t.deleteFolder}
                        </MenuItem>
                      </>
                    )}
                  </Menu>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
        {!(empty && !folder) && shownActivities.length > 0 && (folder || shownFolders.length > 0) && <div className="h-4" />}
        {!(empty && !folder) && (
          <ul className={`grid gap-4 ${grid}`}>
            {shownActivities.map((a) => (
              <li key={a.id} {...dragProps({ kind: "game", id: a.id })} data-testid="activity" className="flex flex-col rounded-xl border border-line bg-card shadow-soft transition-shadow hover:shadow-md">
                <Link href={bin ? "#" : openHref(a)} data-testid="activity-open" className={`relative block ${view === "small" ? "aspect-[4/3]" : "aspect-[16/11]"} overflow-hidden rounded-t-xl`} style={{ background: PREVIEW_BG[a.templateKey] ?? "#fff1de" }} tabIndex={bin ? -1 : undefined} aria-hidden={bin || undefined} draggable={false}>
                  {a.thumb ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={a.thumb} alt="" className="h-full w-full object-contain p-2" draggable={false} loading="lazy" />
                  ) : (
                    <div className="h-full w-full p-3 [&_svg]:h-full [&_svg]:w-full"><TemplatePreview k={a.templateKey} /></div>
                  )}
                  {a.status === "PUBLISHED" && <span className="absolute left-2 top-2 rounded-full bg-leaf px-2 py-0.5 text-[11px] font-bold text-white">Published</span>}
                  {a.status === "DRAFT" && <span className="absolute left-2 top-2 rounded-full bg-card/90 px-2 py-0.5 text-[11px] font-bold text-ink-2">Draft</span>}
                  {a.assignments > 0 && (
                    <span data-testid="assigned-badge" className="absolute right-2 top-2 rounded-full bg-teal px-2 py-0.5 text-[11px] font-bold text-white" title={`Assigned ${a.assignments} time${a.assignments === 1 ? "" : "s"}`}>
                      ✓ Assigned{a.assignments > 1 ? ` ×${a.assignments}` : ""}
                    </span>
                  )}
                </Link>
                <div className="flex flex-1 items-start gap-2 border-t border-line px-3 py-2.5">
                  <div className="min-w-0 flex-1">
                    {bin ? (
                      <span className="block truncate font-display font-semibold">{a.title || "Untitled activity"}</span>
                    ) : (
                      <Link href={openHref(a)} className="block truncate font-display font-semibold hover:text-coral" draggable={false}>{a.title || "Untitled activity"}</Link>
                    )}
                    <span className="block truncate text-xs text-muted">{a.template}{view === "large" ? ` · ${a.items} ${a.items === 1 ? "card" : "cards"}` : ""}</span>
                    {a.folderName && <span className="flex min-w-0 items-center gap-1 text-xs text-muted"><FolderGlyph color={a.folderColor} size="xs" /><span className="truncate">{a.folderName}</span></span>}
                  </div>
                  <Menu label={`Options for ${a.title || "Untitled activity"}`}>
                    {(close) =>
                      bin ? (
                        <>
                          <MenuItem onClick={() => (close(), run(() => restoreGame({ gameId: a.id }), a.id))}>Restore</MenuItem>
                        </>
                      ) : (
                        <>
                          <MenuLink href={`/teacher/games/${a.id}/edit`}>Edit</MenuLink>
                          <MenuLink href={`/play/preview/${a.id}`}>Play</MenuLink>
                          {a.status === "PUBLISHED" ? (
                            <MenuLink href={`/teacher/assignments/new?gameId=${a.id}`}>Assign</MenuLink>
                          ) : (
                            <MenuLink href={`/teacher/games/${a.id}/edit`} hint="Publish it in the editor to assign it">Assign…</MenuLink>
                          )}
                          <form action={duplicateGame}>
                            <input type="hidden" name="gameId" value={a.id} />
                            <MenuItem type="submit">Duplicate</MenuItem>
                          </form>
                          <MoveMenu tree={tree} current={q ? "" : folder?.id ?? null} onPick={(t) => (close(), moveTo({ kind: "game", id: a.id }, t))} />
                          <MenuItem danger onClick={() => (close(), run(() => trashGame({ gameId: a.id }), a.id))}>Move to Recycle Bin</MenuItem>
                        </>
                      )
                    }
                  </Menu>
                </div>
              </li>
            ))}
            {folder && shownFolders.length === 0 && shownActivities.length === 0 && (
              <li className="col-span-full grid place-items-center rounded-xl border-2 border-dashed border-line p-8 text-center text-sm text-muted">
                This folder is empty. Drag activities here, or use “Move to…” in an activity’s ⋮ menu.
              </li>
            )}
          </ul>
        )}
        {!bin && !empty && <p className="mt-4 text-xs text-muted">Tip: drag an activity onto a folder to move it. On a tablet, use ⋮ › Move to…</p>}
      </div>

      {dialog && (
        <FolderDialog
          key={dialog.mode === "edit" ? dialog.folder.id : "new"}
          t={t}
          mode={dialog.mode}
          initial={dialog.mode === "edit" ? dialog.folder : undefined}
          onClose={() => setDialog(null)}
          onSave={async (name, color) => {
            const d = dialog;
            const res = d.mode === "new" ? await createFolder({ name, color, parentId: folder?.id ?? null }) : await updateFolder({ id: d.folder.id, name, color });
            if (res.ok) {
              setDialog(null);
              router.refresh();
            }
            return res;
          }}
        />
      )}
    </div>
  );
}

/* ---------- pieces ---------- */

/** Folder tile: a solid tab and body in the folder's colour, with text in a colour that reads on it. */
function FolderShape({ color, small, children }: { color: string; small?: boolean; children: ReactNode }) {
  const c = folderColor(color);
  return (
    <div data-folder-color={c.key} className="group relative pt-3 transition-transform motion-safe:hover:-translate-y-0.5 [[data-over]_&]:scale-105 [[data-over]_&]:drop-shadow-lg">
      <span className="absolute left-0 top-0 h-5 w-2/5 rounded-t-lg" style={{ background: `color-mix(in srgb, ${c.hex} 80%, black)` }} aria-hidden />
      <div className={`relative rounded-b-xl rounded-tr-xl px-4 py-3 ${small ? "h-24" : "h-28"} [[data-over]_&]:ring-4 [[data-over]_&]:ring-ink/60`} style={{ background: c.hex, color: c.on }}>
        {children}
      </div>
    </div>
  );
}

/** Small folder icon in the folder's colour (title, preview, Move to…, search results). */
function FolderGlyph({ color, size = "md" }: { color: string | null | undefined; size?: "xs" | "md" | "lg" }) {
  const c = folderColor(color);
  const cls = size === "xs" ? "h-3.5 w-4 shrink-0" : size === "lg" ? "h-12 w-16 shrink-0" : "h-7 w-9 shrink-0";
  return (
    <svg viewBox="0 0 32 24" className={cls} aria-hidden data-folder-color={c.key}>
      <path d="M2 4a2 2 0 0 1 2-2h8l3 3h13a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2z" fill={c.hex} />
      <path d="M2 8h28" stroke={`color-mix(in srgb, ${c.hex} 75%, black)`} strokeWidth="1.5" />
    </svg>
  );
}

function TrashIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
      <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6" />
    </svg>
  );
}

function Menu({ label, className = "", glyph = "⋮", size = "md", testId, children }: { label: string; className?: string; glyph?: string; size?: "md" | "lg"; testId?: string; children: (close: () => void) => ReactNode }) {
  const [open, setOpen] = useState(false);
  // Opens upwards when there isn't room below (cards at the bottom of the screen).
  const [up, setUp] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", away);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", away);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);
  return (
    <div ref={ref} className={`relative ${className}`}>
      <button type="button" aria-label={label} title={label} data-testid={testId} aria-haspopup="menu" aria-expanded={open} onClick={(e) => {
          e.preventDefault();
          const r = ref.current?.getBoundingClientRect();
          setUp(!!r && window.innerHeight - r.bottom < 340 && r.top > window.innerHeight - r.bottom);
          setOpen((o) => !o);
        }} className={`grid place-items-center rounded-lg border border-ink/15 bg-card/90 font-bold leading-none text-ink hover:bg-card ${size === "lg" ? "h-11 w-11 text-xl" : "h-9 w-9 text-lg"}`}>
        {glyph}
      </button>
      {open && (
        <div role="menu" className={`absolute right-0 z-40 w-60 rounded-xl border border-line bg-card p-1.5 text-sm shadow-soft ${up ? "bottom-full mb-1" : "top-full mt-1"}`}>
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

function MenuItem({ danger, className = "", ...props }: React.ComponentProps<"button"> & { danger?: boolean }) {
  return <button type="button" role="menuitem" className={`block w-full rounded-lg px-3 py-2 text-left font-semibold ${danger ? "text-coral-dark hover:bg-coral-soft" : "hover:bg-paper-2"} ${className}`} {...props} />;
}

/** Clicking an activity plays it; an activity with nothing in it yet opens the editor. */
const openHref = (a: { id: string; items: number }) => (a.items > 0 ? `/play/preview/${a.id}` : `/teacher/games/${a.id}/edit`);

function MenuLink({ href: to, hint, children }: { href: string; hint?: string; children: ReactNode }) {
  return (
    <Link href={to} role="menuitem" title={hint} className="block rounded-lg px-3 py-2 font-semibold hover:bg-paper-2">
      {children}
      {hint && <span className="block text-xs font-normal text-muted">{hint}</span>}
    </Link>
  );
}

function MoveMenu({ tree, current, exclude, onPick }: { tree: FolderTree; current: string | null; exclude?: string; onPick: (folderId: string | null) => void }) {
  const [open, setOpen] = useState(false);
  // A folder can't move into itself or its subfolders.
  const hide = new Set<string>();
  if (exclude) {
    let inside = false;
    let depth = 0;
    for (const f of tree) {
      if (f.id === exclude) {
        inside = true;
        depth = f.depth;
        hide.add(f.id);
      } else if (inside && f.depth > depth) hide.add(f.id);
      else inside = false;
    }
  }
  return (
    <>
      <MenuItem aria-expanded={open} onClick={() => setOpen((o) => !o)}>Move to… {open ? "▴" : "▾"}</MenuItem>
      {open && (
        <div className="max-h-56 overflow-y-auto border-y border-line py-1">
          {current !== null && <MenuItem onClick={() => onPick(null)}>My Activities (top)</MenuItem>}
          {tree.filter((f) => !hide.has(f.id) && f.id !== current).map((f) => (
            <MenuItem key={f.id} onClick={() => onPick(f.id)} style={{ paddingLeft: 12 + f.depth * 14 }}><span className="flex min-w-0 items-center gap-2"><FolderGlyph color={f.color} size="xs" /><span className="min-w-0 truncate">{f.name}</span></span></MenuItem>
          ))}
          {tree.length === 0 && <p className="px-3 py-2 text-xs text-muted">No folders yet. Use “+ New folder”.</p>}
        </div>
      )}
    </>
  );
}

/**
 * New folder / Edit folder. The dialog stays open while saving and after an error, so nothing the
 * teacher typed or picked is lost; the button is disabled while a save is running (no double
 * submit). Old folders with no valid colour open with the default colour selected.
 */
function FolderDialog({
  t,
  mode,
  initial,
  onClose,
  onSave,
}: {
  t: FolderStrings;
  mode: "new" | "edit";
  initial?: { name: string; color: string };
  onClose: () => void;
  onSave: (name: string, color: string) => Promise<FolderSaveResult>;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [color, setColor] = useState<string>(folderColorKey(initial?.color));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [nameError, setNameError] = useState("");
  const busy = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const title = mode === "new" ? t.newFolder : t.editFolder;
  const c = folderColor(color);

  // Esc closes (not while saving); Tab stays inside the dialog; focus goes back where it was.
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const savingRef = useRef(saving);
  savingRef.current = saving;
  useEffect(() => {
    const before = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !savingRef.current) closeRef.current();
      if (e.key !== "Tab" || !formRef.current) return;
      const els = Array.from(formRef.current.querySelectorAll<HTMLElement>("input:not([disabled]):not([type=radio]), input[type=radio]:checked, button:not([disabled])"));
      if (!els.length) return;
      const first = els[0];
      const last = els[els.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      before?.focus?.({ preventScroll: true });
    };
  }, []);

  async function submit() {
    if (busy.current) return;
    const n = name.trim();
    if (!n) {
      setNameError(t.nameRequired);
      nameRef.current?.focus();
      return;
    }
    busy.current = true;
    setSaving(true);
    setError("");
    setNameError("");
    try {
      const res = await onSave(n, color);
      if (!res.ok) {
        if (res.code === "name") {
          setNameError(n.length > 60 ? t.nameTooLong : t.nameRequired);
          nameRef.current?.focus();
        } else setError(res.code === "not_found" ? t.notFound : res.code === "color" ? t.badColour : t.failed);
      }
    } catch {
      setError(t.failed);
    } finally {
      busy.current = false;
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-ink/40 p-4" onMouseDown={(e) => e.target === e.currentTarget && !saving && onClose()}>
      <form
        ref={formRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="folder-dialog-title"
        aria-busy={saving || undefined}
        data-testid="folder-dialog"
        noValidate
        className="w-full max-w-md rounded-xl2 border border-line bg-card p-6 text-ink shadow-menu"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <h2 id="folder-dialog-title" className="font-display text-xl font-semibold">{title}</h2>

        <label className="mt-4 block text-sm font-bold" htmlFor="folder-name">{t.name}</label>
        <input
          ref={nameRef}
          id="folder-name"
          autoFocus
          maxLength={60}
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (nameError && e.target.value.trim()) setNameError("");
          }}
          placeholder={t.namePlaceholder}
          aria-invalid={nameError ? true : undefined}
          aria-describedby={nameError ? "folder-name-error" : undefined}
          className={`mt-2 h-11 w-full rounded-ctl border bg-card px-3 text-ink placeholder:text-muted ${nameError ? "border-coral" : "border-line focus:border-primary"}`}
        />
        {nameError && <p id="folder-name-error" className="mt-1 text-sm font-semibold text-coral-dark">{nameError}</p>}

        <fieldset className="mt-4">
          <legend className="text-sm font-bold">
            {t.colour}: <span className="font-semibold text-muted">{t.colourName(c)}</span>
          </legend>
          <div className="mt-2 flex flex-wrap gap-1">
            {FOLDER_COLORS.map((o) => {
              const label = t.colourName(o);
              const on = color === o.key;
              return (
                <label key={o.key} className="group relative grid h-11 w-11 cursor-pointer place-items-center rounded-full" data-testid={`swatch-${o.key}`}>
                  <input type="radio" name="folder-color" value={o.key} checked={on} onChange={() => setColor(o.key)} className="peer sr-only" aria-label={label} />
                  <span
                    aria-hidden
                    className="grid h-9 w-9 place-items-center rounded-full inset-ring inset-ring-ink/15 outline-offset-2 transition-transform peer-checked:outline-2 peer-checked:outline-ink peer-checked:outline-solid peer-focus-visible:ring-[3px] peer-focus-visible:ring-primary peer-focus-visible:ring-offset-[5px] peer-focus-visible:ring-offset-card motion-safe:group-hover:scale-105"
                    style={{ background: o.hex }}
                  >
                    {on && (
                      <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke={o.on} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4.5 10.5l3.5 3.5 7.5-8" />
                      </svg>
                    )}
                  </span>
                  <span aria-hidden className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 -translate-x-1/2 whitespace-nowrap rounded-md bg-ink px-2 py-1 text-xs font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100 peer-focus-visible:opacity-100">
                    {label}
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>

        <div className="mt-4">
          <p className="text-sm font-bold">{t.preview}</p>
          <div className="mt-2 flex min-w-0 items-center gap-4 rounded-xl border border-line bg-paper px-4 py-3" data-testid="folder-preview" data-folder-color={c.key}>
            <FolderGlyph color={color} size="lg" />
            <span className={`min-w-0 break-words font-display text-lg font-semibold uppercase leading-tight ${name.trim() ? "text-ink" : "text-muted"}`}>{name.trim() || t.previewEmpty}</span>
          </div>
        </div>

        {error && (
          <p role="alert" className="mt-4 rounded-ctl bg-coral-soft px-3 py-2 text-sm font-semibold text-coral-dark">
            {error}
          </p>
        )}

        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={saving}>{t.cancel}</Button>
          <Button type="submit" disabled={saving} aria-disabled={saving || undefined}>
            {saving ? (mode === "new" ? t.creating : t.saving) : mode === "new" ? t.create : t.save}
          </Button>
        </div>
      </form>
    </div>
  );
}
