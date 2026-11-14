"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { updateSkillLevel } from "@/lib/actions/montessori";
import { LEVEL_LABEL } from "@/lib/montessori/levels";
import { LEVELS, type ProgressLevel } from "@/lib/montessori/types";

/** Teacher adjusts one skill's level (or goes back to the computed one) and writes an observation. */
export function SkillLevelForm({ skillId, computed, teacherLevel, note }: { skillId: string; computed: ProgressLevel; teacherLevel: ProgressLevel | null; note: string }) {
  const [level, setLevel] = useState<string>(teacherLevel ?? "");
  const [text, setText] = useState(note);
  const [msg, setMsg] = useState("");
  const [pending, start] = useTransition();
  return (
    <form
      className="flex flex-wrap items-start gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        setMsg("");
        start(async () => {
          try {
            await updateSkillLevel({ skillId, level: level || null, note: text });
            setMsg("Saved");
          } catch {
            setMsg("Could not save. Try again.");
          }
        });
      }}
    >
      <label className="sr-only" htmlFor={`lvl-${skillId}`}>Level</label>
      <select id={`lvl-${skillId}`} value={level} onChange={(e) => setLevel(e.target.value)} className="h-9 rounded-lg border border-line bg-card px-2 text-sm" data-testid="level-select">
        <option value="">Automatic ({LEVEL_LABEL[computed].en})</option>
        {LEVELS.map((l) => (
          <option key={l} value={l}>{LEVEL_LABEL[l].en}</option>
        ))}
      </select>
      <label className="sr-only" htmlFor={`note-${skillId}`}>Teacher observation</label>
      <input id={`note-${skillId}`} value={text} onChange={(e) => setText(e.target.value)} maxLength={1000} placeholder="Observation (optional)" className="h-9 min-w-48 flex-1 rounded-lg border border-line bg-card px-2 text-sm" />
      <Button type="submit" size="sm" variant="secondary" disabled={pending} data-testid="level-save">{pending ? "Saving…" : "Save"}</Button>
      {msg && <span role="status" className="self-center text-xs font-bold text-muted">{msg}</span>}
    </form>
  );
}
