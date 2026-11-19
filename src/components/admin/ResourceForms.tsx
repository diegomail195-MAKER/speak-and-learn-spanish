"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/Button";
import { FormError, Input, Label, Select } from "@/components/ui/Field";
import { createResource, deleteResource, publishResource, updateResourceMeta } from "@/lib/actions/library";
import { GAME_TYPES, GAME_TYPE_LABEL, GRADES, GRADE_LABEL, KINDS, KIND_LABEL, type Kind } from "@/lib/library/types";

type TopicOpt = { id: string; titleEn: string; titleEs: string };
const chip = "flex cursor-pointer items-center gap-2 rounded-full border border-line bg-card px-3 py-2 text-sm font-bold has-[:checked]:border-teal has-[:checked]:bg-teal-soft has-[:checked]:text-teal-dark";

function MetaFields({ topics, title = "", description = "", grades = [], topicIds = [] }: { topics: TopicOpt[]; title?: string; description?: string; grades?: string[]; topicIds?: string[] }) {
  return (
    <>
      <div>
        <Label htmlFor="title">Title</Label>
        <Input id="title" name="title" defaultValue={title} required maxLength={120} />
      </div>
      <div>
        <Label htmlFor="description" hint="optional">Short description</Label>
        <Input id="description" name="description" defaultValue={description} maxLength={400} />
      </div>
      <fieldset>
        <legend className="mb-2 text-sm font-bold text-ink-2">Grades</legend>
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

export function NewResourceForm({ topics, topicId }: { topics: TopicOpt[]; topicId?: string }) {
  const [state, action, pending] = useActionState(createResource, undefined);
  const [kind, setKind] = useState<Kind>("VIDEO");
  return (
    <form action={action} className="max-w-3xl space-y-5">
      <fieldset>
        <legend className="mb-2 text-sm font-bold text-ink-2">Type of content</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {KINDS.map((k) => (
            <label key={k} className="flex cursor-pointer items-center gap-2 rounded-2xl border-2 border-line bg-card p-3 font-bold has-[:checked]:border-ink">
              <input type="radio" name="kind" value={k} checked={kind === k} onChange={() => setKind(k)} />
              <span className="h-3 w-3 rounded-full" style={{ background: KIND_LABEL[k].color }} /> {KIND_LABEL[k].label}
            </label>
          ))}
        </div>
      </fieldset>
      {kind === "GAME" && (
        <div className="max-w-sm">
          <Label htmlFor="gameType">Game</Label>
          <Select id="gameType" name="gameType" defaultValue="MEMORY">
            {GAME_TYPES.map((t) => <option key={t} value={t}>{GAME_TYPE_LABEL[t].label}</option>)}
          </Select>
        </div>
      )}
      <MetaFields topics={topics} topicIds={topicId ? [topicId] : []} />
      <FormError message={state?.error} />
      <Button disabled={pending}>{pending ? "Creating…" : "Create draft and continue"}</Button>
      <p className="text-sm text-muted">Next you upload the file or build the activity, preview it, and publish it.</p>
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
