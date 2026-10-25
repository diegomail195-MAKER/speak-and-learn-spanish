"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { ImagePicker } from "@/components/editor/ImagePicker";
import { SpanishField } from "@/components/editor/SpanishField";
import { Button } from "@/components/ui/Button";
import { FormError, Input, Label, Select } from "@/components/ui/Field";

export interface VideoFormValue {
  id?: string;
  title: string;
  description: string;
  source: "HOSTED" | "YOUTUBE";
  fileAssetId: string | null;
  fileName?: string | null;
  fileUrl?: string | null;
  youtubeId: string | null;
  youtubeInput?: string;
  coverAssetId: string | null;
  coverUrl?: string | null;
  captionsAssetId: string | null;
  captionsName?: string | null;
  captionsLanguage: string;
  categoryId: string | null;
  level: string;
  keywords: string[];
  durationSec: number | null;
  practiceGameId: string | null;
  status: "DRAFT" | "PUBLISHED";
}

function parseYouTubeId(input: string): string | null {
  const s = input.trim();
  if (/^[\w-]{11}$/.test(s)) return s;
  try {
    const u = new URL(s);
    const host = u.hostname.replace(/^www\.|^m\./, "");
    if (host === "youtu.be") return /^[\w-]{11}$/.test(u.pathname.slice(1)) ? u.pathname.slice(1) : null;
    if (["youtube.com", "youtube-nocookie.com", "music.youtube.com"].includes(host)) {
      const v = u.searchParams.get("v");
      if (v && /^[\w-]{11}$/.test(v)) return v;
      return u.pathname.match(/^\/(?:embed|shorts|live|v)\/([\w-]{11})/)?.[1] ?? null;
    }
  } catch {}
  return null;
}

export function VideoForm({ initial, categories, games }: { initial: VideoFormValue; categories: Array<{ id: string; nameEn: string; nameEs: string }>; games: Array<{ id: string; title: string }> }) {
  const router = useRouter();
  const [v, setV] = useState<VideoFormValue>(initial);
  const [upload, setUpload] = useState<{ pct: number; name: string } | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const capRef = useRef<HTMLInputElement>(null);
  const xhr = useRef<XMLHttpRequest | null>(null);
  const set = <K extends keyof VideoFormValue>(k: K, val: VideoFormValue[K]) => setV((x) => ({ ...x, [k]: val }));

  function uploadVideo(f: File) {
    setError("");
    setUpload({ pct: 0, name: f.name });
    // Read the duration locally before uploading.
    const probe = document.createElement("video");
    probe.preload = "metadata";
    probe.src = URL.createObjectURL(f);
    probe.onloadedmetadata = () => {
      if (Number.isFinite(probe.duration)) setV((x) => ({ ...x, durationSec: x.durationSec ?? Math.round(probe.duration) }));
      URL.revokeObjectURL(probe.src);
    };
    const fail = (msg: string) => {
      setError(msg);
      setUpload(null);
    };
    const done = (json: { id: string; name: string; url: string }) => {
      setV((x) => ({ ...x, fileAssetId: json.id, fileName: json.name, fileUrl: json.url, title: x.title || f.name.replace(/\.[^.]+$/, "") }));
      setUpload(null);
    };
    // With cloud storage the file goes straight from the browser to storage; otherwise to our server.
    fetch("/api/videos/direct-upload", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: f.name, size: f.size }) })
      .then(async (res) => {
        const plan = await res.json();
        if (!res.ok) return fail(plan.error ?? "Upload failed");
        const req = new XMLHttpRequest();
        xhr.current = req;
        if (plan.mode === "direct") {
          req.open("PUT", plan.uploadUrl);
          req.setRequestHeader("Content-Type", f.type || "application/octet-stream");
          req.setRequestHeader("x-upsert", "false");
        } else {
          req.open("POST", "/api/videos/upload");
          req.setRequestHeader("Content-Type", "application/octet-stream");
          req.setRequestHeader("X-File-Name", encodeURIComponent(f.name));
        }
        req.upload.onprogress = (e) => e.lengthComputable && setUpload({ pct: Math.round((e.loaded / e.total) * 100), name: f.name });
        req.onload = async () => {
          if (req.status >= 300) {
            const json = JSON.parse(req.responseText || "{}");
            return fail(json.error ?? (req.status === 413 ? "This video is larger than the storage plan allows." : "Upload failed"));
          }
          if (plan.mode !== "direct") return done(JSON.parse(req.responseText));
          const r = await fetch("/api/videos/direct-upload", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key: plan.key, name: f.name }) });
          const json = await r.json();
          if (!r.ok) return fail(json.error ?? "Upload failed");
          done(json);
        };
        req.onerror = () => fail("Upload interrupted. Check the connection and try again.");
        req.send(f);
      })
      .catch(() => fail("Upload interrupted. Check the connection and try again."));
  }

  async function uploadCaptions(f: File) {
    setError("");
    const fd = new FormData();
    fd.append("file", f);
    const res = await fetch("/api/videos/captions", { method: "POST", body: fd });
    const json = await res.json();
    if (!res.ok) return setError(json.error ?? "Subtitle upload failed");
    setV((x) => ({ ...x, captionsAssetId: json.id, captionsName: json.name }));
  }

  async function save(status: "DRAFT" | "PUBLISHED") {
    setSaving(true);
    setError("");
    const body = { ...v, status, keywords: v.keywords, youtubeId: v.source === "YOUTUBE" ? parseYouTubeId(v.youtubeInput ?? v.youtubeId ?? "") : null };
    if (v.source === "YOUTUBE" && !body.youtubeId) {
      setSaving(false);
      return setError("That doesn't look like a YouTube link.");
    }
    const res = await fetch(v.id ? `/api/videos/${v.id}` : "/api/videos", { method: v.id ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const json = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) return setError(json.error === "invalid_request" ? json.issues?.[0]?.message ?? "Check the fields." : json.error ?? "Could not save");
    router.push("/teacher/videos");
    router.refresh();
  }

  const ytId = v.source === "YOUTUBE" ? parseYouTubeId(v.youtubeInput ?? v.youtubeId ?? "") : null;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <section className="space-y-5 rounded-xl2 border border-line bg-card p-5">
        <div className="inline-flex rounded-full bg-paper-2 p-1 text-sm font-bold" role="tablist" aria-label="Video source">
          {(["HOSTED", "YOUTUBE"] as const).map((s) => (
            <button key={s} type="button" role="tab" aria-selected={v.source === s} onClick={() => set("source", s)} className={`rounded-full px-4 py-1.5 ${v.source === s ? "bg-ink text-white" : "text-ink-2"}`}>
              {s === "HOSTED" ? "Upload from computer" : "YouTube link"}
            </button>
          ))}
        </div>

        {v.source === "HOSTED" ? (
          <div>
            {v.fileAssetId && v.fileUrl ? (
              <div className="space-y-2">
                <video src={v.fileUrl} controls preload="metadata" className="aspect-video w-full rounded-xl bg-black" />
                <p className="text-sm text-muted">
                  {v.fileName}{" "}
                  <button type="button" className="font-bold text-sky" onClick={() => fileRef.current?.click()}>
                    Replace
                  </button>
                </p>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files[0]) uploadVideo(e.dataTransfer.files[0]);
                }}
                className="grid aspect-video w-full place-items-center rounded-xl border-2 border-dashed border-line bg-paper text-center hover:border-coral"
              >
                {upload ? (
                  <span className="w-2/3">
                    <span className="block text-sm font-bold">Uploading {upload.name}… {upload.pct}%</span>
                    <span className="mt-2 block h-2 overflow-hidden rounded-full bg-line">
                      <span className="block h-full bg-coral" style={{ width: `${upload.pct}%` }} />
                    </span>
                  </span>
                ) : (
                  <span>
                    <span className="block font-display text-lg font-semibold">Drop a video here or click to choose</span>
                    <span className="text-sm text-muted">MP4 or WebM · up to 500 MB</span>
                  </span>
                )}
              </button>
            )}
            {upload && (
              <button type="button" onClick={() => (xhr.current?.abort(), setUpload(null))} className="mt-2 text-sm font-bold text-muted">
                Cancel upload
              </button>
            )}
            <input ref={fileRef} type="file" accept="video/mp4,video/webm" className="hidden" onChange={(e) => e.target.files?.[0] && uploadVideo(e.target.files[0])} />
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="yt">YouTube link</Label>
            <Input id="yt" value={v.youtubeInput ?? (v.youtubeId ? `https://youtu.be/${v.youtubeId}` : "")} onChange={(e) => set("youtubeInput", e.target.value)} placeholder="https://www.youtube.com/watch?v=…" />
            {ytId ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={`https://i.ytimg.com/vi/${ytId}/hqdefault.jpg`} alt="YouTube thumbnail" className="aspect-video w-full max-w-md rounded-xl object-cover" />
            ) : (
              (v.youtubeInput ?? "").trim() && <p className="text-sm font-semibold text-coral-dark">That doesn&apos;t look like a YouTube link.</p>
            )}
            <p className="text-xs text-muted">Plays through youtube-nocookie.com. Only use videos you are allowed to share. YouTube may still show ads or block some videos; that is controlled by YouTube.</p>
          </div>
        )}

        <SpanishField label="Title" value={v.title} onChange={(x) => set("title", x)} maxLength={140} placeholder="Los animales de la granja" />
        <SpanishField label="Description" multiline value={v.description} onChange={(x) => set("description", x)} maxLength={2000} />
        <div>
          <Label htmlFor="kw" hint="comma separated">Keywords</Label>
          <Input id="kw" value={v.keywords.join(", ")} onChange={(e) => set("keywords", e.target.value.split(",").map((k) => k.trimStart()))} placeholder="animales, granja, vaca" lang="es" />
        </div>
        {v.source === "HOSTED" && (
          <div>
            <Label>Subtitles (optional)</Label>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <Button type="button" size="sm" variant="secondary" onClick={() => capRef.current?.click()}>
                {v.captionsAssetId ? "Replace .vtt file" : "Add .vtt file"}
              </Button>
              {v.captionsAssetId && (
                <>
                  <span className="text-muted">{v.captionsName ?? "subtitles.vtt"}</span>
                  <button type="button" className="font-bold text-muted" onClick={() => set("captionsAssetId", null)}>Remove</button>
                </>
              )}
              <select aria-label="Subtitle language" value={v.captionsLanguage} onChange={(e) => set("captionsLanguage", e.target.value)} className="rounded-lg border border-line bg-card px-2 py-1">
                <option value="es">Español</option>
                <option value="en">English</option>
                <option value="fr">Français</option>
              </select>
            </div>
            <input ref={capRef} type="file" accept=".vtt,text/vtt" className="hidden" onChange={(e) => e.target.files?.[0] && uploadCaptions(e.target.files[0])} />
          </div>
        )}
      </section>

      <aside className="space-y-4">
        <section className="space-y-4 rounded-xl2 border border-line bg-card p-5">
          <div>
            <Label>Cover image {v.source === "YOUTUBE" && <span className="font-normal text-muted">(optional)</span>}</Label>
            <ImagePicker value={v.coverAssetId} url={v.coverUrl} onChange={(a) => setV((x) => ({ ...x, coverAssetId: a?.id ?? null, coverUrl: a?.url ?? null }))} />
          </div>
          <div>
            <Label htmlFor="cat">Category</Label>
            <Select id="cat" value={v.categoryId ?? ""} onChange={(e) => set("categoryId", e.target.value || null)}>
              <option value="">—</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.nameEn} / {c.nameEs}</option>)}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="lvl">Level</Label>
              <Input id="lvl" value={v.level} onChange={(e) => set("level", e.target.value)} placeholder="LE2" maxLength={60} />
            </div>
            <div>
              <Label htmlFor="dur" hint="sec">Duration</Label>
              <Input id="dur" type="number" min={0} value={v.durationSec ?? ""} onChange={(e) => set("durationSec", e.target.value ? Number(e.target.value) : null)} />
            </div>
          </div>
          <div>
            <Label htmlFor="pg">Watch &amp; Practice game</Label>
            <Select id="pg" value={v.practiceGameId ?? ""} onChange={(e) => set("practiceGameId", e.target.value || null)}>
              <option value="">None</option>
              {games.map((g) => <option key={g.id} value={g.id}>{g.title}</option>)}
            </Select>
            <p className="mt-1 text-xs text-muted">Offered to students right after the video ends.</p>
          </div>
        </section>
        <FormError message={error} />
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" disabled={saving || !!upload} onClick={() => save("DRAFT")}>Save draft</Button>
          <Button type="button" disabled={saving || !!upload} onClick={() => save("PUBLISHED")}>{saving ? "Saving…" : "Publish"}</Button>
        </div>
      </aside>
    </div>
  );
}
