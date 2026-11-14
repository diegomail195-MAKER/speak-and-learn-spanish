"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { FormError, Input, Label } from "@/components/ui/Field";
import { createGrade } from "@/lib/actions/library";

/** "Add Grade" → name → "Save Grade". Duplicates and empty names are refused on the server too. */
export function GradeForm() {
  const [state, action, pending] = useActionState(createGrade, undefined);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => { if (state?.ok) setName(""); }, [state]);
  useEffect(() => { if (open) input.current?.focus(); }, [open]);
  if (!open) return (
    <div className="space-y-2">
      <Button type="button" onClick={() => setOpen(true)}>Add Grade</Button>
      {state?.message && <p role="status" className="text-sm font-bold text-leaf">{state.message}</p>}
    </div>
  );
  const empty = !name.trim();
  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <div className="min-w-64 flex-1">
        <Label htmlFor="grade-name">Grade name</Label>
        <Input ref={input} id="grade-name" name="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Kindergarten, 1st Grade, Grade 3…" maxLength={60} />
      </div>
      <Button disabled={pending || empty}>{pending ? "Saving…" : "Save Grade"}</Button>
      <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
      <div className="w-full">
        <FormError message={state?.error} />
        {state?.message && <p role="status" className="text-sm font-bold text-leaf">{state.message}</p>}
      </div>
    </form>
  );
}
