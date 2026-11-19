"use client";

import { useActionState, type ReactNode } from "react";
import type { AdminState } from "@/lib/actions/admin";

/** A small form bound to an admin server action, showing its result next to the controls. */
export function AdminActionForm({ action, children, className = "", confirm, testId }: { action: (s: AdminState, f: FormData) => Promise<AdminState>; children: ReactNode; className?: string; confirm?: string; testId?: string }) {
  const [state, run, pending] = useActionState(action, undefined);
  return (
    <form
      action={run}
      className={className}
      data-testid={testId}
      onSubmit={(e) => {
        if (confirm && !window.confirm(confirm)) e.preventDefault();
      }}
    >
      <fieldset disabled={pending} className="contents">{children}</fieldset>
      {state?.error && <p role="alert" className="basis-full text-sm font-semibold text-[#B42318]">{state.error}</p>}
      {state?.message && <p role="status" className="basis-full text-sm font-semibold text-[#17803D]">{state.message}</p>}
    </form>
  );
}
