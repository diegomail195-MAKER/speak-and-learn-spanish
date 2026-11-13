"use client";

import { useState, useTransition } from "react";
import { Picture } from "@/components/library/Players";
import { Button } from "@/components/ui/Button";
import { FormError, Input, Label, Select, inputClass } from "@/components/ui/Field";
import { Panel } from "@/components/ui/Panel";
import { saveDraft } from "@/lib/actions/library";
import { SEED_VOCAB } from "@/lib/library/seed-data";
import { GAME_TYPES, GAME_TYPE_LABEL, libraryFileUrl, youtubeIdFrom, type AnyContent, type ContentFor, type FileRef, type ImageRef, type Kind, type Pair } from "@/lib/library/types";
import { uploadLibraryFile } from "./upload";

// Editor for a library resource's draft. Games and flashcards are fully editable here;
// videos, songs and printables take an uploaded file (or YouTube link / lyrics / generated sheet).

const ART_OPTIONS = Object.entries(SEED_VOCAB).flatMap(([topic, words]) => words.map((w) => ({ key: `${topic}:${w.id}`, label: `${w.es} (${topic})` })));

function useUpload() {
  const [pct, setPct] = useState<number | null>(null);
  const [err, setErr] = useState<string>();
  const run = async (f: File, accept: (mime: string) => boolean, done: (ref: FileRef) => void) => {
    setErr(undefined);
    setPct(0);
    try {
      const r = await uploadLibraryFile(f, setPct);
      if (!accept(r.mime)) throw new Error("That type of file doesn't fit here.");
      done({ fileId: r.id, name: r.name, mime: r.mime });
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setPct(null);
    }
  };
  return { pct, err, run };
}

function FilePicker({ label, accept, test, value, onChange, testId }: { label: string; accept: string; test: (mime: string) => boolean; value: FileRef | null | undefined; onChange: (v: FileRef | null) => void; testId?: string }) {
  const up = useUpload();
  return (
    <div>
      <Label>{label}</Label>
      {value ? (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-paper px-3 py-2">
          <a href={libraryFileUrl(value.fileId)} target="_blank" rel="noopener" className="font-bold text-sky hover:underline">{value.name || "file"}</a>
          <span className="text-xs text-muted">{value.mime}</span>
          <button type="button" onClick={() => onChange(null)} className="ml-auto text-sm font-bold text-coral-dark">Remove</button>
        </div>
      ) : (
        <input type="file" accept={accept} data-testid={testId} className="block w-full text-sm file:mr-3 file:rounded-full file:border-0 file:bg-ink file:px-4 file:py-2 file:font-bold file:text-white"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) void up.run(f, test, onChange); e.target.value = ""; }} />
      )}
      {up.pct !== null && <p className="mt-1 text-sm font-bold text-teal-dark" role="status">Uploading… {up.pct}%</p>}
      {up.err && <p className="mt-1 text-sm font-bold text-coral-dark" role="alert">{up.err}</p>}
    </div>
  );
}

function ImagePicker({ value, onChange, label = "Picture" }: { value: ImageRef; onChange: (v: ImageRef) => void; label?: string }) {
  const up = useUpload();
  return (
    <div className="flex items-start gap-3">
      <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-2xl border border-line bg-paper">
        {value.art || value.fileId ? <Picture image={value} /> : <span className="text-xs text-muted">No picture</span>}
      </div>
      <div className="min-w-0 flex-1 space-y-1.5">
        <select aria-label={`${label}: built-in`} className={`${inputClass} py-1.5 text-sm`} value={value.art ?? ""} onChange={(e) => onChange(e.target.value ? { art: e.target.value } : {})}>
          <option value="">{value.fileId ? "Uploaded picture" : "Built-in picture…"}</option>
          {ART_OPTIONS.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
        </select>
        <input type="file" accept="image/png,image/jpeg,image/gif,image/webp" aria-label={`${label}: upload`} className="block w-full text-xs file:mr-2 file:rounded-full file:border-0 file:bg-paper-2 file:px-3 file:py-1.5 file:font-bold"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) void up.run(f, (m) => m.startsWith("image/"), (r) => onChange({ fileId: r.fileId, mime: r.mime })); e.target.value = ""; }} />
        {up.pct !== null && <p className="text-xs font-bold text-teal-dark">Uploading… {up.pct}%</p>}
        {up.err && <p className="text-xs font-bold text-coral-dark">{up.err}</p>}
      </div>
    </div>
  );
}

function RowTools({ i, n, move, remove }: { i: number; n: number; move: (from: number, to: number) => void; remove: () => void }) {
  const b = "grid h-9 w-9 place-items-center rounded-full font-bold hover:bg-paper-2 disabled:opacity-30";
  return (
    <div className="flex shrink-0 gap-1">
      <button type="button" className={b} disabled={i === 0} onClick={() => move(i, i - 1)} aria-label="Move up">↑</button>
      <button type="button" className={b} disabled={i === n - 1} onClick={() => move(i, i + 1)} aria-label="Move down">↓</button>
      <button type="button" className={`${b} text-coral-dark`} onClick={remove} aria-label="Remove">×</button>
    </div>
  );
}

function listOps<T>(items: T[], set: (xs: T[]) => void) {
  return {
    update: (i: number, patch: Partial<T>) => set(items.map((x, j) => (j === i ? { ...x, ...patch } : x))),
    remove: (i: number) => set(items.filter((_, j) => j !== i)),
    move: (from: number, to: number) => { const a = [...items]; const [x] = a.splice(from, 1); a.splice(to, 0, x); set(a); },
    add: (x: T) => set([...items, x]),
  };
}

function PairsEditor({ pairs, onChange, needPictures }: { pairs: Pair[]; onChange: (p: Pair[]) => void; needPictures: boolean }) {
  const ops = listOps(pairs, onChange);
  return (
    <div className="space-y-3">
      {pairs.map((p, i) => (
        <div key={i} data-testid="pair-row" className="flex flex-wrap items-start gap-3 rounded-2xl border border-line p-3">
          <span className="mt-2 w-6 text-sm font-bold text-muted">{i + 1}</span>
          <div className="grid min-w-56 flex-1 gap-2 sm:grid-cols-2">
            <Input aria-label={`Spanish ${i + 1}`} placeholder="Spanish (el perro)" value={p.es} maxLength={120} onChange={(e) => ops.update(i, { es: e.target.value })} />
            <Input aria-label={`English ${i + 1}`} placeholder="English (the dog)" value={p.en} maxLength={120} onChange={(e) => ops.update(i, { en: e.target.value })} />
          </div>
          <div className="w-72"><ImagePicker value={p.image} onChange={(image) => ops.update(i, { image })} label={`Picture ${i + 1}`} /></div>
          <RowTools i={i} n={pairs.length} move={ops.move} remove={() => ops.remove(i)} />
        </div>
      ))}
      <Button type="button" variant="secondary" size="sm" onClick={() => ops.add({ es: "", en: "", image: {} })}>+ Add pair</Button>
      {needPictures && <p className="text-xs text-muted">This game shows pictures: give every pair one.</p>}
    </div>
  );
}

function SheetEditor({ value, onChange }: { value: ContentFor<"PRINTABLE">["sheet"]; onChange: (v: ContentFor<"PRINTABLE">["sheet"]) => void }) {
  const sheet = value ?? { style: "dictionary" as const, heading: "", words: [] };
  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="sheet-style">Sheet</Label>
          <Select id="sheet-style" value={sheet.style} onChange={(e) => onChange({ ...sheet, style: e.target.value as "dictionary" })}>
            <option value="dictionary">Picture Dictionary</option>
            <option value="write">Write the Word</option>
            <option value="connect">Connect &amp; Color</option>
          </Select>
        </div>
        <div>
          <Label htmlFor="sheet-heading">Heading</Label>
          <Input id="sheet-heading" value={sheet.heading} maxLength={160} onChange={(e) => onChange({ ...sheet, heading: e.target.value })} />
        </div>
      </div>
      <PairsEditor pairs={sheet.words} onChange={(words) => onChange({ ...sheet, words: words.slice(0, 16) })} needPictures />
    </div>
  );
}

export function ContentEditor({ resourceId, kind, initial }: { resourceId: string; kind: Kind; initial: AnyContent }) {
  const [c, setC] = useState<AnyContent>(initial);
  const [dirty, setDirty] = useState(false);
  const [msg, setMsg] = useState<{ error?: string; message?: string }>({});
  const [pending, start] = useTransition();
  const set = (patch: Partial<AnyContent>) => { setC((x) => ({ ...x, ...patch }) as AnyContent); setDirty(true); setMsg({}); };
  const save = (then?: () => void) => start(async () => { const r = await saveDraft(resourceId, c); setMsg(r ?? {}); if (r?.ok) { setDirty(false); then?.(); } });

  let body: React.ReactNode = null;
  if (kind === "FLASHCARDS") {
    const fc = c as ContentFor<"FLASHCARDS">;
    const ops = listOps(fc.cards, (cards) => set({ cards } as Partial<AnyContent>));
    body = (
      <div className="space-y-4">
        <div>
          <Label htmlFor="ins">Instructions</Label>
          <Input id="ins" value={fc.instructions} maxLength={400} onChange={(e) => set({ instructions: e.target.value } as Partial<AnyContent>)} />
        </div>
        {fc.cards.map((card, i) => (
          <div key={i} data-testid="card-row" className="flex flex-wrap items-start gap-3 rounded-2xl border border-line p-3">
            <span className="mt-2 w-6 text-sm font-bold text-muted">{i + 1}</span>
            <div className="grid min-w-56 flex-1 gap-2">
              <Input aria-label={`Front (Spanish) ${i + 1}`} placeholder="Front · Spanish" value={card.front} maxLength={120} onChange={(e) => ops.update(i, { front: e.target.value })} />
              <Input aria-label={`Back (English) ${i + 1}`} placeholder="Back · English" value={card.back} maxLength={120} onChange={(e) => ops.update(i, { back: e.target.value })} />
              <FilePicker label="Audio (optional, otherwise the device voice reads the front)" accept="audio/*" test={(m) => m.startsWith("audio/")} value={card.audio} onChange={(audio) => ops.update(i, { audio })} />
            </div>
            <div className="w-72"><ImagePicker value={card.image} onChange={(image) => ops.update(i, { image })} label={`Card ${i + 1} picture`} /></div>
            <RowTools i={i} n={fc.cards.length} move={ops.move} remove={() => ops.remove(i)} />
          </div>
        ))}
        <Button type="button" variant="secondary" size="sm" onClick={() => ops.add({ front: "", back: "", image: {}, audio: null })}>+ Add card</Button>
      </div>
    );
  } else if (kind === "GAME") {
    const g = c as ContentFor<"GAME">;
    const qops = listOps(g.questions, (questions) => set({ questions } as Partial<AnyContent>));
    body = (
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="gt">Game type</Label>
            <Select id="gt" value={g.gameType} onChange={(e) => set({ gameType: e.target.value as ContentFor<"GAME">["gameType"] } as Partial<AnyContent>)}>
              {GAME_TYPES.map((t) => <option key={t} value={t}>{GAME_TYPE_LABEL[t].label}</option>)}
            </Select>
            <p className="mt-1 text-xs text-muted">{GAME_TYPE_LABEL[g.gameType].help}</p>
          </div>
          <div>
            <Label htmlFor="gins">Instructions</Label>
            <Input id="gins" value={g.instructions} maxLength={400} onChange={(e) => set({ instructions: e.target.value } as Partial<AnyContent>)} />
          </div>
        </div>
        {g.gameType === "QUIZ" ? (
          <div className="space-y-3">
            {g.questions.map((q, i) => (
              <div key={i} className="flex flex-wrap items-start gap-3 rounded-2xl border border-line p-3">
                <span className="mt-2 w-6 text-sm font-bold text-muted">{i + 1}</span>
                <div className="grid min-w-64 flex-1 gap-2">
                  <Input aria-label={`Question ${i + 1}`} placeholder="Question (¿Qué animal es?)" value={q.prompt} maxLength={200} onChange={(e) => qops.update(i, { prompt: e.target.value })} />
                  {[0, 1, 2, 3].map((k) => (
                    <label key={k} className="flex items-center gap-2">
                      <input type="radio" name={`ans-${i}`} checked={q.answer === k} onChange={() => qops.update(i, { answer: k })} aria-label={`Answer ${k + 1} is correct`} />
                      <Input aria-label={`Question ${i + 1} answer ${k + 1}`} placeholder={`Answer ${k + 1}`} value={q.choices[k] ?? ""} maxLength={120} onChange={(e) => { const ch = [...q.choices]; while (ch.length <= k) ch.push(""); ch[k] = e.target.value; qops.update(i, { choices: ch }); }} />
                    </label>
                  ))}
                </div>
                <div className="w-72"><ImagePicker value={q.image} onChange={(image) => qops.update(i, { image })} /></div>
                <RowTools i={i} n={g.questions.length} move={qops.move} remove={() => qops.remove(i)} />
              </div>
            ))}
            <Button type="button" variant="secondary" size="sm" onClick={() => qops.add({ prompt: "", image: {}, choices: ["", "", "", ""], answer: 0 })}>+ Add question</Button>
          </div>
        ) : (
          <PairsEditor pairs={g.pairs} onChange={(pairs) => set({ pairs } as Partial<AnyContent>)} needPictures={g.gameType !== "MATCH"} />
        )}
      </div>
    );
  } else if (kind === "VIDEO") {
    const v = c as ContentFor<"VIDEO">;
    body = (
      <div className="space-y-4">
        <FilePicker label="Video file (MP4 or WebM)" accept="video/mp4,video/webm" test={(m) => m.startsWith("video/")} value={v.file} onChange={(file) => set({ file } as Partial<AnyContent>)} testId="video-upload" />
        <div>
          <Label htmlFor="yt" hint="or">YouTube link</Label>
          <Input id="yt" defaultValue={v.youtubeId ? `https://youtu.be/${v.youtubeId}` : ""} placeholder="https://www.youtube.com/watch?v=…" onBlur={(e) => set({ youtubeId: e.target.value.trim() ? youtubeIdFrom(e.target.value) : null } as Partial<AnyContent>)} />
          {v.youtubeId === null && <p className="mt-1 text-xs text-muted">Paste a full YouTube link.</p>}
        </div>
        <div>
          <Label htmlFor="cap" hint="optional">Words or subtitles shown under the video</Label>
          <textarea id="cap" rows={4} className={inputClass} value={v.captions} maxLength={4000} onChange={(e) => set({ captions: e.target.value } as Partial<AnyContent>)} />
        </div>
      </div>
    );
  } else if (kind === "SONG") {
    const s = c as ContentFor<"SONG">;
    const ops = listOps(s.lyrics, (lyrics) => set({ lyrics } as Partial<AnyContent>));
    body = (
      <div className="space-y-4">
        <FilePicker label="Song (MP3, M4A, WAV or OGG)" accept="audio/*" test={(m) => m.startsWith("audio/")} value={s.file} onChange={(file) => set({ file } as Partial<AnyContent>)} testId="song-upload" />
        <Label>Lyrics (optional)</Label>
        {s.lyrics.map((l, i) => (
          <div key={i} className="flex flex-wrap items-center gap-2">
            <Input className="min-w-56 flex-1" aria-label={`Lyric ${i + 1} Spanish`} placeholder="Spanish line" value={l.es} maxLength={200} onChange={(e) => ops.update(i, { es: e.target.value })} />
            <Input className="min-w-56 flex-1" aria-label={`Lyric ${i + 1} English`} placeholder="English (optional)" value={l.en} maxLength={200} onChange={(e) => ops.update(i, { en: e.target.value })} />
            <RowTools i={i} n={s.lyrics.length} move={ops.move} remove={() => ops.remove(i)} />
          </div>
        ))}
        <Button type="button" variant="secondary" size="sm" onClick={() => ops.add({ es: "", en: "" })}>+ Add line</Button>
      </div>
    );
  } else {
    const p = c as ContentFor<"PRINTABLE">;
    body = (
      <div className="space-y-5">
        <FilePicker label="PDF or image" accept="application/pdf,image/png,image/jpeg,image/webp,image/gif" test={(m) => m === "application/pdf" || m.startsWith("image/")} value={p.file} onChange={(file) => set({ file } as Partial<AnyContent>)} testId="printable-upload" />
        <details open={!p.file && !!p.sheet}>
          <summary className="cursor-pointer font-bold">Or build a sheet from words</summary>
          <div className="mt-3"><SheetEditor value={p.sheet} onChange={(sheet) => set({ sheet } as Partial<AnyContent>)} /></div>
        </details>
      </div>
    );
  }

  return (
    <Panel>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-2xl font-extrabold">Content</h2>
        <div className="flex flex-wrap items-center gap-2">
          {dirty && <span className="text-sm font-bold text-[#8a5a00]">Unsaved changes</span>}
          <Button type="button" variant="secondary" size="sm" disabled={pending} onClick={() => save(() => window.open(`/admin/content/${resourceId}/preview`, "_blank"))}>Save &amp; preview</Button>
          <Button type="button" size="sm" disabled={pending || !dirty} onClick={() => save()}>{pending ? "Saving…" : "Save draft"}</Button>
        </div>
      </div>
      {body}
      <div className="mt-4 space-y-2">
        <FormError message={msg.error} />
        {msg.message && <p role="status" className="text-sm font-bold text-leaf">{msg.message}</p>}
      </div>
    </Panel>
  );
}
