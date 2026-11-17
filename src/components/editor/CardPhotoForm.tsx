"use client";

import { useEffect, useRef, useState } from "react";
import { categoryContext, searchTerm, withContext } from "@/lib/images/photoQuery";
import { mediaSrc, uploadBlob } from "./ImageField";

// "Search online" for a flashcard: a form with the card's words and one "Foto / Photo" box per
// picture slot (front, back). Each box searches Wikimedia Commons, links to Google Images and
// takes an upload. Nothing changes on the card until "Guardar / Save"; "Cancelar" keeps it as it was.

type Photo = { id: string; title: string; thumb: string; width: number; height: number; author: string; license: string; pageUrl: string };
export type CardFace = { key: "front" | "back"; text: string; language: string; imageAssetId: string | null };
type Slot = { assetId: string | null; pending: Photo | null; searching: boolean; uploading: boolean; error: string };

const LANG: Record<string, string> = { "es-419": "Español", "en-US": "English", "fr-FR": "Français" };
const SIDE: Record<CardFace["key"], string> = { front: "Frente / Front", back: "Reverso / Back" };
const cache = new Map<string, Photo[]>();

export function CardPhotoForm({
  faces,
  category,
  focus,
  onSave,
  onCancel,
}: {
  faces: CardFace[];
  category?: { nameEn: string; nameEs: string } | null;
  /** The slot whose button opened the form: its search opens right away. */
  focus: CardFace["key"];
  onSave: (next: Array<{ key: CardFace["key"]; text: string; imageAssetId: string | null }>) => void;
  onCancel: () => void;
}) {
  const [texts, setTexts] = useState(() => Object.fromEntries(faces.map((f) => [f.key, f.text])) as Record<string, string>);
  const [slots, setSlots] = useState(() => Object.fromEntries(faces.map((f) => [f.key, { assetId: f.imageAssetId, pending: null, searching: f.key === focus, uploading: false, error: "" }])) as Record<string, Slot>);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = (k: string, s: Partial<Slot>) => setSlots((x) => ({ ...x, [k]: { ...x[k], ...s } }));
  const context = categoryContext(category?.nameEn);
  const term = searchTerm(faces.map((f) => ({ text: texts[f.key], language: f.language })));

  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onCancel();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onCancel]);

  async function save() {
    setSaving(true);
    setError("");
    try {
      const next = [];
      for (const f of faces) {
        const s = slots[f.key];
        let id = s.assetId;
        if (s.pending) {
          const res = await fetch("/api/images/import", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: s.pending.id }) });
          const json = await res.json();
          if (!res.ok) throw new Error(json.error || "The photo could not be saved.");
          id = json.id;
        }
        next.push({ key: f.key, text: texts[f.key] ?? "", imageAssetId: id });
      }
      onSave(next);
    } catch (e) {
      setError((e as Error).message);
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-ink/50 p-3 sm:p-8" onMouseDown={(e) => e.target === e.currentTarget && onCancel()}>
      <div role="dialog" aria-modal="true" aria-labelledby="lx-form-title" className="lx-form w-full max-w-2xl rounded-2xl bg-white p-5 shadow-soft sm:p-7" data-testid="card-photo-form">
        <h2 id="lx-form-title" className="text-2xl font-bold">Añadir vocabulario / Add words</h2>
        {category && <p className="mt-2 text-sm">{category.nameEs} / {category.nameEn}</p>}

        <div className="mt-4 space-y-4">
          {faces.map((f) => (
            <label key={f.key} className="block">
              <span className="mb-1 block font-bold">{LANG[f.language] ?? f.language}</span>
              <input type="text" value={texts[f.key] ?? ""} onChange={(e) => setTexts((x) => ({ ...x, [f.key]: e.target.value }))} maxLength={200} className="lx-input" lang={f.language.slice(0, 2)} />
            </label>
          ))}
        </div>

        {faces.map((f, i) => (
          <PhotoBox
            key={f.key}
            legend={faces.length > 1 ? `Foto ${i + 1} · ${SIDE[f.key]}` : "Foto / Photo"}
            slot={slots[f.key]}
            initialQuery={withContext(term, context)}
            onChange={(s) => set(f.key, s)}
          />
        ))}

        {error && <p role="alert" className="mt-3 text-sm font-semibold text-coral-dark">{error}</p>}
        <div className="mt-6 flex flex-wrap gap-3">
          <button type="button" className="lx-btn lx-btn-save" onClick={save} disabled={saving || Object.values(slots).some((s) => s.uploading)} data-testid="photo-form-save">
            {saving ? "Guardando… / Saving…" : "Guardar / Save"}
          </button>
          <button type="button" className="lx-btn lx-btn-cancel" onClick={onCancel} data-testid="photo-form-cancel">Cancelar / Cancel</button>
        </div>
      </div>
    </div>
  );
}

/** One picture slot: its preview, Change / Remove, or Search online / Upload a photo. */
function PhotoBox({ legend, slot, initialQuery, onChange }: { legend: string; slot: Slot; initialQuery: string; onChange: (s: Partial<Slot>) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const preview = slot.pending?.thumb ?? mediaSrc(slot.assetId);

  async function upload(file: File) {
    onChange({ uploading: true, error: "" });
    try {
      const a = await uploadBlob(file, file.name);
      onChange({ assetId: a.id, pending: null, searching: false, uploading: false });
    } catch (e) {
      onChange({ uploading: false, error: (e as Error).message });
    }
  }

  const uploadField = (
    <label className="mt-4 block">
      <span className="mb-1 block text-sm font-bold">Subir una foto / Upload a photo</span>
      <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={(e) => (e.target.files?.[0] && upload(e.target.files[0]), (e.target.value = ""))} className="lx-file" data-testid="photo-upload" />
      {slot.uploading && <span role="status" className="mt-1 block text-xs">Subiendo… / Uploading…</span>}
    </label>
  );

  return (
    <fieldset className="lx-fieldset mt-5" data-testid="photo-box">
      <legend className="px-1">{legend}</legend>
      {preview ? (
        <div data-testid="photo-preview">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="" referrerPolicy="no-referrer" className="max-h-56 max-w-full rounded-xl object-contain" />
          {slot.pending && <p className="mt-1 text-xs text-muted">{slot.pending.title} — {slot.pending.author} ({slot.pending.license})</p>}
          <div className="mt-3 flex flex-wrap gap-2">
            {!slot.searching && <button type="button" className="lx-btn lx-btn-light" onClick={() => onChange({ searching: true })}>Cambiar imagen / Change image</button>}
            <button type="button" className="lx-btn lx-btn-light text-coral-dark" onClick={() => onChange({ assetId: null, pending: null, searching: false })}>Quitar imagen / Remove image</button>
          </div>
        </div>
      ) : (
        !slot.searching && (
          <>
            <p className="mb-3">Elige una foto / Choose a photo</p>
            <button type="button" className="lx-btn lx-btn-save" onClick={() => onChange({ searching: true })}>Buscar en Internet / Search online</button>
          </>
        )
      )}
      {slot.searching && <SearchPanel initialQuery={initialQuery} selected={slot.pending?.id ?? null} onPick={(p) => onChange({ pending: p })} onClose={() => onChange({ searching: false })} />}
      {(slot.searching || !preview) && uploadField}
      {slot.error && <p role="alert" className="mt-2 text-xs font-semibold text-coral-dark">{slot.error}</p>}
    </fieldset>
  );
}

/** The search inside a photo box: an editable query and up to six photos (Wikimedia Commons). */
function SearchPanel({ initialQuery, selected, onPick, onClose }: { initialQuery: string; selected: string | null; onPick: (p: Photo) => void; onClose: () => void }) {
  const [q, setQ] = useState(initialQuery);
  const [state, setState] = useState<{ status: "idle" | "busy" | "done" | "error"; photos: Photo[]; message?: string }>({ status: "idle", photos: [] });
  const query = q.trim();
  const first = useRef(true);

  useEffect(() => {
    const now = first.current;
    first.current = false;
    if (query.length < 2) return setState({ status: "idle", photos: [] });
    const hit = cache.get(query);
    if (hit) return setState({ status: "done", photos: hit });
    // A new text drops the old results at once; the search runs 500 ms after typing stops
    // (right away when the panel opens with the card's word) and cancels the previous one.
    setState({ status: "busy", photos: [] });
    const ctrl = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/images/photos?${new URLSearchParams({ q: query })}`, { signal: ctrl.signal });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error);
        cache.set(query, json.results);
        setState({ status: "done", photos: json.results });
      } catch (e) {
        if (!ctrl.signal.aborted) setState({ status: "error", photos: [], message: (e as Error).message });
      }
    }, now ? 0 : 500);
    return () => (clearTimeout(timer), ctrl.abort());
  }, [query]);

  return (
    <div className="mt-4" data-testid="photo-search">
      <label className="block">
        <span className="mb-1 block text-sm font-bold">Buscar / Search</span>
        <input type="text" value={q} onChange={(e) => setQ(e.target.value)} maxLength={100} autoFocus placeholder="pavo, turkey…" className="lx-input" data-testid="photo-query" autoComplete="off" />
      </label>
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
        <button type="button" onClick={onClose} className="text-muted underline">Cerrar búsqueda / Close search</button>
      </div>
      <div className="mt-3" aria-live="polite">
        {query.length < 2 ? (
          <p className="text-sm text-muted">Escribe una palabra / Type a word</p>
        ) : state.status === "busy" || state.status === "idle" ? (
          <p className="text-sm text-muted">Buscando fotos… / Looking for photos…</p>
        ) : state.status === "error" ? (
          <p className="text-sm" data-testid="photo-error">{state.message || "No se pudo buscar ahora."} Sube una foto. / Upload a photo.</p>
        ) : state.photos.length === 0 ? (
          <p className="text-sm" data-testid="photo-none">No hay fotos. Sube una foto. / No photos. Upload a photo.</p>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3" data-testid="photo-suggestions">
            {state.photos.map((p) => {
              const on = p.id === selected;
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => onPick(p)}
                    aria-pressed={on}
                    aria-label={`${p.title} — ${p.author} (${p.license})`}
                    title={`${p.title} — ${p.author} (${p.license})`}
                    className={`relative block w-full overflow-hidden rounded-xl border-2 bg-[#f4f6f7] ${on ? "border-[#1d6b52] ring-2 ring-[#1d6b52]/30" : "border-[#c9d3d6] hover:border-[#6b7f86]"}`}
                    data-testid="photo-suggestion"
                  >
                    <span className="block aspect-[4/3]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.thumb} alt="" loading="lazy" referrerPolicy="no-referrer" className="h-full w-full object-contain" />
                    </span>
                    {on && <span aria-hidden className="absolute right-1.5 top-1.5 grid h-7 w-7 place-items-center rounded-full bg-[#1d6b52] text-sm font-bold text-white">✓</span>}
                    <span className="block truncate px-2 py-1 text-left text-[11px] text-muted">{p.author} · {p.license}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
