"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { FormError, Input, Label, Select } from "@/components/ui/Field";
import { Panel } from "@/components/ui/Panel";
import { createGroupWithMembers, updateGroupWithMembers } from "@/lib/actions/classroom";

type S = { id: string; firstName: string; lastInitial: string; username: string };

export function GroupForm({ classroomId, students, levels = [], group }: { classroomId: string; students: S[]; levels?: Array<{ id: string; name: string }>; group?: { id: string; name: string; memberIds: string[] } }) {
  const router = useRouter();
  const [name, setName] = useState(group?.name ?? "");
  const [levelId, setLevelId] = useState(levels[0]?.id ?? "");
  const [members, setMembers] = useState<Set<string>>(new Set(group?.memberIds ?? []));
  const [filter, setFilter] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [pending, start] = useTransition();
  const shown = students.filter((s) => `${s.firstName} ${s.lastInitial} ${s.username}`.toLowerCase().includes(filter.toLowerCase()));
  const toggle = (id: string) => setMembers((m) => { const n = new Set(m); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  const save = () =>
    start(async () => {
      const payload = { classroomId, groupId: group?.id, levelId: levelId || undefined, name, studentIds: [...members] };
      const res = group ? await updateGroupWithMembers(payload) : await createGroupWithMembers(payload);
      if (res.error) setError(res.error);
      else router.push(`/teacher/classes/${classroomId}`);
    });

  return (
    <Panel className="max-w-3xl space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="group-name">Group name</Label>
          <Input id="group-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} placeholder="Los delfines" />
        </div>
        {!group && levels.length > 1 && (
          <div>
            <Label htmlFor="group-level">Level</Label>
            <Select id="group-level" value={levelId} onChange={(e) => setLevelId(e.target.value)}>
              {levels.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
            </Select>
          </div>
        )}
      </div>
      <fieldset>
        <legend className="mb-2 text-sm font-bold text-ink-2">Students in this group ({members.size})</legend>
        {students.length === 0 ? (
          <p className="text-sm text-muted">Add students to the class first.</p>
        ) : (
          <>
            <Input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Search the roster" aria-label="Search the roster" className="mb-3 max-w-xs" />
            <div className="flex flex-wrap gap-2">
              {shown.map((s) => (
                <label key={s.id} className="flex cursor-pointer items-center gap-2 rounded-full border border-line bg-card px-3 py-2 text-sm font-bold has-[:checked]:border-teal has-[:checked]:bg-teal-soft has-[:checked]:text-teal-dark">
                  <input type="checkbox" checked={members.has(s.id)} onChange={() => toggle(s.id)} />
                  {s.firstName} {s.lastInitial && `${s.lastInitial}.`}
                </label>
              ))}
            </div>
          </>
        )}
      </fieldset>
      <FormError message={error} />
      <div className="flex gap-2">
        <Button type="button" onClick={save} disabled={pending || !name.trim()}>{pending ? "Saving…" : group ? "Save group" : "Create group"}</Button>
        <Button type="button" variant="ghost" onClick={() => router.back()}>Cancel</Button>
      </div>
    </Panel>
  );
}
