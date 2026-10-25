"use client";

import { useRef, useState } from "react";

type Asset = { id: string; url: string; name: string };

export function ImagePicker({ value, url, onChange }: { value: string | null; url?: string | null; onChange: (a: Asset | null) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [library, setLibrary] = useState<Asset[] | null>(null);

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
        {value && (
          <button type="button" onClick={() => onChange(null)} className="rounded-full px-2 py-1 text-muted hover:text-coral-dark">
            Remove
          </button>
        )}
      </div>
      <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
      {error && <p className="mt-1 text-xs font-semibold text-coral-dark">{error}</p>}
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
