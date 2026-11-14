"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/Button";
import { FormError, Input, Label, Select } from "@/components/ui/Field";
import { createTopic, updateTopic } from "@/lib/actions/library";
import { LibraryPicker, PickedResources, type PickItem } from "./LibraryPicker";

export type GradeOpt = { id: string; name: string };

/**
 * Create or edit a topic. A new topic can take library resources right away ("Add from Library");
 * an existing topic manages them in its activity list above this form.
 */
export function TopicForm({ topic, grades, library }: { topic?: { id: string; titleEn: string; titleEs: string; category: string; color: string; gradeId: string | null }; grades: GradeOpt[]; library?: PickItem[] }) {
  const [state, action, pending] = useActionState(topic ? updateTopic : createTopic, undefined);
  const [picked, setPicked] = useState<string[]>([]);
  return (
    <form action={action} className="space-y-4">
      <div className="grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_1fr_6rem]">
        {topic && <input type="hidden" name="topicId" value={topic.id} />}
        <div><Label htmlFor="titleEs">Spanish title</Label><Input id="titleEs" name="titleEs" defaultValue={topic?.titleEs} placeholder="Las partes del cuerpo" required maxLength={80} /></div>
        <div><Label htmlFor="titleEn">English title</Label><Input id="titleEn" name="titleEn" defaultValue={topic?.titleEn} placeholder="Parts of the Body" required maxLength={80} /></div>
        <div><Label htmlFor="category">Category</Label><Input id="category" name="category" defaultValue={topic?.category ?? "Vocabulary"} required maxLength={40} /></div>
        <div>
          <Label htmlFor="grade">Grade</Label>
          <Select id="grade" name="gradeId" defaultValue={topic?.gradeId ?? ""}>
            <option value="">No grade</option>
            {grades.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </Select>
        </div>
        <div><Label htmlFor="color">Color</Label><Input id="color" name="color" type="color" defaultValue={topic?.color ?? "#FF9F5A"} className="h-11 p-1" /></div>
      </div>
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
        <Button disabled={pending}>{pending ? "Saving…" : topic ? "Save topic" : "Create topic"}</Button>
        <FormError message={state?.error} />
        {state?.message && <p role="status" className="text-sm font-bold text-leaf">{state.message}</p>}
      </div>
    </form>
  );
}
