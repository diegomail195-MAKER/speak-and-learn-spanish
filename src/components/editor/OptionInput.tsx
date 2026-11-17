import { Input, Label, Select } from "@/components/ui/Field";
import type { OptionDef } from "@/lib/games/templates";

/** One template option (checkbox, choice or number), shared by the editor and Activity settings. */
export function OptionInput({ o, value, onChange, disabled }: { o: OptionDef; value: string | number | boolean; onChange: (v: string | number | boolean) => void; disabled?: boolean }) {
  const id = `opt-${o.key}`;
  if (o.type === "boolean") {
    return (
      <label className="flex items-start gap-2 text-sm">
        <input id={id} type="checkbox" className="mt-1" checked={value === true} onChange={(e) => onChange(e.target.checked)} />
        <span>
          <strong>{o.label}</strong>
          {o.help && <span className="block text-xs text-muted">{o.help}</span>}
        </span>
      </label>
    );
  }
  if (o.type === "choice") {
    return (
      <div>
        <Label htmlFor={id}>{o.label}</Label>
        <Select id={id} value={String(value)} onChange={(e) => onChange(e.target.value)}>
          {o.choices.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </Select>
        {o.help && <p className="mt-1 text-xs text-muted">{o.help}</p>}
      </div>
    );
  }
  return (
    <div className={disabled ? "opacity-50" : ""}>
      <Label htmlFor={id}>{o.label}</Label>
      <Input id={id} type="number" min={o.min} max={o.max} disabled={disabled} value={Number(value)} onChange={(e) => onChange(Math.min(o.max, Math.max(o.min, Number(e.target.value) || o.min)))} />
      {o.help && <p className="mt-1 text-xs text-muted">{o.help}</p>}
    </div>
  );
}
