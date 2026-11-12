"use client";

import { useRef, useState } from "react";

type Asset = { id: string; url: string; name: string };
type WebResult = { id: string; thumb: string; tags: string; author: string; pageUrl: string };

export function ImagePicker({ value, url, onChange, suggest }: { value: string | null; url?: string | null; onChange: (a: Asset | null) => void; suggest?: string }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [library, setLibrary] = useState<Asset[] | null>(null);
  const [web, setWeb] = useState<{ q: string; kind: string; results: WebResult[] | null; busy: boolean; error: string } | null>(null);

  async function searchWeb(q: string, kind: string) {
    if (!q.trim()) return;
    setWeb({ q, kind, results: null, busy: true, error: "" });
    try {
      const res = await fetch(`/api/images/search?${new URLSearchParams({ q, kind })}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error === "invalid_request" ? "Escribe una palabra para buscar." : json.error);
      setWeb({ q, kind, results: json.results, busy: false, error: "" });
    } catch (e) {
      setWeb({ q, kind, results: [], busy: false, error: (e as Error).message || "Search failed" });
    }
  }

  async function pickWeb(r: WebResult) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/images/import", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: r.id }) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      onChange(json);
      setWeb(null);
    } catch (e) {
      setError((e as Error).message || "Could not add the image");
    } finally {
      setBusy(false);
    }
  }

  async function upload(f: File) {
    setBusy(true);
    setError("");
    const fd = new FormData();
    fd.append("file", f);
    try {
      const res = await fetch("/api/media", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      onChange(json);
    } catch (e) {
      setError((e as Error).message || "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  async function openLibrary() {
    const res = await fetch("/api/media");
    const json = await res.json();
    setLibrary(json.assets ?? []);
  }

  return (
    <div>
      <div
        className="relative grid aspect-[4/3] w-full place-items-center overflow-hidden rounded-xl border-2 border-dashed border-line bg-paper"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const f = e.dataTransfer.files[0];
          if (f) upload(f);
        }}
      >
        {value && url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="" className="h-full w-full object-contain" />
        ) : (
          <span className="px-3 text-center text-sm text-muted">{busy ? "Uploading…" : "Drop an image here"}</span>
        )}
      </div>
      <div className="mt-2 flex flex-wrap gap-2 text-xs font-bold">
        <button type="button" onClick={() => fileRef.current?.click()} className="rounded-full bg-paper-2 px-3 py-1 text-ink-2 hover:bg-line">
          {value ? "Replace" : "Upload"}
        </button>
        <button type="button" onClick={openLibrary} className="rounded-full bg-paper-2 px-3 py-1 text-ink-2 hover:bg-line">
          Media library
        </button>
        <button
          type="button"
          onClick={() => {
            const q = (suggest ?? "").trim().slice(0, 100);
            setWeb({ q, kind: "all", results: null, busy: false, error: "" });
            if (q) searchWeb(q, "all");
          }}
          className="rounded-full bg-paper-2 px-3 py-1 text-ink-2 hover:bg-line"
        >
          Search internet
        </button>
        {value && (
          <button type="button" onClick={() => onChange(null)} className="rounded-full px-2 py-1 text-muted hover:text-coral-dark">
            Remove
          </button>
        )}
      </div>
      <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
      {error && <p className="mt-1 text-xs font-semibold text-coral-dark">{error}</p>}
      {web && (
        <div className="mt-2 rounded-xl border border-line bg-card p-2">
          <div className="mb-1 flex justify-between text-xs font-bold">
            <span>Safe image search</span>
            <button type="button" onClick={() => setWeb(null)} className="text-muted">Close</button>
          </div>
          <form
            className="flex flex-wrap gap-1.5"
            onSubmit={(e) => {
              e.preventDefault();
              searchWeb(web.q, web.kind);
            }}
          >
            <input
              value={web.q}
              onChange={(e) => setWeb({ ...web, q: e.target.value })}
              placeholder="manzana, perro, casa…"
              maxLength={100}
              aria-label="Search images"
              className="h-8 w-full basis-full rounded-full border border-line px-3 text-xs"
            />
            <select value={web.kind} onChange={(e) => setWeb({ ...web, kind: e.target.value })} aria-label="Image type" className="h-8 min-w-0 flex-1 rounded-full border border-line px-2 text-xs">
              <option value="all">All</option>
              <option value="photo">Photos</option>
              <option value="illustration">Drawings</option>
            </select>
            <button className="h-8 rounded-full bg-ink px-3 text-xs font-bold text-white" disabled={web.busy}>
              {web.busy ? "…" : "Search"}
            </button>
          </form>
          {web.error && <p className="mt-1.5 text-xs font-semibold text-coral-dark">{web.error}</p>}
          {web.results && web.results.length === 0 && !web.error && <p className="p-2 text-xs text-muted">No safe images found. Try another word.</p>}
          {web.results && web.results.length > 0 && (
            <div className="mt-1.5 grid max-h-56 grid-cols-3 gap-1.5 overflow-y-auto">
              {web.results.map((r) => (
                <button key={r.id} type="button" disabled={busy} onClick={() => pickWeb(r)} className="aspect-square overflow-hidden rounded-lg border border-line hover:border-sky" title={r.tags}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={r.thumb} alt={r.tags} className="h-full w-full object-cover" loading="lazy" referrerPolicy="no-referrer" />
                </button>
              ))}
            </div>
          )}
          <p className="mt-1.5 text-[11px] text-muted">
            Child-safe filter on. Images from{" "}
            <a href="https://pixabay.com/" target="_blank" rel="noreferrer" className="underline">Pixabay</a>.
          </p>
        </div>
      )}
      {library && (
        <div className="mt-2 rounded-xl border border-line bg-card p-2">
          <div className="mb-1 flex justify-between text-xs font-bold">
            <span>Reuse an image</span>
            <button type="button" onClick={() => setLibrary(null)} className="text-muted">Close</button>
          </div>
          {library.length === 0 ? (
            <p className="p-2 text-xs text-muted">No images uploaded yet.</p>
          ) : (
            <div className="grid max-h-48 grid-cols-4 gap-1.5 overflow-y-auto">
              {library.map((a) => (
                <button key={a.id} type="button" onClick={() => (onChange(a), setLibrary(null))} className="aspect-square overflow-hidden rounded-lg border border-line hover:border-sky" title={a.name}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={a.url} alt={a.name} className="h-full w-full object-cover" loading="lazy" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
