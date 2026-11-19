"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { FormError, Input } from "@/components/ui/Field";
import { addCoTeacher } from "@/lib/actions/classroom";

/** Owner only: add a teacher of the same school as co-teacher, by email. */
export function CoTeacherForm({ classroomId }: { classroomId: string }) {
  const [state, action, pending] = useActionState(addCoTeacher, undefined);
  return (
    <form action={action} className="flex flex-wrap items-start gap-2" data-testid="coteacher-form">
      <input type="hidden" name="classroomId" value={classroomId} />
      <Input name="email" type="email" required placeholder="teacher@school.org" aria-label="Co-teacher email" className="min-h-11 max-w-xs flex-1" />
      <Button size="md" variant="secondary" disabled={pending}>{pending ? "Adding…" : "Add co-teacher"}</Button>
      <div className="basis-full">
        <FormError message={state?.error} />
        {state?.message && <p role="status" className="text-sm font-bold text-leaf">{state.message}</p>}
      </div>
    </form>
  );
}
