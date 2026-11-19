"use client";

import { useActionState, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { FormError, inputClass } from "@/components/ui/Field";
import { Badge } from "@/components/ui/Panel";
import { resetStudentPin, updateRosterStudent } from "@/lib/actions/classroom";
import { PinNotice } from "./StudentForms";

type Row = { id: string; firstName: string; lastInitial: string; username: string; loginType: "PIN" | "PASSWORD"; active: boolean; groups: string[] };

export function RosterRow({ student: s }: { student: Row }) {
  const [editing, setEditing] = useState(false);
  const [state, action, pending] = useActionState(updateRosterStudent, undefined);
  const [reset, resetAction, resetting] = useActionState(resetStudentPin, undefined);
  useEffect(() => {
    if (state?.ok) setEditing(false);
  }, [state]);
  const secretLabel = s.loginType === "PASSWORD" ? "Reset Password" : "Reset PIN";

  if (editing) {
    return (
      <tr className="bg-paper">
        <td colSpan={6} className="px-3 py-3">
          <form action={action} className="grid items-end gap-2 sm:grid-cols-[1.3fr_0.6fr_1.2fr_1.1fr_auto]">
            <input type="hidden" name="studentId" value={s.id} />
            <label className="text-xs font-bold text-ink-2">First name<input name="firstName" defaultValue={s.firstName} required maxLength={40} className={`${inputClass} mt-1 py-2`} /></label>
            <label className="text-xs font-bold text-ink-2">Initial<input name="lastInitial" defaultValue={s.lastInitial} maxLength={1} className={`${inputClass} mt-1 py-2`} /></label>
            <label className="text-xs font-bold text-ink-2">Username<input name="username" defaultValue={s.username} required maxLength={30} pattern="[a-z0-9]{2,30}" className={`${inputClass} mt-1 py-2 font-mono`} /></label>
            <label className="text-xs font-bold text-ink-2">
              Login Type
              <select name="loginType" defaultValue={s.loginType} className={`${inputClass} mt-1 py-2`}>
                <option value="PIN">PIN (4 numbers)</option>
                <option value="PASSWORD">Password</option>
              </select>
            </label>
            <div className="flex gap-2">
              <Button size="sm" disabled={pending}>{pending ? "Saving…" : "Save"}</Button>
              <Button size="sm" type="button" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
            </div>
            <label className="flex items-center gap-2 text-sm font-semibold sm:col-span-5">
              <input type="checkbox" name="active" defaultChecked={s.active} /> Can sign in
              <span className="text-xs font-normal text-muted">Changing the login type creates a new PIN or password, shown once.</span>
            </label>
          </form>
          <div className="mt-2"><FormError message={state?.error} /></div>
        </td>
      </tr>
    );
  }

  return (
    <>
      <tr data-testid="roster-row">
        <td className="px-3 py-3 font-bold">{s.firstName} {!s.active && <Badge tone="coral">can’t sign in</Badge>}</td>
        <td className="px-3 py-3">{s.lastInitial}</td>
        <td className="px-3 py-3 font-mono">{s.username}</td>
        <td className="px-3 py-3">{s.loginType === "PASSWORD" ? "password" : "PIN"}</td>
        <td className="px-3 py-3">{s.groups.join(", ") || <span className="text-muted">—</span>}</td>
        <td className="px-3 py-3">
          <div className="flex flex-wrap gap-1">
            <Button size="sm" variant="secondary" type="button" onClick={() => setEditing(true)}>Edit</Button>
            <form action={resetAction}>
              <input type="hidden" name="studentId" value={s.id} />
              <Button size="sm" variant="ghost" disabled={resetting}>{secretLabel}</Button>
            </form>
          </div>
        </td>
      </tr>
      {(reset?.created || state?.created) && (
        <tr>
          <td colSpan={6} className="px-3 pb-3">
            <PinNotice {...(state?.created ?? reset!.created!)} />
          </td>
        </tr>
      )}
    </>
  );
}
