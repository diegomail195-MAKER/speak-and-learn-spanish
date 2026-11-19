"use client";

import { useActionState } from "react";
import { updateProfile } from "@/lib/actions/account";

export function ProfileForm({ name }: { name: string }) {
  const [state, action, pending] = useActionState(updateProfile, undefined);
  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <label className="min-w-0 flex-1 basis-64">
        <span className="mb-1.5 block font-bold text-[#3D4759]">Name</span>
        <input name="displayName" defaultValue={name} required minLength={2} maxLength={80} className="ws-input" />
      </label>
      <button className="ws-btn ws-btn-primary" disabled={pending}>{pending ? "Saving…" : "Save"}</button>
      {state?.error && <p role="alert" className="basis-full text-sm font-semibold text-[#B42318]">{state.error}</p>}
      {state?.message && <p role="status" className="basis-full text-sm font-semibold text-[#17803D]">{state.message}</p>}
    </form>
  );
}
