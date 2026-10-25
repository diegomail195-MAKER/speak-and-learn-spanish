"use client";

import { createContext, useContext, useId, useRef, useState, type ReactNode } from "react";
import { inputClass } from "@/components/ui/Field";
import { applySuggestion, type Suggestion } from "@/lib/text/spanish-check";

export const CHARS = ["á", "é", "í", "ó", "ú", "ü", "ñ", "Á", "É", "Í", "Ó", "Ú", "Ü", "Ñ", "¿", "¡"];
// Alt+key shortcuts (Alt+Shift for capitals): a e i o u → vowels with accent, y → ü, n → ñ, / → ¿, 1 → ¡
const SHORTCUTS: Record<string, [string, string]> = {
  a: ["á", "Á"], e: ["é", "É"], i: ["í", "Í"], o: ["ó", "Ó"], u: ["ú", "Ú"], y: ["ü", "Ü"], n: ["ñ", "Ñ"], "/": ["¿", "¿"], "1": ["¡", "¡"],
};

// One character bar for a whole form: it inserts into whichever Spanish field was focused last.
type Inserter = (ch: string) => void;
const BarContext = createContext<{ setActive: (f: Inserter | null) => void; active: React.RefObject<Inserter | null> } | null>(null);

export function SpanishKeyboardProvider({ children }: { children: ReactNode }) {
  const active = useRef<Inserter | null>(null);
  return <BarContext.Provider value={{ active, setActive: (f) => (active.current = f) }}>{children}</BarContext.Provider>;
}

function CharButtons({ onInsert }: { onInsert: (c: string) => void }) {
  return (
    <>
      {CHARS.map((c) => (
        <button
          key={c}
          type="button"
          tabIndex={-1}
          onMouseDown={(e) => {
            e.preventDefault(); // keep the cursor in the field
            onInsert(c);
          }}
          className="h-8 min-w-8 rounded-lg border border-line bg-paper px-1.5 font-semibold text-ink hover:border-sky hover:bg-sky-soft"
          aria-label={`Insert ${c}`}
        >
          {c}
        </button>
      ))}
    </>
  );
}

/** Docked bar (e.g. in a sticky toolbar) that types into the last focused SpanishField. */
export function SpanishCharBar() {
  const ctx = useContext(BarContext);
  return (
    <div className="flex flex-wrap items-center gap-1" role="toolbar" aria-label="Spanish characters">
      <CharButtons onInsert={(c) => ctx?.active.current?.(c)} />
      <span className="pl-1 text-[11px] text-muted">or Alt + a e i o u n · Alt+/ ¿ · Alt+1 ¡</span>
    </div>
  );
}

type Props = {
  label: string;
  value: string;
  onChange: (v: string) => void;
  language?: "es-419" | "en-US" | "fr-FR";
  multiline?: boolean;
  placeholder?: string;
  hint?: string;
  maxLength?: number;
  checkable?: boolean;
  id?: string;
};

export function SpanishField({ label, value, onChange, language = "es-419", multiline, placeholder, hint, maxLength = 400, checkable = true, id }: Props) {
  const bar = useContext(BarContext);
  const autoId = useId();
  const fieldId = id ?? autoId;
  const ref = useRef<HTMLInputElement & HTMLTextAreaElement>(null);
  const [focused, setFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[] | null>(null);
  const [checking, setChecking] = useState(false);
  const [checkNote, setCheckNote] = useState("");
  // Latest text, so several quick "Accept" clicks each apply to the already-corrected text.
  const valueRef = useRef(value);
  valueRef.current = value;

  function insert(ch: string) {
    const el = ref.current;
    if (!el) return;
    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? start;
    el.setRangeText(ch, start, end, "end");
    onChange(el.value);
    setSuggestions(null);
    requestAnimationFrame(() => el.focus());
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!e.altKey || e.ctrlKey || e.metaKey) return;
    const key = e.key.length === 1 ? e.key.toLowerCase() : "";
    const code = e.code === "Slash" ? "/" : e.code === "Digit1" ? "1" : e.code.startsWith("Key") ? e.code.slice(3).toLowerCase() : key;
    const m = SHORTCUTS[code];
    if (m) {
      e.preventDefault();
      insert(e.shiftKey ? m[1] : m[0]);
    }
  }

  async function check() {
    setChecking(true);
    setCheckNote("");
    try {
      const res = await fetch("/api/text/check", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: value, language }) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setSuggestions(json.suggestions);
      if (json.suggestions.length === 0) setCheckNote(language === "es-419" || json.languageTool === "used" ? "No suggestions." : "Grammar checking for this language needs LanguageTool configured.");
    } catch {
      setCheckNote("The checker is not available right now.");
    } finally {
      setChecking(false);
    }
  }

  function accept(s: Suggestion) {
    const next = applySuggestion(valueRef.current, s);
    valueRef.current = next;
    onChange(next);
    const delta = s.replacement.length - s.length;
    setSuggestions((list) => list?.filter((x) => x !== s).map((x) => (x.offset > s.offset || (x.offset === s.offset && x.length > 0 && s.length === 0) ? { ...x, offset: x.offset + delta } : x)) ?? null);
  }

  async function keepWord(s: Suggestion) {
    await fetch("/api/text/keep", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ word: s.original }) });
    setSuggestions((list) => list?.filter((x) => x.original.toLowerCase() !== s.original.toLowerCase()) ?? null);
  }

  const common = {
    id: fieldId,
    ref,
    value,
    maxLength,
    placeholder,
    lang: language === "es-419" ? "es" : language,
    spellCheck: true,
    onChange: (e: React.ChangeEvent<HTMLInputElement & HTMLTextAreaElement>) => {
      onChange(e.target.value);
      if (suggestions) setSuggestions(null);
    },
    onFocus: () => {
      setFocused(true);
      bar?.setActive(insert);
    },
    onBlur: () => setFocused(false),
    onKeyDown,
    className: inputClass,
  };

  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <label htmlFor={fieldId} className="text-sm font-bold text-ink-2">
          {label}
          {hint && <span className="ml-2 font-normal text-muted">{hint}</span>}
        </label>
        {checkable && value.trim() && (
          <button type="button" onClick={check} disabled={checking} className="text-xs font-bold text-sky hover:underline disabled:opacity-50">
            {checking ? "Checking…" : "Check spelling"}
          </button>
        )}
      </div>
      {multiline ? <textarea rows={2} {...common} /> : <input {...common} />}
      {!bar && focused && (
        <div className="mt-1.5 flex flex-wrap items-center gap-1" role="toolbar" aria-label="Spanish characters">
          <CharButtons onInsert={insert} />
          <span className="pl-1 text-[11px] text-muted">Alt + a e i o u n · Alt+/ ¿ · Alt+1 ¡</span>
        </div>
      )}
      {checkNote && <p className="mt-1.5 text-xs text-muted">{checkNote}</p>}
      {suggestions && suggestions.length > 0 && (
        <ul className="mt-2 space-y-1.5 rounded-xl border border-sun/50 bg-sun-soft/60 p-2.5 text-sm">
          {suggestions.map((s, i) => (
            <li key={`${s.offset}-${i}`} className="flex flex-wrap items-center gap-2">
              <span className="flex-1">
                {s.original ? (
                  <>
                    <del className="text-muted">{s.original}</del> → <strong>{s.replacement}</strong>
                  </>
                ) : (
                  <>
                    add <strong>{s.replacement}</strong>
                  </>
                )}
                <span className="ml-2 text-xs text-muted">{s.message}</span>
              </span>
              <button type="button" onClick={() => accept(s)} className="rounded-full bg-ink px-2.5 py-0.5 text-xs font-bold text-white">
                Accept
              </button>
              <button type="button" onClick={() => setSuggestions((l) => l?.filter((x) => x !== s) ?? null)} className="rounded-full px-2 py-0.5 text-xs font-bold text-muted hover:bg-card">
                Ignore
              </button>
              {s.original && s.kind !== "punctuation" && (
                <button type="button" onClick={() => keepWord(s)} className="rounded-full px-2 py-0.5 text-xs font-bold text-muted hover:bg-card" title="Never flag this word again (names, invented words)">
                  Keep word
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
