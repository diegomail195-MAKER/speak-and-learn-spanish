"use client";

import { useActionState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { FormError, Input, Select } from "@/components/ui/Field";
import { createStudent, resetStudentPin } from "@/lib/actions/classroom";

function PinNotice({ name, pin }: { name: string; pin: string }) {
  return (
    <p role="status" className="rounded-xl bg-sun-soft px-4 py-3 text-sm">
      <strong>{name}</strong>&apos;s PIN is <span className="font-mono text-lg font-bold tracking-widest">{pin}</span>. Write it down now — for privacy it is stored encrypted and can&apos;t be shown again (you can reset it).
    </p>
  );
}

export function AddStudentForm({ classroomId, groups }: { classroomId: string; groups: Array<{ id: string; label: string }> }) {
  const [state, action, pending] = useActionState(createStudent, undefined);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.created) ref.current?.reset();
  }, [state]);
  return (
    <form ref={ref} action={action} className="space-y-3">
      <input type="hidden" name="classroomId" value={classroomId} />
      <div className="grid gap-2 sm:grid-cols-[1.4fr_0.6fr_1.2fr]">
        <Input name="firstName" placeholder="First name" required maxLength={40} aria-label="First name" />
        <Input name="lastInitial" placeholder="Initial" maxLength={1} aria-label="Last initial" />
        <Select name="groupId" aria-label="Group" defaultValue="">
          <option value="">No group yet</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.label}
            </option>
          ))}
        </Select>
      </div>
      <Input name="spellingName" placeholder="Full name for “Spell Your Name” (optional)" maxLength={80} aria-label="Full name for spelling" />
      <FormError message={state?.error} />
      {state?.created && <PinNotice {...state.created} />}
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Adding…" : "Add student"}
      </Button>
    </form>
  );
}

export function ResetPinButton({ studentId }: { studentId: string }) {
  const [state, action, pending] = useActionState(resetStudentPin, undefined);
  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="studentId" value={studentId} />
      <Button size="sm" variant="ghost" disabled={pending}>
        Reset PIN
      </Button>
      {state?.created && <PinNotice {...state.created} />}
    </form>
  );
}
