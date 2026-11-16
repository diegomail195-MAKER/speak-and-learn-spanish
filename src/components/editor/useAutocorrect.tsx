"use client";

import { useEffect, useRef, useState } from "react";
import { afterInput, detectLang, loadMap, mapIfLoaded, onLeave, toLang, type Correction, type Lang } from "@/lib/text/autocorrect";
import { useUi } from "./i18n";

// Autocorrect for a text field: fixes each word as it is finished, so teachers never need to
// switch keyboards. Backspace right after a correction undoes it (and that word is then left
// alone in this field). Alt + a e i o u n / 1 still type á é í ó ú ñ ¿ ¡ for those who like it.

type El = HTMLInputElement | HTMLTextAreaElement;

const SHORTCUTS: Record<string, [string, string]> = {
  a: ["á", "Á"], e: ["é", "É"], i: ["í", "Í"], o: ["ó", "Ó"], u: ["ú", "Ú"], y: ["ü", "Ü"], n: ["ñ", "Ñ"], "/": ["¿", "¿"], "1": ["¡", "¡"],
};

const skipKey = (c: Correction) => c.original.toLowerCase() || c.replacement;

export function useAutocorrect(onChange: (v: string) => void, language: string | undefined | null, { singleLine = false } = {}) {
  const fallback = toLang(language);
  const skip = useRef(new Set<string>());
  // The last correction, so Backspace right after it can put the text back.
  const last = useRef<{ prev: string; prevCaret: number; value: string; caret: number; keys: string[] } | null>(null);
  const [notice, setNotice] = useState<{ from: string; to: string } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const lang = (text: string): Lang => {
    const l = detectLang(text, fallback);
    if (l !== "en" && !mapIfLoaded(l)) void loadMap(l);
    return l;
  };

  function show(cs: Correction[]) {
    const word = cs.find((c) => c.original) ?? cs[0];
    setNotice({ from: word.original || "", to: word.replacement === " " ? "␣" : word.replacement });
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setNotice(null), 2500);
  }

  function set(el: El, value: string, caret: number) {
    el.value = value;
    el.setSelectionRange(caret, caret);
    onChange(value);
  }

  return {
    notice,
    props: {
      spellCheck: true,
      autoCorrect: "off",
      onFocus: () => {
        if (fallback !== "en") void loadMap(fallback);
      },
      onChange: (e: React.ChangeEvent<El>) => {
        const el = e.target;
        const v = singleLine ? el.value.replace(/[\r\n]+/g, " ") : el.value;
        const ne = e.nativeEvent as InputEvent;
        last.current = null;
        if (ne.inputType === "insertText" && ne.data && el.selectionStart === el.selectionEnd) {
          const caret = el.selectionStart ?? v.length;
          const l = lang(v);
          const r = afterInput(v, caret, ne.data, l, mapIfLoaded(l), skip.current);
          if (r.corrections.length) {
            last.current = { prev: v, prevCaret: caret, value: r.value, caret: r.caret, keys: r.corrections.map(skipKey) };
            show(r.corrections);
            set(el, r.value, r.caret);
            return;
          }
        }
        if (v !== el.value) el.value = v;
        onChange(v);
      },
      onKeyDown: (e: React.KeyboardEvent<El>) => {
        const el = e.currentTarget;
        const u = last.current;
        if (e.key === "Backspace" && u && el.value === u.value && el.selectionStart === u.caret && el.selectionEnd === u.caret) {
          e.preventDefault();
          u.keys.forEach((k) => skip.current.add(k));
          last.current = null;
          setNotice(null);
          set(el, u.prev, u.prevCaret);
          return;
        }
        if (singleLine && e.key === "Enter") e.preventDefault();
        if (e.altKey && !e.ctrlKey && !e.metaKey) {
          const code = e.code === "Slash" ? "/" : e.code === "Digit1" ? "1" : e.code.startsWith("Key") ? e.code.slice(3).toLowerCase() : "";
          const m = SHORTCUTS[code];
          if (m) {
            e.preventDefault();
            const a = el.selectionStart ?? el.value.length;
            el.setRangeText(e.shiftKey ? m[1] : m[0], a, el.selectionEnd ?? a, "end");
            onChange(el.value);
          }
        }
      },
      onBlur: (e: React.FocusEvent<El>) => {
        const el = e.currentTarget;
        last.current = null;
        const l = lang(el.value);
        const r = onLeave(el.value, l, mapIfLoaded(l), skip.current);
        if (r.corrections.length) onChange(r.value);
      },
    },
  };
}

/** A small note under a field after a correction: "nino → niño · ⌫ undo". */
export function CorrectionNote({ notice, className = "" }: { notice: { from: string; to: string } | null; className?: string }) {
  const { t } = useUi();
  if (!notice) return null;
  return (
    <span role="status" className={`pointer-events-none inline-flex items-center gap-1.5 rounded-full bg-ink px-2.5 py-0.5 text-[11px] font-bold text-white shadow-soft ${className}`}>
      {notice.from ? (
        <>
          <span className="font-normal line-through opacity-70">{notice.from}</span>→<span>{notice.to}</span>
        </>
      ) : (
        <span>+ {notice.to}</span>
      )}
      <span className="font-normal opacity-70">· {t.autoUndo}</span>
    </span>
  );
}
