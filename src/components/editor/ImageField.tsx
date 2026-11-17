"use client";

import { useEffect, useRef, useState } from "react";
import { useUi } from "./i18n";
import { ImageEditor, type EditStep } from "./ImageEditor";

type Asset = { id: string; url: string; name: string };
type WebResult = { id: string; thumb: string; tags: string; author: string; pageUrl: string; width: number; height: number; license: string };

/**
 * An edited picture remembers its original and its edits, so reopening it can still Undo them.
 * Uploaded originals are kept by id in this browser; a file from the device only for this visit.
 */
type Origin = { origId?: string; file?: File; src?: string; history: EditStep[] };
const localOrigins = new Map<string, Origin>();
const ORIGIN_KEY = "lextro-image-origin:";
function readOrigin(id: string | null | undefined): Origin | null {
  if (!id) return null;
  if (localOrigins.has(id)) return localOrigins.get(id)!;
  try {
    const v = JSON.parse(localStorage.getItem(ORIGIN_KEY + id) ?? "null");
    return v?.origId && Array.isArray(v.history) ? v : null;
  } catch {
    return null;
  }
}
function saveOrigin(id: string, o: Origin) {
  if (o.file) return void localOrigins.set(id, o);
  try {
    localStorage.setItem(ORIGIN_KEY + id, JSON.stringify({ origId: o.origId, history: o.history }));
  } catch {
    /* storage off: Undo then works only until the editor closes */
  }
}

export const mediaSrc = (id: string | null | undefined) => (id ? `/api/media/${id}` : null);

export async function uploadBlob(blob: Blob, name: string): Promise<Asset> {
  const fd = new FormData();
  fd.append("file", new File([blob], name, { type: blob.type }));
  const res = await fetch("/api/media", { method: "POST", body: fd });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || `Upload failed (${res.status})`);
  return json;
}

/**
 * One picture field: "Add image" opens a panel with "Search the internet" and "Upload image".
 * A chosen picture can be cropped, rotated, flipped, replaced or removed, and has alt text.
 * Thumbnails load lazily so long lists stay fast.
 */
export function ImageField({
  assetId,
  alt,
  onChange,
  onAlt,
  suggest,
  compact = false,
  inline = false,
  label,
  onSearch,
}: {
  /** Flashcards: "Search the internet" (and Replace) open the card's photo form instead of the panel. */
  onSearch?: () => void;
  assetId: string | null | undefined;
  alt?: string;
  onChange: (a: { id: string; url: string } | null) => void;
  onAlt?: (alt: string) => void;
  suggest?: string;
  compact?: boolean;
  /** Icon-sized, to sit inside a one-line field. */
  inline?: boolean;
  label?: string;
}) {
  const { t } = useUi();
  const [panel, setPanel] = useState<false | "search" | "upload">(false);
  const [editing, setEditing] = useState<{ src: string; name: string; local: boolean; file?: File; origin?: Origin | null } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const src = mediaSrc(assetId);

  /** Opens the editor on a saved picture: on its original, with its edits, when it was edited here. */
  function openEditor(id: string, url: string) {
    const o = readOrigin(id);
    if (o?.file) return setEditing({ src: o.src!, name: o.file.name, local: false, file: o.file, origin: o });
    if (o?.origId) return setEditing({ src: mediaSrc(o.origId)!, name: "image.webp", local: false, origin: o });
    setEditing({ src: url, name: "image.webp", local: false });
  }

  async function applyEdited(blob: Blob | null, name: string, history?: EditStep[]) {
    // blob null = unchanged local file (or back to a device original): upload the original bytes
    if (!editing) return;
    setBusy(true);
    setError("");
    try {
      let b = blob;
      if (!b) b = editing.file ?? (await (await fetch(editing.src)).blob());
      const a = await uploadBlob(b, name);
      if (blob && history) {
        const root = editing.origin ?? (editing.local ? { file: editing.file, src: editing.src } : { origId: assetId ?? undefined });
        saveOrigin(a.id, { origId: root.origId, file: root.file, src: root.src, history });
      }
      onChange({ id: a.id, url: a.url });
      setEditing(null);
      setPanel(false);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={compact ? "" : "w-full"}>
      {src && compact ? (
        <button
          type="button"
          onClick={() => openEditor(assetId!, src)}
          className={`shrink-0 overflow-hidden rounded-lg border border-line bg-card ${inline ? "h-8 w-8" : "h-14 w-14"}`}
          title={t.edit}
          aria-label={`${t.edit}: ${label ?? t.addImage}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={alt ?? ""} loading="lazy" decoding="async" className="h-full w-full object-contain" />
        </button>
      ) : src ? (
        <div className="flex items-start gap-2">
          <button
            type="button"
            onClick={() => openEditor(assetId!, src)}
            className={`shrink-0 overflow-hidden rounded-lg border border-line bg-paper ${compact ? "h-14 w-14" : "h-28 w-36"}`}
            title={t.edit}
            aria-label={`${t.edit}: ${label ?? t.addImage}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt={alt ?? ""} loading="lazy" decoding="async" className="h-full w-full object-contain" />
          </button>
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap gap-1 text-[11px] font-bold">
              <button type="button" onClick={() => openEditor(assetId!, src)} className="rounded-full bg-paper-2 px-2 py-0.5 text-ink-2 hover:bg-line">{t.edit}</button>
              <button type="button" onClick={() => setPanel("search")} className="rounded-full bg-paper-2 px-2 py-0.5 text-ink-2 hover:bg-line">{t.replace}</button>
              <button type="button" onClick={() => onChange(null)} className="rounded-full px-2 py-0.5 text-muted hover:text-coral-dark">{t.remove}</button>
            </div>
            {onAlt && (
              <input
                value={alt ?? ""}
                onChange={(e) => onAlt(e.target.value)}
                maxLength={200}
                placeholder={t.altText}
                title={t.altHint}
                aria-label={`${t.altText}${label ? ` (${label})` : ""}`}
                className="h-7 w-full rounded-md border border-line bg-card px-2 text-xs"
              />
            )}
          </div>
        </div>
      ) : inline ? (
        <span className="flex">
        <button
          type="button"
          onClick={() => (onSearch ? onSearch() : setPanel("search"))}
          className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-paper-2 hover:text-sky"
          aria-label={`${t.searchWeb}${label ? ` (${label})` : ""}`}
          title={t.searchWeb}
        >
          <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="10.5" cy="10.5" r="6" /><path d="m15 15 5 5" /></svg>
        </button>
        <button
          type="button"
          onClick={() => setPanel("upload")}
          className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-paper-2 hover:text-sky"
          aria-label={`${t.addImage}${label ? ` (${label})` : ""}`}
          title={t.uploadImage}
        >
          <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="16" rx="2.5" /><circle cx="9" cy="10" r="1.8" /><path d="m4 18 5-5 4 4 3-3 4 4" /></svg>
        </button>
        </span>
      ) : (
        <button
          type="button"
          onClick={() => setPanel("search")}
          className={`grid place-items-center rounded-lg border-2 border-dashed border-line bg-paper text-center text-xs font-bold text-ink-2 hover:border-sky hover:text-sky ${compact ? "h-14 w-14" : "h-28 w-36"}`}
          aria-label={`${t.addImage}${label ? ` (${label})` : ""}`}
          title={t.addImage}
        >
          <span>
            <span aria-hidden className="block text-lg leading-none">🖼</span>
            {!compact && t.addImage}
          </span>
        </button>
      )}
      {error && <p className="mt-1 text-xs font-semibold text-coral-dark">{error}</p>}
      {panel && (
        <AddImagePanel
          initialTab={panel}
          suggest={suggest}
          onClose={() => setPanel(false)}
          onPicked={(a) => {
            onChange(a);
            setPanel(false);
          }}
          onLocalFile={(f) => setEditing({ src: URL.createObjectURL(f), name: f.name, local: true, file: f })}
        />
      )}
      {editing && (
        <ImageEditor
          src={editing.src}
          initial={editing.origin?.history}
          busy={busy}
          error={error}
          onCancel={() => setEditing(null)}
          onRemove={editing.local ? undefined : () => (onChange(null), setEditing(null))}
          onReplace={editing.local ? undefined : () => (setEditing(null), onSearch ? onSearch() : setPanel("search"))}
          onApply={(blob, { history, reverted }) => {
            const o = editing.origin;
            // "Undo changes" then Apply: back to the original picture.
            if (reverted && o?.origId) return (onChange({ id: o.origId, url: mediaSrc(o.origId)! }), setEditing(null));
            if (!blob && !editing.local && !(reverted && o?.file)) return setEditing(null); // nothing changed
            applyEdited(blob, blob ? editing.name.replace(/\.[^.]+$/, "") + ".webp" : editing.name, history);
          }}
        />
      )}
    </div>
  );
}

function AddImagePanel({ initialTab, suggest, onClose, onPicked, onLocalFile }: { initialTab: "search" | "upload"; suggest?: string; onClose: () => void; onPicked: (a: { id: string; url: string }) => void; onLocalFile: (f: File) => void }) {
  const { t } = useUi();
  const [tab, setTab] = useState<"search" | "upload" | "mine">(initialTab);
  const [mine, setMine] = useState<Array<{ id: string; url: string; name: string }> | null>(null);
  const [q, setQ] = useState((suggest ?? "").trim().slice(0, 100));
  const [size, setSize] = useState("all");
  const [results, setResults] = useState<WebResult[] | null>(null);
  const [state, setState] = useState<"idle" | "busy" | "off" | "error">("idle");
  const [error, setError] = useState("");
  const [importing, setImporting] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    // Is the provider configured? If not, show it clearly and open the upload tab.
    fetch("/api/images/search?status=1")
      .then((r) => r.json())
      .then((j) => {
        if (!j.enabled) {
          setState("off");
          setTab("upload");
        } else if (q && initialTab === "search") search(q, size);
      })
      .catch(() => undefined);
    dialogRef.current?.focus();
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function search(query: string, sz: string) {
    if (!query.trim()) return;
    setState("busy");
    setError("");
    try {
      const res = await fetch(`/api/images/search?${new URLSearchParams({ q: query, size: sz })}`);
      const json = await res.json();
      if (res.status === 503) return setState("off");
      if (!res.ok) throw new Error(json.error === "invalid_request" ? t.search : json.error);
      setResults(json.results);
      setState("idle");
    } catch (e) {
      setResults([]);
      setError((e as Error).message);
      setState("error");
    }
  }

  async function pick(r: WebResult) {
    setImporting(r.id);
    setError("");
    try {
      const res = await fetch("/api/images/import", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: r.id }) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      onPicked({ id: json.id, url: json.url });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setImporting(null);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-ink/40 p-3 sm:p-8" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label={t.addImage} className="flex max-h-full w-full max-w-3xl flex-col overflow-hidden rounded-[28px] bg-white shadow-[0_12px_40px_rgba(98,13,120,.18)] outline-none">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-3 border-b border-[#EADCF7] px-5 pb-4 pt-4 sm:px-6">
          <h2 className="font-display text-2xl font-extrabold text-[#620D78] sm:text-3xl">{t.addImage}</h2>
          <button type="button" onClick={onClose} className="ml-auto grid h-10 w-10 place-items-center rounded-full text-[#620D78] hover:bg-[#F3E8FF]" aria-label={t.close} title={t.close}>
            <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden><path d="M6 6l12 12M18 6 6 18" /></svg>
          </button>
          <div className="grid w-full grid-cols-3 gap-2 text-sm font-extrabold sm:text-base" role="tablist">
            {(["search", "upload", "mine"] as const).map((k) => (
              <button
                key={k}
                type="button"
                role="tab"
                aria-selected={tab === k}
                onClick={() => {
                  setTab(k);
                  // Images already uploaded to this school, newest first, so they can be reused.
                  if (k === "mine" && !mine) fetch("/api/media").then((r) => r.json()).then((j) => setMine(j.assets ?? [])).catch(() => setMine([]));
                }}
                className={`min-h-11 rounded-xl px-2 py-1.5 leading-tight ${tab === k ? "bg-[#620D78] text-white shadow-[0_3px_0_#3f0750]" : "bg-[#F1E6FC] text-[#620D78] hover:bg-[#E9D8FA]"}`}
              >
                {k === "search" ? t.searchWeb : k === "upload" ? t.uploadImage : t.myImages}
              </button>
            ))}
          </div>
        </div>
        {tab === "mine" ? (
          <div className="min-h-48 flex-1 overflow-y-auto p-4">
            {mine === null ? (
              <p className="p-4 text-center text-sm text-muted">…</p>
            ) : mine.length === 0 ? (
              <p className="p-4 text-center text-sm text-muted">{t.myImagesEmpty}</p>
            ) : (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
                {mine.map((a) => (
                  <button key={a.id} type="button" onClick={() => onPicked({ id: a.id, url: a.url })} className="relative aspect-square overflow-hidden rounded-lg border border-line bg-card hover:border-sky" title={a.name}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={a.url} alt={a.name} loading="lazy" className="h-full w-full object-contain" />
                    <span className="absolute inset-x-0 bottom-0 truncate bg-ink/60 px-1 text-[10px] text-white">{a.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : tab === "search" ? (
          <div className="flex min-h-0 flex-1 flex-col p-4">
            {state === "off" ? (
              <div className="rounded-xl bg-sun-soft p-4 text-sm text-[#7a5200]">
                <p>{t.searchOff}</p>
                <button type="button" onClick={() => setTab("upload")} className="mt-2 font-bold underline">{t.uploadImage}</button>
              </div>
            ) : (
              <>
                <form className="flex flex-wrap gap-2" onSubmit={(e) => (e.preventDefault(), search(q, size))}>
                  <span className="relative flex min-w-0 flex-1 items-center">
                    <span className="pointer-events-none absolute left-3 text-muted"><svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="10.5" cy="10.5" r="6" /><path d="m15 15 5 5" /></svg></span>
                    <input value={q} onChange={(e) => setQ(e.target.value)} maxLength={100} placeholder="manzana, perro, rojo…" aria-label={t.search} autoFocus className="h-10 w-full rounded-full border border-line pl-10 pr-4 text-sm focus:border-sky focus:outline-none" />
                  </span>
                  <select value={size} onChange={(e) => (setSize(e.target.value), q && search(q, e.target.value))} aria-label={t.size} className="h-10 rounded-full border border-line px-3 text-sm">
                    <option value="all">{t.sizeAll}</option>
                    <option value="small">{t.sizeSmall}</option>
                    <option value="medium">{t.sizeMedium}</option>
                    <option value="large">{t.sizeLarge}</option>
                  </select>
                  <button className="h-10 rounded-full bg-ink px-5 text-sm font-bold text-white disabled:opacity-50" disabled={state === "busy"}>{state === "busy" ? "…" : t.search}</button>
                </form>
                {error && <p className="mt-2 text-sm font-semibold text-coral-dark">{error}</p>}
                <div className="mt-3 min-h-40 flex-1 overflow-y-auto rounded-xl bg-paper-2 p-2">
                  {results && results.length === 0 && !error && <p className="p-4 text-center text-sm text-muted">{t.noResults}</p>}
                  {results && results.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
                      {results.map((r) => (
                        <button key={r.id} type="button" disabled={!!importing} onClick={() => pick(r)} className="group relative aspect-square overflow-hidden rounded-lg border border-line bg-card hover:border-sky disabled:opacity-60" title={`${r.tags} — ${r.author} (${r.license})`}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={r.thumb} alt={r.tags} loading="lazy" referrerPolicy="no-referrer" className="h-full w-full object-cover" />
                          {r.width > 0 && <span className="absolute bottom-0 right-0 rounded-tl bg-ink/70 px-1 text-[10px] text-white">{r.width}×{r.height}</span>}
                          {importing === r.id && <span className="absolute inset-0 grid place-items-center bg-card/70 text-xs font-bold">…</span>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <p className="mt-2 text-[11px] text-muted">
                  {t.safeNote}{" "}
                  <a href="https://pixabay.com/service/license-summary/" target="_blank" rel="noreferrer" className="underline">pixabay.com</a>
                </p>
              </>
            )}
          </div>
        ) : (
          <div
            className={`m-4 grid min-h-56 place-items-center rounded-[20px] border-2 p-6 text-center transition-colors sm:m-5 ${dragging ? "border-solid border-[#620D78] bg-[#EBDCFD]" : "border-dashed border-[#A43BE0] bg-[#F3E8FF]"}`}
            data-testid="upload-zone"
            data-dragging={dragging || undefined}
            onDragEnter={(e) => (e.preventDefault(), setDragging(true))}
            onDragOver={(e) => (e.preventDefault(), !dragging && setDragging(true))}
            onDragLeave={(e) => !e.currentTarget.contains(e.relatedTarget as Node) && setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              const f = e.dataTransfer.files[0];
              if (f) onLocalFile(f);
            }}
          >
            <div className="flex flex-col items-center">
              {state === "off" && <p className="mb-4 rounded-xl bg-sun-soft p-3 text-sm text-[#7a5200]">{t.searchOff}</p>}
              <PhotosIcon />
              {dragging ? (
                <p className="mt-4 text-xl font-extrabold text-[#620D78]">{t.dropImageHere}</p>
              ) : (
                <>
                  <button type="button" onClick={() => fileRef.current?.click()} className="mt-3 min-h-12 min-w-56 rounded-full bg-[#FFC928] px-8 text-lg font-extrabold text-[#620D78] shadow-[0_4px_0_#D9A20F] hover:brightness-105 active:translate-y-[2px] active:shadow-[0_2px_0_#D9A20F] sm:text-xl" data-testid="choose-file">
                    {t.chooseFile}
                  </button>
                  <p className="mt-3 font-bold text-[#620D78]">{t.dropHere}</p>
                </>
              )}
              <p className="mt-1 text-sm text-[#6b5a78]">PNG, JPEG, GIF, WebP · 4 MB</p>
              <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden" onChange={(e) => e.target.files?.[0] && onLocalFile(e.target.files[0])} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/** Two overlapping photos, drawn in 3D-style gradients (upload zone). */
function PhotosIcon() {
  return (
    <svg viewBox="0 0 160 120" width="150" height="112" aria-hidden className="drop-shadow-[0_10px_12px_rgba(98,13,120,.22)]">
      <defs>
        <linearGradient id="pi-back" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#C77DFF" /><stop offset="1" stopColor="#8B2FD6" /></linearGradient>
        <linearGradient id="pi-frame" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FFE07A" /><stop offset="1" stopColor="#FFB300" /></linearGradient>
        <linearGradient id="pi-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#D6B2FF" /><stop offset="1" stopColor="#B57BFF" /></linearGradient>
      </defs>
      <g transform="rotate(12 112 52)"><rect x="78" y="14" width="64" height="62" rx="12" fill="url(#pi-back)" /><rect x="86" y="22" width="48" height="46" rx="6" fill="#A855F7" opacity=".55" /></g>
      <g transform="rotate(-10 72 70)">
        <rect x="34" y="34" width="80" height="70" rx="14" fill="url(#pi-frame)" />
        <rect x="44" y="44" width="60" height="50" rx="6" fill="url(#pi-sky)" />
        <path d="M44 88 62 66l12 13 9-9 21 22v2H44z" fill="#F5ECFF" />
        <circle cx="90" cy="57" r="7" fill="#FFC928" />
      </g>
      <g stroke="#FFC928" strokeWidth="5" strokeLinecap="round"><path d="M30 30l-9-7M40 20l-3-11M24 44l-12-2" /></g>
    </svg>
  );
}
