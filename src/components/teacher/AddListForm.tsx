"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { FormError, Label, Select, inputClass } from "@/components/ui/Field";
import { Panel } from "@/components/ui/Panel";
import { addStudentList, type ListResult } from "@/lib/actions/classroom";
import { checkRows, parseStudentList, type ListRow } from "@/lib/roster";

type Roster = Array<{ firstName: string; lastInitial: string; username: string }>;

export function AddListForm({ classroomId, roster, groups }: { classroomId: string; roster: Roster; groups: Array<{ id: string; label: string }> }) {
  const [text, setText] = useState("");
  const [rows, setRows] = useState<ListRow[] | null>(null);
  const [loginType, setLoginType] = useState<"PIN" | "PASSWORD">("PIN");
  const [groupId, setGroupId] = useState("");
  const [result, setResult] = useState<ListResult | null>(null);
  const [pending, start] = useTransition();
  const checked = useMemo(() => (rows ? checkRows(rows, roster) : []), [rows, roster]);
  const blocking = checked.filter((r) => r.problems.length).length;

  const edit = (i: number, patch: Partial<ListRow>) => setRows((rs) => rs!.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const remove = (i: number) => setRows((rs) => rs!.filter((_, j) => j !== i));

  if (result?.created) {
    const what = result.loginType === "PASSWORD" ? "Password" : "PIN";
    return (
      <Panel>
        <h2 className="font-display text-2xl font-bold">{result.created.length} students added</h2>
        <p className="mt-1 text-sm text-muted">Write these down or print this page now. For privacy they are stored encrypted and can’t be shown again (you can reset them in the Roster).</p>
        <table className="mt-4 w-full text-left text-sm">
          <thead className="bg-sky-soft">
            <tr><th className="px-3 py-2">Name</th><th className="px-3 py-2">Username</th><th className="px-3 py-2">{what}</th></tr>
          </thead>
          <tbody className="divide-y divide-line">
            {result.created.map((c) => (
              <tr key={c.username}><td className="px-3 py-2 font-bold">{c.name}</td><td className="px-3 py-2 font-mono">{c.username}</td><td className="px-3 py-2 font-mono font-bold">{c.secret}</td></tr>
            ))}
          </tbody>
        </table>
        <div className="no-print mt-5 flex flex-wrap gap-2">
          <Button type="button" variant="secondary" onClick={() => window.print()}>Print</Button>
          <Link href={`/teacher/classes/${classroomId}/roster`} className="inline-flex h-11 items-center rounded-full bg-coral px-5 font-bold text-white hover:bg-coral-dark">Go to the Roster</Link>
        </div>
      </Panel>
    );
  }

  return (
    <div className="space-y-6">
      <Panel>
        <Label htmlFor="list">Student list</Label>
        <textarea id="list" value={text} onChange={(e) => setText(e.target.value)} rows={8} className={`${inputClass} font-mono`} placeholder={"Ana López\nLópez, Carlos\nMaría G"} />
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <Button type="button" onClick={() => { setRows(parseStudentList(text)); setResult(null); }} disabled={!text.trim()}>
            Preview
          </Button>
          <span className="text-sm text-muted">Only first names and last initials are kept.</span>
        </div>
      </Panel>

      {rows && (
        <Panel>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-2xl font-bold">Preview · {rows.length} students</h2>
              <p className="text-sm text-muted">{blocking ? `${blocking} row(s) need a fix: edit or remove them.` : "Everything looks good."}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Select aria-label="Login Type" value={loginType} onChange={(e) => setLoginType(e.target.value as "PIN" | "PASSWORD")} className="w-auto">
                <option value="PIN">Login Type: PIN</option>
                <option value="PASSWORD">Login Type: Password</option>
              </Select>
              <Select aria-label="Add to group" value={groupId} onChange={(e) => setGroupId(e.target.value)} className="w-auto">
                <option value="">No group</option>
                {groups.map((g) => <option key={g.id} value={g.id}>{g.label}</option>)}
              </Select>
            </div>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[620px] text-left text-sm">
              <thead className="bg-sky-soft">
                <tr><th className="px-3 py-2">First name</th><th className="px-3 py-2">Last initial</th><th className="px-3 py-2">Username</th><th className="px-3 py-2">Check</th><th className="px-3 py-2"><span className="sr-only">Remove</span></th></tr>
              </thead>
              <tbody className="divide-y divide-line">
                {checked.map((r, i) => (
                  <tr key={i} data-testid="list-row" className={r.problems.length ? "bg-coral-soft/60" : ""}>
                    <td className="px-2 py-1.5"><input aria-label={`First name, row ${i + 1}`} className={`${inputClass} py-1.5`} value={r.firstName} maxLength={40} onChange={(e) => edit(i, { firstName: e.target.value })} /></td>
                    <td className="px-2 py-1.5"><input aria-label={`Last initial, row ${i + 1}`} className={`${inputClass} w-16 py-1.5`} value={r.lastInitial} maxLength={1} onChange={(e) => edit(i, { lastInitial: e.target.value.toUpperCase() })} /></td>
                    <td className="px-2 py-1.5"><input aria-label={`Username, row ${i + 1}`} className={`${inputClass} py-1.5 font-mono`} value={r.username} maxLength={30} onChange={(e) => edit(i, { username: e.target.value.toLowerCase() })} /></td>
                    <td className="px-3 py-1.5">{r.problems.length ? <span className="font-bold text-coral-dark">{r.problems.join(" ")}</span> : <span className="font-bold text-leaf">✓ OK</span>}</td>
                    <td className="px-2 py-1.5"><button type="button" onClick={() => remove(i)} className="rounded-full px-3 py-1.5 font-bold text-muted hover:bg-paper-2" aria-label={`Remove row ${i + 1}`}>Remove</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4">
            <FormError message={result?.error} />
          </div>
          <Button
            type="button"
            className="mt-4"
            disabled={pending || blocking > 0 || rows.length === 0}
            onClick={() =>
              start(async () => {
                setResult(await addStudentList({ classroomId, loginType, groupId: groupId || undefined, rows }));
              })
            }
          >
            {pending ? "Saving…" : `Save ${rows.length} students`}
          </Button>
        </Panel>
      )}
    </div>
  );
}
