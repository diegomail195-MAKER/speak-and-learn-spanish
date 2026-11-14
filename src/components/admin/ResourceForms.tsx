"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/Button";
import { FormError, Input, Label, Select } from "@/components/ui/Field";
import { addLibraryContent, deleteResource, publishResource, updateResourceMeta } from "@/lib/actions/library";
import { GAME_TYPES, GAME_TYPE_LABEL, GRADES, GRADE_LABEL, KINDS, KIND_LABEL, UPLOAD_FOR, embedFor, libraryFileUrl, publicUrl, type Kind } from "@/lib/library/types";
import { uploadLibraryFile, type Uploaded } from "./upload";

type TopicOpt = { id: string; titleEn: string; titleEs: string };
const chip = "flex cursor-pointer items-center gap-2 rounded-full border border-line bg-card px-3 py-2 text-sm font-bold has-[:checked]:border-teal has-[:checked]:bg-teal-soft has-[:checked]:text-teal-dark";

function MetaFields({ topics, title = "", description = "", grades = [], topicIds = [], optional = false }: { topics: TopicOpt[]; title?: string; description?: string; grades?: string[]; topicIds?: string[]; optional?: boolean }) {
  return (
    <>
      {!optional && (
        <div>
          <Label htmlFor="title">Title</Label>
          <Input id="title" name="title" defaultValue={title} required maxLength={120} />
        </div>
      )}
      <div>
        <Label htmlFor="description" hint="optional">Short description</Label>
        <Input id="description" name="description" defaultValue={description} maxLength={400} />
      </div>
      <fieldset>
        <legend className="mb-2 text-sm font-bold text-ink-2">Grade level{optional && <span className="font-semibold text-muted"> · both if none is chosen</span>}</legend>
        <div className="flex flex-wrap gap-2">
          {GRADES.map((g) => <label key={g} className={chip}><input type="checkbox" name="grades" value={g} defaultChecked={grades.includes(g)} /> {GRADE_LABEL[g].label} <span className="text-xs font-semibold text-muted">{GRADE_LABEL[g].grades.split(" · ")[0]}</span></label>)}
        </div>
      </fieldset>
      <fieldset>
        <legend className="mb-2 text-sm font-bold text-ink-2">Topics</legend>
        <div className="flex flex-wrap gap-2">
          {topics.map((t) => <label key={t.id} className={chip}><input type="checkbox" name="topicIds" value={t.id} defaultChecked={topicIds.includes(t.id)} /> {t.titleEs} · {t.titleEn}</label>)}
        </div>
      </fieldset>
    </>
  );
}

type Method = "link" | "upload" | "build";
const METHODS: Record<Kind, Method[]> = {
  VIDEO: ["link", "upload", "build"],
  SONG: ["link", "upload", "build"],
  PRINTABLE: ["link", "upload", "build"],
  WORKSHEET: ["link", "upload", "build"],
  FLASHCARDS: ["build", "link"],
  GAME: ["build", "link"],
};
const METHOD_LABEL: Record<Method, (k: Kind) => string> = {
  link: () => "Add Link",
  upload: () => "Upload File",
  build: (k) => (k === "FLASHCARDS" || k === "GAME" ? "Create in LextroSpeak" : k === "PRINTABLE" || k === "WORKSHEET" ? "Build a sheet" : k === "SONG" ? "Open the editor (lyrics)" : "Open the editor (captions)"),
};

/** Preview of a pasted link: embedded when the site allows it here, otherwise "Open Link". */
export function LinkPreview({ url }: { url: string }) {
  const ok = publicUrl(url);
  if (!ok) return null;
  const embed = embedFor(ok);
  return embed ? (
    <div className="overflow-hidden rounded-[22px] bg-ink" data-testid="link-preview">
      <iframe title={`${embed.provider} preview`} src={embed.src} allow="encrypted-media; picture-in-picture; fullscreen" className="aspect-video w-full" />
    </div>
  ) : (
    <a href={ok} target="_blank" rel="noopener noreferrer" data-testid="open-link" className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 font-bold text-white">Open Link ↗</a>
  );
}

/** Add Content: Title, Type of Content, then Add Link / Upload File / editor, and Save. */
export function NewResourceForm({ topics, topicId }: { topics: TopicOpt[]; topicId?: string }) {
  const [state, action, pending] = useActionState(addLibraryContent, undefined);
  const [kind, setKind] = useState<Kind>("VIDEO");
  const [method, setMethod] = useState<Method>("link");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<Uploaded | null>(null);
  const [pct, setPct] = useState<number | null>(null);
  const [upErr, setUpErr] = useState<string>();
  const methods = METHODS[kind];
  const chooseKind = (k: Kind) => { setKind(k); setFile(null); setUpErr(undefined); setMethod(METHODS[k][0]); };
  const accept = UPLOAD_FOR[kind];
  const urlError = method === "link" && url.trim() && !publicUrl(url) ? "Paste a public link that starts with https:// or http://" : undefined;
  const onFile = async (f: File) => {
    setUpErr(undefined); setFile(null); setPct(0);
    try {
      const r = await uploadLibraryFile(f, setPct);
      if (accept && !accept.test(r.mime)) throw new Error(`That file doesn't fit here. Use: ${accept.label}.`);
      setFile(r);
    } catch (e) {
      setUpErr((e as Error).message);
    } finally {
      setPct(null);
    }
  };
  return (
    <form action={action} className="max-w-3xl space-y-5">
      <div>
        <Label htmlFor="title">Title</Label>
        <Input id="title" name="title" required maxLength={120} />
      </div>
      <fieldset>
        <legend className="mb-2 text-sm font-bold text-ink-2">Type of Content</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {KINDS.map((k) => (
            <label key={k} className="flex cursor-pointer items-center gap-2 rounded-2xl border-2 border-line bg-card p-3 font-bold has-[:checked]:border-ink">
              <input type="radio" name="kind" value={k} checked={kind === k} onChange={() => chooseKind(k)} />
              <span className="h-3 w-3 rounded-full" style={{ background: KIND_LABEL[k].color }} /> {KIND_LABEL[k].label}
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="mb-2 text-sm font-bold text-ink-2">How do you want to add it?</legend>
        <div className="flex flex-wrap gap-2">
          {methods.map((m) => (
            <label key={m} className={chip}>
              <input type="radio" name="method" value={m} checked={method === m} onChange={() => setMethod(m)} /> {METHOD_LABEL[m](kind)}
            </label>
          ))}
        </div>
      </fieldset>
      {method === "link" && (
        <div className="space-y-3">
          <div>
            <Label htmlFor="url">Link</Label>
            <Input id="url" name="url" type="url" inputMode="url" placeholder="https://www.youtube.com/watch?v=… or any public page" value={url} onChange={(e) => setUrl(e.target.value)} required maxLength={2000} />
            {urlError && <p role="alert" className="mt-1 text-sm font-bold text-coral-dark">{urlError}</p>}
          </div>
          <LinkPreview url={url} />
        </div>
      )}
      {method === "upload" && accept && (
        <div>
          <Label htmlFor="upload">{accept.label}</Label>
          {file ? (
            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-paper px-3 py-2" data-testid="uploaded-file">
              <a href={libraryFileUrl(file.id)} target="_blank" rel="noopener" className="font-bold text-sky hover:underline">{file.name}</a>
              <span className="text-xs text-muted">{file.mime}</span>
              <button type="button" onClick={() => setFile(null)} className="ml-auto text-sm font-bold text-coral-dark">Remove</button>
            </div>
          ) : (
            <input id="upload" type="file" accept={accept.accept} data-testid="add-content-upload" className="block w-full text-sm file:mr-3 file:rounded-full file:border-0 file:bg-ink file:px-4 file:py-2 file:font-bold file:text-white"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) void onFile(f); e.target.value = ""; }} />
          )}
          <input type="hidden" name="file" value={file ? JSON.stringify({ fileId: file.id, name: file.name, mime: file.mime }) : ""} />
          {pct !== null && <p className="mt-1 text-sm font-bold text-teal-dark" role="status">Uploading… {pct}%</p>}
          {upErr && <p className="mt-1 text-sm font-bold text-coral-dark" role="alert">{upErr}</p>}
        </div>
      )}
      {method === "build" && kind === "GAME" && (
        <div className="max-w-sm">
          <Label htmlFor="gameType">Game</Label>
          <Select id="gameType" name="gameType" defaultValue="MEMORY">
            {GAME_TYPES.map((t) => <option key={t} value={t}>{GAME_TYPE_LABEL[t].label}</option>)}
          </Select>
        </div>
      )}
      <div className="space-y-4 rounded-2xl border border-line p-4">
        <p className="text-sm font-bold text-ink-2">Optional details <span className="font-semibold text-muted">· you can also add it to topics and activities later with Add from Library</span></p>
        <MetaFields topics={topics} topicIds={topicId ? [topicId] : []} optional />
      </div>
      <FormError message={state?.error} />
      <Button disabled={pending || pct !== null || (method === "upload" && !file) || !!urlError}>{pending ? "Saving…" : "Save"}</Button>
      {method === "build" && <p className="text-sm text-muted">Save opens the editor. Then preview and publish.</p>}
    </form>
  );
}

export function MetaForm({ resourceId, topics, title, description, grades, topicIds }: { resourceId: string; topics: TopicOpt[]; title: string; description: string; grades: string[]; topicIds: string[] }) {
  const [state, action, pending] = useActionState(updateResourceMeta, undefined);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="resourceId" value={resourceId} />
      <MetaFields topics={topics} title={title} description={description} grades={grades} topicIds={topicIds} />
      <FormError message={state?.error} />
      {state?.message && <p role="status" className="text-sm font-bold text-leaf">{state.message}</p>}
      <Button variant="secondary" size="sm" disabled={pending}>{pending ? "Saving…" : "Save details"}</Button>
    </form>
  );
}

export function PublishButton({ resourceId, label }: { resourceId: string; label: string }) {
  const [state, action, pending] = useActionState(publishResource, undefined);
  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="resourceId" value={resourceId} />
      <Button disabled={pending}>{pending ? "Publishing…" : label}</Button>
      <FormError message={state?.error} />
      {state?.message && <p role="status" className="text-sm font-bold text-leaf">{state.message}</p>}
    </form>
  );
}

export function DeleteButton({ resourceId, back }: { resourceId: string; back?: string }) {
  const [state, action, pending] = useActionState(deleteResource, undefined);
  const [sure, setSure] = useState(false);
  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="resourceId" value={resourceId} />
      {back && <input type="hidden" name="back" value={back} />}
      {sure ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-bold">Delete it from the library for good?</span>
          <Button variant="danger" size="sm" disabled={pending}>Yes, delete</Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => setSure(false)}>Cancel</Button>
        </div>
      ) : (
        <Button type="button" variant="danger" size="sm" onClick={() => setSure(true)}>Delete from Library</Button>
      )}
      <FormError message={state?.error} />
    </form>
  );
}
