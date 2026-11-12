"use client";

import { useEffect, useRef, useState } from "react";
import { useUi } from "./i18n";
import { ImageEditor } from "./ImageEditor";

type Asset = { id: string; url: string; name: string };
type WebResult = { id: string; thumb: string; tags: string; author: string; pageUrl: string; width: number; height: number; license: string };

export const mediaSrc = (id: string | null | undefined) => (id ? `/api/media/${id}` : null);

async function uploadBlob(blob: Blob, name: string): Promise<Asset> {
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
}: {
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
  const [panel, setPanel] = useState(false);
  const [editing, setEditing] = useState<{ src: string; name: string; local: boolean; file?: File } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const src = mediaSrc(assetId);

  async function applyEdited(blob: Blob | null, name: string) {
    // blob null = unchanged local file: upload the original bytes
    if (!editing) return;
    setBusy(true);
    setError("");
    try {
      let b = blob;
      if (!b) b = editing.file ?? (await (await fetch(editing.src)).blob());
      const a = await uploadBlob(b, name);
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
          onClick={() => setEditing({ src, name: "image.webp", local: false })}
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
            onClick={() => setEditing({ src, name: "image.webp", local: false })}
            className={`shrink-0 overflow-hidden rounded-lg border border-line bg-paper ${compact ? "h-14 w-14" : "h-28 w-36"}`}
            title={t.edit}
            aria-label={`${t.edit}: ${label ?? t.addImage}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt={alt ?? ""} loading="lazy" decoding="async" className="h-full w-full object-contain" />
          </button>
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap gap-1 text-[11px] font-bold">
              <button type="button" onClick={() => setEditing({ src, name: "image.webp", local: false })} className="rounded-full bg-paper-2 px-2 py-0.5 text-ink-2 hover:bg-line">{t.edit}</button>
              <button type="button" onClick={() => setPanel(true)} className="rounded-full bg-paper-2 px-2 py-0.5 text-ink-2 hover:bg-line">{t.replace}</button>
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
        <button
          type="button"
          onClick={() => setPanel(true)}
          className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-paper-2 hover:text-sky"
          aria-label={`${t.addImage}${label ? ` (${label})` : ""}`}
          title={t.addImage}
        >
          <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="16" rx="2.5" /><circle cx="9" cy="10" r="1.8" /><path d="m4 18 5-5 4 4 3-3 4 4" /></svg>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setPanel(true)}
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
          busy={busy}
          error={error}
          onCancel={() => setEditing(null)}
          onRemove={editing.local ? undefined : () => (onChange(null), setEditing(null))}
          onReplace={editing.local ? undefined : () => (setEditing(null), setPanel(true))}
          onApply={(blob) => {
            if (!blob && !editing.local) return setEditing(null); // nothing changed
            applyEdited(blob, blob ? editing.name.replace(/\.[^.]+$/, "") + ".webp" : editing.name);
          }}
        />
      )}
    </div>
  );
}

function AddImagePanel({ suggest, onClose, onPicked, onLocalFile }: { suggest?: string; onClose: () => void; onPicked: (a: { id: string; url: string }) => void; onLocalFile: (f: File) => void }) {
  const { t } = useUi();
  const [tab, setTab] = useState<"search" | "upload">("search");
  const [q, setQ] = useState((suggest ?? "").trim().slice(0, 100));
  const [size, setSize] = useState("all");
  const [results, setResults] = useState<WebResult[] | null>(null);
  const [state, setState] = useState<"idle" | "busy" | "off" | "error">("idle");
  const [error, setError] = useState("");
  const [importing, setImporting] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Is the provider configured? If not, show it clearly and open the upload tab.
    fetch("/api/images/search?status=1")
      .then((r) => r.json())
      .then((j) => {
        if (!j.enabled) {
          setState("off");
          setTab("upload");
        } else if (q) search(q, size);
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
      <div ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label={t.addImage} className="flex max-h-full w-full max-w-3xl flex-col overflow-hidden rounded-xl2 bg-card shadow-soft outline-none">
        <div className="flex items-center gap-2 border-b border-line px-4 py-3">
          <h2 className="font-display text-lg font-semibold">{t.addImage}</h2>
          <div className="ml-4 flex gap-1 rounded-full bg-paper-2 p-1 text-sm font-bold" role="tablist">
            {(["search", "upload"] as const).map((k) => (
              <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={`rounded-full px-3 py-1 ${tab === k ? "bg-card text-ink shadow-sm" : "text-muted"}`}>
                {k === "search" ? t.searchWeb : t.uploadImage}
              </button>
            ))}
          </div>
          <button type="button" onClick={onClose} className="ml-auto rounded-full px-2 text-2xl leading-none text-muted hover:text-ink" aria-label={t.close}>×</button>
        </div>
        {tab === "search" ? (
          <div className="flex min-h-0 flex-1 flex-col p-4">
            {state === "off" ? (
              <div className="rounded-xl bg-sun-soft p-4 text-sm text-[#7a5200]">
                <p>{t.searchOff}</p>
                <button type="button" onClick={() => setTab("upload")} className="mt-2 font-bold underline">{t.uploadImage}</button>
              </div>
            ) : (
              <>
                <form className="flex flex-wrap gap-2" onSubmit={(e) => (e.preventDefault(), search(q, size))}>
                  <input value={q} onChange={(e) => setQ(e.target.value)} maxLength={100} placeholder="manzana, perro, rojo…" aria-label={t.search} className="h-10 min-w-0 flex-1 rounded-full border border-line px-4 text-sm" />
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
            className="m-4 grid min-h-48 place-items-center rounded-xl border-2 border-dashed border-line bg-paper p-6 text-center"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const f = e.dataTransfer.files[0];
              if (f) onLocalFile(f);
            }}
          >
            <div>
              {state === "off" && <p className="mb-4 rounded-xl bg-sun-soft p-3 text-sm text-[#7a5200]">{t.searchOff}</p>}
              <button type="button" onClick={() => fileRef.current?.click()} className="rounded-full bg-coral px-5 py-2 font-bold text-white hover:bg-coral-dark">{t.chooseFile}</button>
              <p className="mt-2 text-sm text-muted">{t.dropHere}</p>
              <p className="mt-1 text-xs text-muted">PNG, JPEG, GIF, WebP · 4 MB</p>
              <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden" onChange={(e) => e.target.files?.[0] && onLocalFile(e.target.files[0])} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
