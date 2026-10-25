"use client";

import { useActionState, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/Field";
import { signInStudent } from "@/lib/actions/auth";

type S = { id: string; firstName: string; lastInitial: string; avatar: string };

export function StudentPicker({ code, students }: { code: string; students: S[] }) {
  const [picked, setPicked] = useState<S | null>(null);
  const [pin, setPin] = useState("");
  const [state, action, pending] = useActionState(signInStudent, undefined);

  if (students.length === 0) {
    return <p className="mt-8 rounded-xl2 bg-paper-2 p-6 text-center text-ink-2">Your teacher hasn&apos;t added students to this class yet.</p>;
  }

  if (!picked) {
    return (
      <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {students.map((s) => (
          <li key={s.id}>
            <button
              type="button"
              onClick={() => setPicked(s)}
              className="flex w-full items-center gap-3 rounded-2xl border border-line bg-card p-3 text-left text-lg font-bold hover:border-teal focus-visible:border-teal"
            >
              <Avatar name={s.firstName} kind={s.avatar} />
              <span>
                {s.firstName} {s.lastInitial && `${s.lastInitial}.`}
              </span>
            </button>
          </li>
        ))}
      </ul>
    );
  }

  const press = (d: string) => setPin((p) => (p.length < 4 ? p + d : p));
  return (
    <form action={action} className="mx-auto mt-6 max-w-xs text-center">
      <input type="hidden" name="code" value={code} />
      <input type="hidden" name="studentId" value={picked.id} />
      <input type="hidden" name="pin" value={pin} />
      <div className="flex flex-col items-center gap-2">
        <Avatar name={picked.firstName} kind={picked.avatar} size={72} />
        <p className="font-display text-2xl font-semibold">Hola, {picked.firstName}</p>
        <p className="text-ink-2">Type your 4-number PIN.</p>
      </div>
      <div className="my-5 flex justify-center gap-3" aria-live="polite" aria-label={`${pin.length} of 4 digits entered`}>
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={`h-5 w-5 rounded-full border-2 ${i < pin.length ? "border-teal bg-teal" : "border-line"}`} />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2.5">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
          <button key={d} type="button" onClick={() => press(d)} className="h-16 rounded-2xl border border-line bg-card font-display text-2xl font-semibold hover:border-teal">
            {d}
          </button>
        ))}
        <button type="button" onClick={() => setPin("")} className="h-16 rounded-2xl text-sm font-bold text-muted hover:bg-paper-2">
          Clear
        </button>
        <button type="button" onClick={() => press("0")} className="h-16 rounded-2xl border border-line bg-card font-display text-2xl font-semibold hover:border-teal">
          0
        </button>
        <button type="button" onClick={() => setPin((p) => p.slice(0, -1))} className="h-16 rounded-2xl text-sm font-bold text-muted hover:bg-paper-2" aria-label="Delete last digit">
          ⌫
        </button>
      </div>
      <div className="mt-4">
        <FormError message={state?.error} />
      </div>
      <Button type="submit" variant="voice" size="lg" className="mt-4 w-full" disabled={pin.length !== 4 || pending}>
        {pending ? "…" : "Go!"}
      </Button>
      <button type="button" onClick={() => { setPicked(null); setPin(""); }} className="mt-4 text-sm font-bold text-muted hover:text-ink">
        That&apos;s not me
      </button>
    </form>
  );
}
