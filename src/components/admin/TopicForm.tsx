"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { FormError, Input, Label } from "@/components/ui/Field";
import { createTopic, updateTopic } from "@/lib/actions/library";

export function TopicForm({ topic }: { topic?: { id: string; titleEn: string; titleEs: string; category: string; color: string } }) {
  const [state, action, pending] = useActionState(topic ? updateTopic : createTopic, undefined);
  return (
    <form action={action} className="grid items-end gap-3 sm:grid-cols-[1fr_1fr_1fr_6rem_auto]">
      {topic && <input type="hidden" name="topicId" value={topic.id} />}
      <div><Label htmlFor="titleEs">Spanish title</Label><Input id="titleEs" name="titleEs" defaultValue={topic?.titleEs} placeholder="Las partes del cuerpo" required maxLength={80} /></div>
      <div><Label htmlFor="titleEn">English title</Label><Input id="titleEn" name="titleEn" defaultValue={topic?.titleEn} placeholder="Parts of the Body" required maxLength={80} /></div>
      <div><Label htmlFor="category">Category</Label><Input id="category" name="category" defaultValue={topic?.category ?? "Vocabulary"} required maxLength={40} /></div>
      <div><Label htmlFor="color">Color</Label><Input id="color" name="color" type="color" defaultValue={topic?.color ?? "#FF9F5A"} className="h-11 p-1" /></div>
      <Button disabled={pending}>{pending ? "Saving…" : topic ? "Save topic" : "Create topic"}</Button>
      <div className="sm:col-span-5">
        <FormError message={state?.error} />
        {state?.message && <p role="status" className="text-sm font-bold text-leaf">{state.message}</p>}
      </div>
    </form>
  );
}
