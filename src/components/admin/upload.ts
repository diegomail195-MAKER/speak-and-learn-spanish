"use client";

export type Uploaded = { id: string; mime: string; name: string; group?: string };

/** Uploads one file to the library (direct to storage when available) with progress. */
export async function uploadLibraryFile(f: File, onProgress?: (pct: number) => void): Promise<Uploaded> {
  const res = await fetch("/api/library/files", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: f.name, size: f.size }) });
  const plan = await res.json();
  if (!res.ok) throw new Error(plan.error ?? "Upload failed");
  await new Promise<void>((resolve, reject) => {
    const req = new XMLHttpRequest();
    req.open("PUT", plan.uploadUrl);
    req.setRequestHeader("Content-Type", plan.direct ? f.type || "application/octet-stream" : "application/octet-stream");
    if (plan.direct) req.setRequestHeader("x-upsert", "false");
    req.upload.onprogress = (e) => e.lengthComputable && onProgress?.(Math.round((e.loaded / e.total) * 100));
    req.onload = () => (req.status < 300 ? resolve() : reject(new Error(JSON.parse(req.responseText || "{}").error ?? (req.status === 413 ? "File too large for the storage plan." : "Upload failed"))));
    req.onerror = () => reject(new Error("Upload interrupted. Check the connection and try again."));
    req.send(f);
  });
  const done = await fetch(`/api/library/files/${plan.id}/complete`, { method: "POST" });
  const json = await done.json();
  if (!done.ok) throw new Error(json.error ?? "Upload failed");
  return json;
}
