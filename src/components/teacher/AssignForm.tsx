"use client";

import { useActionState } from "react";
import { SpanishField } from "@/components/editor/SpanishField";
import { Button } from "@/components/ui/Button";
import { FormError, Input, Label, Select } from "@/components/ui/Field";
import { createAssignment } from "@/lib/actions/assignments";
import { useState } from "react";

type Tree = Array<{
  id: string;
  name: string;
  levels: Array<{ id: string; name: string; groups: Array<{ id: string; name: string; count: number }> }>;
  students: Array<{ id: string; name: string }>;
}>;

type Option = { id: string; title: string };
type GameOption = Option & { flashcards: boolean; repeat: boolean };

export function AssignForm({ games, videos, collections, tree, initial }: { games: GameOption[]; videos: Option[]; collections: Option[]; tree: Tree; initial?: string }) {
  const [state, action, pending] = useActionState(createAssignment, undefined);
  const [instructions, setInstructions] = useState("");
  const [activity, setActivity] = useState(initial && [...games.map((g) => `game:${g.id}`), ...videos.map((v) => `video:${v.id}`), ...collections.map((c) => `collection:${c.id}`)].includes(initial) ? initial : "");
  const chosenGame = activity.startsWith("game:") ? games.find((g) => `game:${g.id}` === activity) : undefined;
  // An activity that isn't published yet can't be picked: say so instead of an empty list.
  const notPublished = !!initial && !activity;
  const chip = "flex items-center gap-2 rounded-full border border-line bg-card px-3 py-1.5 text-sm font-semibold has-[:checked]:border-teal has-[:checked]:bg-teal-soft has-[:checked]:text-teal-dark";
  return (
    <form action={action} className="space-y-6">
      <div className="max-w-xl">
        <Label htmlFor="activity">Activity</Label>
        <Select id="activity" name="activity" value={activity} onChange={(e) => setActivity(e.target.value)} required>
          <option value="" disabled>Choose a published game, video or collection</option>
          {games.length > 0 && <optgroup label="Interactive games">{games.map((g) => <option key={g.id} value={`game:${g.id}`}>{g.title}</option>)}</optgroup>}
          {videos.length > 0 && <optgroup label="Videos">{videos.map((v) => <option key={v.id} value={`video:${v.id}`}>{v.title}</option>)}</optgroup>}
          {collections.length > 0 && <optgroup label="Video collections">{collections.map((c) => <option key={c.id} value={`collection:${c.id}`}>{c.title}</option>)}</optgroup>}
        </Select>
        {notPublished && <p className="mt-1.5 text-sm font-semibold text-coral-dark">This activity isn&apos;t published yet. Open it in the editor and press Assign (it publishes it first).</p>}
      </div>

      {chosenGame?.flashcards && (
        <div className="max-w-xl rounded-xl2 border border-line bg-card p-4" key={chosenGame.id}>
          <p className="mb-2 font-bold text-ink-2">Activity mode</p>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <label htmlFor="mode" className="text-sm font-semibold text-ink-2">Repeat cards</label>
            <div className="w-full sm:w-72">
              <Select id="mode" name="mode" defaultValue={chosenGame.repeat ? "repeat" : "once"}>
                <option value="repeat">Repeat cards until all correct</option>
                <option value="once">Each card only once</option>
              </Select>
            </div>
          </div>
        </div>
      )}

      <fieldset>
        <legend className="mb-2 text-sm font-bold text-ink-2">Who gets it</legend>
        {tree.length === 0 && <p className="text-sm text-muted">Create a class first.</p>}
        <div className="space-y-4">
          {tree.map((c) => (
            <div key={c.id} className="rounded-xl2 border border-line bg-card p-4">
              <label className={`${chip} inline-flex`}>
                <input type="checkbox" name="recipient" value={`CLASSROOM:${c.id}`} /> Whole class · {c.name}
              </label>
              {c.levels.map((l) => (
                <div key={l.id} className="mt-3 flex flex-wrap items-center gap-2">
                  <label className={chip}>
                    <input type="checkbox" name="recipient" value={`LEVEL:${l.id}`} /> Level {l.name}
                  </label>
                  {l.groups.map((g) => (
                    <label key={g.id} className={chip}>
                      <input type="checkbox" name="recipient" value={`GROUP:${g.id}`} /> {l.name} {g.name} <span className="text-xs text-muted">({g.count})</span>
                    </label>
                  ))}
                </div>
              ))}
              {c.students.length > 0 && (
                <details className="mt-3">
                  <summary className="cursor-pointer text-sm font-bold text-muted">Individual students</summary>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {c.students.map((s) => (
                      <label key={s.id} className={chip}>
                        <input type="checkbox" name="recipient" value={`STUDENT:${s.id}`} /> {s.name}
                      </label>
                    ))}
                  </div>
                </details>
              )}
            </div>
          ))}
        </div>
      </fieldset>

      <div className="grid max-w-3xl gap-4 sm:grid-cols-3">
        <div>
          <Label htmlFor="startsAt">Start</Label>
          <Input id="startsAt" name="startsAt" type="datetime-local" />
        </div>
        <div>
          <Label htmlFor="dueAt" hint="optional">Due</Label>
          <Input id="dueAt" name="dueAt" type="datetime-local" />
        </div>
        <div>
          <Label htmlFor="maxAttempts" hint="blank = unlimited">Attempts allowed</Label>
          <Input id="maxAttempts" name="maxAttempts" type="number" min={1} max={20} />
        </div>
      </div>
      <div className="max-w-3xl">
        <SpanishField label="Extra instructions" hint="optional, read aloud at the start" value={instructions} onChange={setInstructions} multiline maxLength={1000} />
        <input type="hidden" name="instructions" value={instructions} />
      </div>
      <FormError message={state?.error} />
      <Button type="submit" variant="voice" disabled={pending}>{pending ? "Assigning…" : "Assign activity"}</Button>
    </form>
  );
}
