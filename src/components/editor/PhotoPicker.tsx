"use client";

import { useEffect, useRef, useState } from "react";
import { categoryContext, googleImagesUrl, searchTerm, withContext } from "@/lib/images/photoQuery";
import { useUi } from "./i18n";
import { mediaSrc, uploadBlob } from "./ImageField";

type Photo = { id: string; title: string; thumb: string; width: number; height: number; author: string; license: string; pageUrl: string };
const cache = new Map<string, Photo[]>();

/**
 * A flashcard's "Picture" section: up to six Wikimedia Commons photo suggestions for the card's
 * words (650 ms after typing stops, English first, with the category as context), a Google Images
 * link and "Upload a photo". The chosen photo is shown with both texts and can still be changed.
 */
export function PhotoPicker({
  index,
  faces,
  categoryName,
  assetId,
  onPick,
}: {
  index: number;
  faces: Array<{ text?: string | null; language?: string | null }>;
  categoryName?: string | null;
  assetId: string | null | undefined;
  onPick: (a: { id: string; url: string }) => void;
}) {
  const { t } = useUi();
  const term = searchTerm(faces);
  const context = categoryContext(categoryName);
  const query = withContext(term, context);
  const [state, setState] = useState<{ q: string; status: "idle" | "busy" | "done" | "error"; photos: Photo[] }>({ q: "", status: "idle", photos: [] });
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (query.length < 2) return setState({ q: "", status: "idle", photos: [] });
    if (cache.has(query)) return setState({ q: query, status: "done", photos: cache.get(query)! });
    // Wait until typing stops; a new text cancels the previous search.
    const ctrl = new AbortController();
    const timer = setTimeout(async () => {
      setState((s) => ({ ...s, q: query, status: "busy" }));
      try {
        const res = await fetch(`/api/images/photos?${new URLSearchParams({ q: query })}`, { signal: ctrl.signal });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error);
        cache.set(query, json.results);
        setState({ q: query, status: "done", photos: json.results });
      } catch {
        if (!ctrl.signal.aborted) setState({ q: query, status: "error", photos: [] });
      }
    }, 650);
    return () => (clearTimeout(timer), ctrl.abort());
  }, [query]);

  async function choose(p: Photo) {
    setSaving(p.id);
    setError("");
    try {
      const res = await fetch("/api/images/import", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: p.id }) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      onPick({ id: json.id, url: json.url });
    } catch (e) {
      setError((e as Error).message || t.photoNone);
    } finally {
      setSaving(null);
    }
  }

  async function upload(f: File) {
    setSaving("upload");
    setError("");
    try {
      const a = await uploadBlob(f, f.name);
      onPick({ id: a.id, url: a.url });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(null);
    }
  }

  const img = mediaSrc(assetId);
  const texts = faces.map((f) => f.text?.trim()).filter(Boolean);
  const btn = "inline-flex h-9 items-center gap-1.5 rounded-full border border-line bg-card px-3 text-sm font-bold text-ink-2 hover:bg-paper-2 hover:text-ink";
  return (
    <section aria-label={`${t.photoSection} (${index + 1})`} data-testid="photo-section" className="mt-2 rounded-xl border border-line bg-paper p-3">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <h3 className="mr-auto font-display text-base font-extrabold">{t.photoSection}</h3>
        <a href={googleImagesUrl(term, context)} target="_blank" rel="noopener noreferrer" aria-disabled={!term} onClick={(e) => !term && e.preventDefault()} className={`${btn} ${term ? "" : "pointer-events-none opacity-40"}`} data-testid="google-images">
          <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><circle cx="10.5" cy="10.5" r="6" /><path d="m15 15 5 5" /></svg>
          {t.googleImages} <span aria-hidden>↗</span>
        </a>
        <button type="button" className={btn} onClick={() => fileRef.current?.click()} disabled={!!saving} title={t.photoRights} data-testid="upload-photo">
          <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 16V4M7 9l5-5 5 5M4 20h16" /></svg>
          {t.uploadPhoto}
        </button>
        <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden" onChange={(e) => (e.target.files?.[0] && upload(e.target.files[0]), (e.target.value = ""))} aria-label={t.uploadPhoto} />
      </div>

      {img && (
        <div className="mb-3 flex items-center gap-3 rounded-lg bg-card p-2" data-testid="photo-chosen">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={img} alt="" className="h-20 w-28 shrink-0 rounded-md object-contain" />
          <div className="min-w-0">
            {texts.map((x, i) => <p key={i} className={i === 0 ? "font-display text-lg font-bold" : "text-sm text-ink-2"}>{x}</p>)}
            <p className="text-xs text-muted">{t.photoChosen}</p>
          </div>
        </div>
      )}

      <p className="sr-only" role="status">{state.status === "busy" ? t.photoSearching : ""}</p>
      {!term ? (
        <p className="text-sm text-muted">{t.photoType}</p>
      ) : state.status === "busy" || (state.status === "idle" && query.length >= 2) ? (
        <p className="text-sm text-muted">{t.photoSearching}</p>
      ) : state.status === "error" || (state.status === "done" && state.photos.length === 0) ? (
        <p className="text-sm text-muted" data-testid="photo-none">{t.photoNone}</p>
      ) : (
        <ul className="grid max-w-3xl grid-cols-3 gap-2 sm:grid-cols-6" aria-label={t.photoSuggestions} data-testid="photo-suggestions">
          {state.photos.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => choose(p)}
                disabled={!!saving}
                className="group block w-full overflow-hidden rounded-lg border-2 border-transparent bg-card text-left hover:border-sky focus-visible:border-sky disabled:opacity-60"
                aria-label={`${t.photoUse}: ${p.title} (${p.author}, ${p.license})`}
                title={`${p.title} — ${p.author} (${p.license})`}
                data-testid="photo-suggestion"
              >
                <span className="relative block aspect-[4/3] bg-paper-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.thumb} alt="" loading="lazy" referrerPolicy="no-referrer" className="h-full w-full object-contain" />
                  {saving === p.id && <span className="absolute inset-0 grid place-items-center bg-card/70 text-xs font-bold">{t.photoSaving}</span>}
                </span>
                <span className="block truncate px-1.5 py-1 text-[10px] text-muted">{p.author} · {p.license}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {saving === "upload" && <p className="mt-2 text-xs font-bold text-ink-2" role="status">{t.photoSaving}</p>}
      {error && <p role="alert" className="mt-2 text-xs font-semibold text-coral-dark">{error}</p>}
    </section>
  );
}
