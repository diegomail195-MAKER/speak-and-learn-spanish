"use client";

import { startTransition, useActionState, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { FormError, inputClass } from "@/components/ui/Field";
import { Menu, MenuItem } from "@/components/ui/Menu";
import { Badge } from "@/components/ui/Panel";
import { UiIcon } from "@/components/ui/icons";
import { resetStudentPin, updateRosterStudent } from "@/lib/actions/classroom";
import { PinNotice } from "./StudentForms";

export type RosterStudent = {
  id: string;
  firstName: string;
  lastInitial: string;
  username: string;
  loginType: "PIN" | "PASSWORD";
  active: boolean;
  groups: string[];
  /** Topic tasks this student received, how many are finished, and the average progress (null = none). */
  assigned: number;
  completed: number;
  progress: number | null;
  tasks: Array<{ id: string; title: string; pct: number }>;
};

/**
 * Columns of the roster grid (wide containers). Name and Username get the room; numbers are
 * compact. The same element turns into a card per student when its container is narrow.
 */
export const ROSTER_COLS = "@4xl:grid-cols-[minmax(9rem,1.5fr)_minmax(8rem,1.2fr)_4.5rem_minmax(6rem,1fr)_5rem_5.5rem_minmax(8.5rem,1fr)_8.5rem]";

export function RosterHeader() {
  const th = "flex min-h-12 items-center px-3 py-2 text-[13px] font-bold leading-tight text-ink";
  return (
    <div role="row" className={`hidden border-b border-line bg-paper-2 @4xl:grid ${ROSTER_COLS}`}>
      <span role="columnheader" className={th}>Student Name</span>
      <span role="columnheader" className={th}>Username</span>
      <span role="columnheader" className={th}>Login</span>
      <span role="columnheader" className={th}>Groups</span>
      <span role="columnheader" className={`${th} justify-center text-center`}>Tasks assigned</span>
      <span role="columnheader" className={`${th} justify-center text-center`}>Tasks completed</span>
      <span role="columnheader" className={th}>Progress</span>
      <span role="columnheader" className={`${th} justify-end`}>Actions</span>
    </div>
  );
}

export function RosterRow({ student: s }: { student: RosterStudent }) {
  const [editing, setEditing] = useState(false);
  const [viewing, setViewing] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [state, action, pending] = useActionState(updateRosterStudent, undefined);
  const [reset, resetAction, resetting] = useActionState(resetStudentPin, undefined);
  useEffect(() => {
    if (state?.ok) setEditing(false);
  }, [state]);
  useEffect(() => {
    if (reset) setConfirmReset(false);
  }, [reset]);
  const secretLabel = s.loginType === "PASSWORD" ? "Reset Password" : "Reset PIN";
  const fullName = `${s.firstName}${s.lastInitial ? ` ${s.lastInitial}.` : ""}`;
  const created = state?.created ?? reset?.created;
  const td = "flex min-h-14 min-w-0 items-center px-3 py-2";
  const dl = "flex justify-between gap-3 border-b border-line py-2 last:border-0 @4xl:block @4xl:border-0 @4xl:py-0";

  const doReset = () => {
    const fd = new FormData();
    fd.set("studentId", s.id);
    startTransition(() => resetAction(fd));
  };

  return (
    <div role="rowgroup" className="border-b border-line last:border-b-0" data-testid="roster-row">
      {/* Wide: one grid row. Narrow: a card with name, progress and actions; the rest under Details. */}
      <div role="row" className={`grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 p-4 @4xl:p-0 ${ROSTER_COLS}`}>
        <div role="cell" className={`${td} col-span-1 px-0 @4xl:px-3`}>
          <span className="min-w-0">
            <span className="block break-words text-[15px] font-bold text-ink">{fullName}</span>
            {!s.active && <span className="mt-1 inline-block"><Badge tone="coral">can’t sign in</Badge></span>}
          </span>
        </div>
        <div role="cell" className={`${td} hidden break-all font-mono text-sm text-ink-2 @4xl:flex`}>{s.username}</div>
        <div role="cell" className={`${td} hidden text-sm text-ink-2 @4xl:flex`}>{s.loginType === "PASSWORD" ? "password" : "PIN"}</div>
        <div role="cell" className={`${td} hidden text-sm text-ink-2 @4xl:flex`}>{s.groups.join(", ") || <span className="text-muted">—</span>}</div>
        <div role="cell" className={`${td} hidden justify-center text-sm font-semibold tabular-nums @4xl:flex`}>{s.assigned}</div>
        <div role="cell" className={`${td} hidden justify-center text-sm font-semibold tabular-nums @4xl:flex`}>{s.completed}</div>
        <div role="cell" className={`${td} order-3 col-span-2 px-0 pt-3 @4xl:order-none @4xl:col-span-1 @4xl:px-3 @4xl:pt-2`}>
          <Progress pct={s.progress} />
        </div>
        <div role="cell" className={`${td} justify-end gap-2 px-0 @4xl:px-3`}>
          <Button size="sm" variant="secondary" aria-expanded={viewing} onClick={() => setViewing((v) => !v)} className="border-primary/40 text-primary hover:bg-primary-soft" data-testid="roster-view">
            <span className="@4xl:hidden">{viewing ? "Hide" : "Details"}</span>
            <span className="hidden @4xl:inline">{viewing ? "Hide" : "View"}</span>
          </Button>
          <Menu
            label={`Actions for ${fullName}`}
            width={220}
            testId="roster-menu"
            trigger={({ ref, props, open }) => (
              <button ref={ref} {...props} aria-label={`More actions for ${fullName}`} className={`grid size-11 place-items-center rounded-ctl border ${open ? "border-primary bg-primary-soft text-primary" : "border-line bg-card text-ink-2 hover:bg-paper-2"}`} data-testid="roster-more">
                <UiIcon name="more" strokeWidth={3} />
              </button>
            )}
          >
            <MenuItem icon="edit" onSelect={() => (setViewing(false), setEditing(true))}>Edit</MenuItem>
            <MenuItem icon="key" onSelect={() => setConfirmReset(true)} disabled={resetting}>{secretLabel}</MenuItem>
          </Menu>
        </div>
      </div>

      {viewing && !editing && (
        <div className="mx-4 mb-4 rounded-[10px] border border-line bg-paper p-4 text-sm @4xl:mx-3" data-testid="roster-details">
          <dl className="grid gap-x-6 @4xl:grid-cols-4 @4xl:gap-y-3">
            <div className={dl}><dt className="font-semibold text-muted">Username</dt><dd className="break-all font-mono text-ink">{s.username}</dd></div>
            <div className={dl}><dt className="font-semibold text-muted">Login</dt><dd className="text-ink">{s.loginType === "PASSWORD" ? "password" : "PIN"}</dd></div>
            <div className={dl}><dt className="font-semibold text-muted">Groups</dt><dd className="text-right text-ink @4xl:text-left">{s.groups.join(", ") || "—"}</dd></div>
            <div className={dl}><dt className="font-semibold text-muted">Tasks</dt><dd className="text-ink">{s.completed} of {s.assigned} completed</dd></div>
          </dl>
          {s.tasks.length > 0 && (
            <ul className="mt-3 space-y-2 border-t border-line pt-3">
              {s.tasks.map((t) => (
                <li key={t.id} className="flex flex-wrap items-center justify-between gap-2">
                  <span className="min-w-0 break-words font-semibold text-ink-2">{t.title}</span>
                  <Progress pct={t.pct} />
                </li>
              ))}
            </ul>
          )}
          <div className="mt-3 flex justify-end">
            <Button size="sm" variant="secondary" onClick={() => (setViewing(false), setEditing(true))}>
              <UiIcon name="edit" size={16} /> Edit
            </Button>
          </div>
        </div>
      )}

      {editing && (
        <div className="mx-4 mb-4 rounded-[10px] border border-line bg-paper p-4 @4xl:mx-3">
          <form action={action} className="grid items-end gap-3 @xl:grid-cols-2 @4xl:grid-cols-[1.3fr_0.6fr_1.2fr_1.1fr_auto]">
            <input type="hidden" name="studentId" value={s.id} />
            <label className="text-xs font-bold text-ink-2">First name<input name="firstName" defaultValue={s.firstName} required maxLength={40} className={`${inputClass} mt-1`} /></label>
            <label className="text-xs font-bold text-ink-2">Initial<input name="lastInitial" defaultValue={s.lastInitial} maxLength={1} className={`${inputClass} mt-1`} /></label>
            <label className="text-xs font-bold text-ink-2">Username<input name="username" defaultValue={s.username} required maxLength={30} pattern="[a-z0-9]{2,30}" className={`${inputClass} mt-1 font-mono`} /></label>
            <label className="text-xs font-bold text-ink-2">
              Login Type
              <select name="loginType" defaultValue={s.loginType} className={`${inputClass} mt-1`}>
                <option value="PIN">PIN (4 numbers)</option>
                <option value="PASSWORD">Password</option>
              </select>
            </label>
            <div className="flex gap-2">
              <Button size="sm" disabled={pending}>{pending ? "Saving…" : "Save"}</Button>
              <Button size="sm" type="button" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
            </div>
            <label className="flex flex-wrap items-center gap-2 text-sm font-semibold @xl:col-span-2 @4xl:col-span-5">
              <input type="checkbox" name="active" defaultChecked={s.active} className="h-4 w-4" /> Can sign in
              <span className="text-xs font-normal text-muted">Changing the login type creates a new PIN or password, shown once.</span>
            </label>
          </form>
          <div className="mt-2"><FormError message={state?.error} /></div>
        </div>
      )}

      {created && (
        <div className="px-4 pb-4 @4xl:px-3">
          <PinNotice {...created} />
        </div>
      )}

      {confirmReset && (
        <ConfirmDialog
          title={`${secretLabel} for ${fullName}?`}
          body={<p>The current {s.loginType === "PASSWORD" ? "password" : "PIN"} stops working. The new one is shown once, here.</p>}
          confirmLabel={secretLabel}
          busy={resetting}
          onConfirm={doReset}
          onCancel={() => setConfirmReset(false)}
        />
      )}
    </div>
  );
}

function Progress({ pct }: { pct: number | null }) {
  if (pct === null) return <span className="text-sm text-muted">—</span>;
  return (
    <span className="flex w-full max-w-48 items-center gap-2">
      <span className="h-2 min-w-12 flex-1 overflow-hidden rounded-full bg-paper-2" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Progress">
        <span className="block h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
      </span>
      <span className="w-10 text-right text-sm font-semibold tabular-nums text-ink-2">{pct}%</span>
    </span>
  );
}
