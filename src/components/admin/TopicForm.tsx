"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { Art } from "@/components/ui/Art";
import { Button } from "@/components/ui/Button";
import { FormError, Input, Label, Select } from "@/components/ui/Field";
import { createTopic, updateTopic } from "@/lib/actions/library";
import { LANGUAGE_LABEL, TOPIC_LANGUAGES } from "@/lib/library/topicMeta";
import { LibraryPicker, PickedResources, type PickItem } from "./LibraryPicker";

export type GradeOpt = { id: string; name: string };

/** Thumbnails a topic can use: the built-in LextroSpeak illustrations. */
const THUMBNAILS = [
  "topic:greetings", "topic:numbers", "topic:colors", "topic:shapes", "topic:animals",
  "animals:perro", "animals:oveja", "animals:tigre", "animals:capibara", "animals:conejo", "animals:tortuga", "animals:delfin", "animals:panda",
  "pinita:happy",
];

/**
 * Create or edit a topic. A new topic can take library resources right away ("Add from Library");
 * an existing topic manages them in its activity list above this form.
 */
export function TopicForm({ topic, grades, library, categories = [], defaultLanguage = "es" }: { defaultLanguage?: string; topic?: { id: string; titleEn: string; titleEs: string; category: string; color: string; gradeId: string | null; description: string; art: string; language?: string }; categories?: string[]; grades: GradeOpt[]; library?: PickItem[] }) {
  const [state, action, pending] = useActionState(topic ? updateTopic : createTopic, undefined);
  const router = useRouter();
  const created = state?.topicId;
  useEffect(() => {
    if (!created) return;
    const url = `/admin/topics/${created}`;
    router.push(url);
    // If the client navigation doesn't start (it can stay queued behind the action's revalidation),
    // open the topic with a normal page load.
    const t = window.setTimeout(() => {
      if (!window.location.pathname.endsWith(created)) window.location.assign(url);
    }, 1500);
    return () => window.clearTimeout(t);
  }, [created, router]);
  const [picked, setPicked] = useState<string[]>([]);
  const [art, setArt] = useState(topic?.art || "topic:greetings");
  const [color, setColor] = useState(topic?.color ?? "#FF9F5A");
  const [desc, setDesc] = useState(topic?.description ?? "");
  return (
    <form action={action} className="space-y-4">
      <div className="grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_1fr_1fr_6rem]">
        {topic && <input type="hidden" name="topicId" value={topic.id} />}
        <div><Label htmlFor="titleEs">Spanish title</Label><Input id="titleEs" name="titleEs" defaultValue={topic?.titleEs} placeholder="Las partes del cuerpo" required maxLength={80} /></div>
        <div><Label htmlFor="titleEn">English title</Label><Input id="titleEn" name="titleEn" defaultValue={topic?.titleEn} placeholder="Parts of the Body" required maxLength={80} /></div>
        <div>
          <Label htmlFor="category">Category</Label>
          <Input id="category" name="category" defaultValue={topic?.category ?? "Vocabulary"} required maxLength={40} list="topic-categories" />
          <datalist id="topic-categories">{categories.map((c) => <option key={c} value={c} />)}</datalist>
        </div>
        <div>
          <Label htmlFor="language">Language</Label>
          <Select id="language" name="language" defaultValue={topic?.language ?? defaultLanguage}>
            {TOPIC_LANGUAGES.map((l) => <option key={l} value={l}>{LANGUAGE_LABEL[l]}</option>)}
          </Select>
        </div>
        <div>
          <Label htmlFor="grade">Grade</Label>
          <Select id="grade" name="gradeId" defaultValue={topic?.gradeId ?? ""}>
            <option value="">No grade</option>
            {grades.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </Select>
        </div>
        <div><Label htmlFor="color">Color</Label><Input id="color" name="color" type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-11 p-1" /></div>
      </div>
      <div>
        <Label htmlFor="description" hint={`${desc.length}/200`}>Short description</Label>
        <textarea
          id="description"
          name="description"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          maxLength={200}
          rows={2}
          placeholder="Practica cómo saludar y presentarte en español."
          className="w-full rounded-xl border border-line bg-card px-3.5 py-2.5 text-[0.98rem] text-ink placeholder:text-muted/70 focus:border-sky focus:outline-none focus:ring-3 focus:ring-sky/20"
          data-testid="topic-description-input"
        />
      </div>
      <fieldset>
        <legend className="mb-1.5 block text-sm font-bold text-ink-2">Thumbnail</legend>
        <input type="hidden" name="art" value={art} />
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Thumbnail">
          {THUMBNAILS.map((k) => (
            <button
              key={k}
              type="button"
              role="radio"
              aria-checked={art === k}
              aria-label={k.split(":")[1]}
              onClick={() => setArt(k)}
              className={`grid h-16 w-16 place-items-center rounded-xl border ${art === k ? "border-[#620D78] outline outline-2 outline-offset-2 outline-[#620D78]" : "border-[#E2E6EC] hover:border-[#B9C0CC]"} focus-visible:outline focus-visible:outline-3 focus-visible:outline-[#FF5148]`}
              style={{ background: `color-mix(in srgb, ${color} 22%, white)` }}
              data-testid="thumbnail-option"
            >
              <Art k={k} className="h-11 w-11" />
            </button>
          ))}
        </div>
      </fieldset>
      {!topic && library && (
        <div className="space-y-2 rounded-2xl border border-line p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm font-bold text-ink-2">Library resources</span>
            <LibraryPicker items={library} excludeIds={picked} onAdd={(ids) => setPicked((p) => [...p, ...ids.filter((id) => !p.includes(id))])} />
          </div>
          <PickedResources items={library} picked={picked} onRemove={(id) => setPicked((p) => p.filter((x) => x !== id))} />
        </div>
      )}
      <div className="flex flex-wrap items-center gap-3">
        {!topic && (
          <Button name="intent" value="draft" variant="secondary" disabled={pending} data-testid="save-topic-draft">Save as draft</Button>
        )}
        <Button name="intent" value="publish" disabled={pending}>{pending || created ? "Saving…" : topic ? "Save topic" : "Create topic"}</Button>
        {!topic && <p className="basis-full text-sm text-muted">“Create topic” publishes it for teachers. “Save as draft” keeps it in Platform Admin until you review and publish it.</p>}
        <FormError message={state?.error} />
        {state?.message && <p role="status" className="text-sm font-bold text-leaf">{state.message}</p>}
      </div>
    </form>
  );
}
