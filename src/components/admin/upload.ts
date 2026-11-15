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
    req.onload = () => {
      if (req.status < 300) return resolve();
      const text = req.responseText || "";
      // Supabase answers 400 with {"statusCode":"413"} when a file is over the storage size limit.
      if (req.status === 413 || /"statusCode":"413"|too large|exceeded the maximum/i.test(text)) return reject(new Error("This file is bigger than the storage limit. Export it smaller (for a video: 720p, 2 to 5 minutes) and try again."));
      let msg = "Upload failed";
      try { msg = JSON.parse(text).error ?? msg; } catch {}
      reject(new Error(msg));
    };
    req.onerror = () => reject(new Error("Upload interrupted. Check the connection and try again."));
    req.send(f);
  });
  const done = await fetch(`/api/library/files/${plan.id}/complete`, { method: "POST" });
  const json = await done.json();
  if (!done.ok) throw new Error(json.error ?? "Upload failed");
  return json;
}
