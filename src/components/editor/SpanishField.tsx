"use client";

import { useId, useRef, useState } from "react";
import { inputClass } from "@/components/ui/Field";
import { LANG_NAME, hasTags, maskTagged, parseSegments, proposeTags, tagRange, clearTags, type TagProposal } from "@/lib/text/segments";
import { applySuggestion, type Suggestion } from "@/lib/text/spanish-check";
import type { AppLanguage } from "@/lib/tts/voices";
import { CorrectionNote, useAutocorrect } from "./useAutocorrect";

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
  /** Spoken text that may switch language ("…en español, [en]love[/en]?"): show language tools. */
  tags?: boolean;
};

export function SpanishField({ label, value, onChange, language = "es-419", multiline, placeholder, hint, maxLength = 400, checkable = true, id, tags = false }: Props) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const ref = useRef<HTMLInputElement & HTMLTextAreaElement>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[] | null>(null);
  const [checking, setChecking] = useState(false);
  const [checkNote, setCheckNote] = useState("");
  // Latest text, so several quick "Accept" clicks each apply to the already-corrected text.
  const valueRef = useRef(value);
  valueRef.current = value;

  const auto = useAutocorrect((v) => {
    onChange(v);
    setSuggestions(null);
  }, language);

  async function check() {
    setChecking(true);
    setCheckNote("");
    try {
      // Words tagged as another language are hidden from the checker (same length, same offsets).
      const res = await fetch("/api/text/check", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: maskTagged(value), language }) });
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
    ...auto.props,
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
      <div className="relative">
        {multiline ? <textarea rows={2} {...common} /> : <input {...common} />}
        <CorrectionNote notice={auto.notice} className="absolute -bottom-3 right-3 z-10" />
      </div>
      {tags && <LanguageTools value={value} onChange={onChange} base={language} field={ref} />}
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

const LANG_TONE: Record<AppLanguage, string> = { "es-419": "bg-coral-soft text-coral-dark", "en-US": "bg-sky-soft text-sky", "fr-FR": "bg-teal-soft text-teal-dark" };
const SHORT: Record<AppLanguage, string> = { "es-419": "ES", "en-US": "EN", "fr-FR": "FR" };

/**
 * Language tools for spoken text: mark words or phrases as English / French / Spanish so each
 * is read by a native voice. Suggestions are only proposals; the teacher confirms each one.
 */
function LanguageTools({ value, onChange, base, field }: { value: string; onChange: (v: string) => void; base: AppLanguage; field: React.RefObject<(HTMLInputElement & HTMLTextAreaElement) | null> }) {
  const [dismissed, setDismissed] = useState<string[]>([]);
  if (!value.trim()) return null;
  const proposals = proposeTags(value, base).filter((p) => !dismissed.includes(`${p.word}|${p.language}`));
  const tagged = hasTags(value);
  const others = (["es-419", "en-US", "fr-FR"] as AppLanguage[]).filter((l) => l !== base);

  function markSelection(lang: AppLanguage) {
    const el = field.current;
    if (!el) return;
    let a = el.selectionStart ?? 0;
    let b = el.selectionEnd ?? 0;
    if (a === b) {
      // No selection: use the word at the cursor.
      while (a > 0 && /[\p{L}'’-]/u.test(value[a - 1])) a--;
      while (b < value.length && /[\p{L}'’-]/u.test(value[b])) b++;
    }
    if (a === b) return;
    onChange(tagRange(value, a, b, lang, base));
  }
  const accept = (p: TagProposal) => onChange(tagRange(value, p.start, p.end, p.language, base));

  return (
    <div className="mt-1.5 space-y-1.5 text-xs">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="font-bold text-muted">Language of selected words:</span>
        {others.map((l) => (
          <button key={l} type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => markSelection(l)} className={`rounded-full px-2.5 py-0.5 font-bold ${LANG_TONE[l]}`}>
            {LANG_NAME[l]}
          </button>
        ))}
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => markSelection(base)} className="rounded-full px-2 py-0.5 font-bold text-muted hover:bg-paper-2" title="Back to the activity language">
          {LANG_NAME[base]}
        </button>
        {tagged && (
          <button type="button" onClick={() => onChange(clearTags(value))} className="rounded-full px-2 py-0.5 font-bold text-muted hover:bg-paper-2">
            Clear marks
          </button>
        )}
      </div>
      {tagged && (
        <p className="flex flex-wrap items-center gap-1" aria-label="How it will be read">
          <span className="font-bold text-muted">Read as:</span>
          {parseSegments(value, base)
            .filter((s) => s.text.trim())
            .map((s, i) => (
              <span key={i} className={`rounded-md px-1.5 py-0.5 ${LANG_TONE[s.language as AppLanguage]}`}>
                <span className="mr-1 text-[10px] font-bold opacity-70">{SHORT[s.language as AppLanguage]}</span>
                {s.text.trim()}
              </span>
            ))}
        </p>
      )}
      {proposals.map((p) => (
        <p key={`${p.start}-${p.word}`} className="flex flex-wrap items-center gap-2 rounded-lg bg-paper-2 px-2 py-1">
          <span>
            “<strong>{p.word}</strong>” looks like <strong>{LANG_NAME[p.language]}</strong>
            {p.why === "quoted" ? " (in quotes)" : p.why === "capitals" ? " (in capitals)" : ""}. Read it with a {LANG_NAME[p.language]} voice?
          </span>
          <button type="button" onClick={() => accept(p)} className="rounded-full bg-ink px-2.5 py-0.5 font-bold text-white">
            Yes
          </button>
          <button type="button" onClick={() => setDismissed((d) => [...d, `${p.word}|${p.language}`])} className="rounded-full px-2 py-0.5 font-bold text-muted hover:bg-card">
            No
          </button>
        </p>
      ))}
    </div>
  );
}
