"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { EditorItem, FaceAudio, FaceData, Lang } from "@/lib/games/types";
import type { TtsConfig } from "./AudioControl";
import { IconButton } from "@/components/ui/IconButton";
import { AudioField, playFaceAudio, stopFaceAudio } from "./AudioField";
import { useUi } from "./i18n";
import { ImageField, mediaSrc, uploadBlob } from "./ImageField";
import { CorrectionNote, useAutocorrect } from "./useAutocorrect";

/** Swaps a card's front and back: text, picture, alt text and audio move together. */
export function swapItem(it: EditorItem): EditorItem {
  const back = it.data.back ?? {};
  return {
    ...it,
    text: back.text ?? "",
    imageAssetId: back.imageAssetId ?? null,
    imageUrl: mediaSrc(back.imageAssetId),
    data: {
      ...it.data,
      translation: undefined,
      imageAlt: back.imageAlt,
      audio: back.audio ?? null,
      back: { text: it.text, imageAssetId: it.imageAssetId, imageAlt: it.data.imageAlt, audio: it.data.audio ?? null },
    },
  };
}

// Whether a mouse/touch press is in progress (set once for the page).
let pointerIsDown = false;
if (typeof window !== "undefined") {
  window.addEventListener("pointerdown", () => (pointerIsDown = true), true);
  window.addEventListener("pointerup", () => setTimeout(() => (pointerIsDown = false), 0), true);
}

/** One face of a card: text, picture and audio, in any combination. */
export function FaceEditor({
  face,
  onChange,
  label,
  showLabel,
  language,
  tts,
  rate,
  className = "",
  onSearch,
}: {
  /** Opens the card's photo form on this face's picture. */
  onSearch?: () => void;
  face: FaceData;
  onChange: (f: FaceData) => void;
  label: string;
  showLabel?: boolean;
  language: Lang;
  tts: TtsConfig | null;
  rate: number;
  className?: string;
}) {
  const { t } = useUi();
  const [altOpen, setAltOpen] = useState(false);
  const altRef = useRef<HTMLInputElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const auto = useAutocorrect((text) => onChange({ ...face, text }), language, { singleLine: true });
  // Ctrl+V with a picture on the clipboard (a screenshot, an image copied from a page) puts it on this face.
  const [pasting, setPasting] = useState<"" | "busy" | "error">("");
  const latest = useRef(face);
  latest.current = face;
  async function onPaste(e: React.ClipboardEvent) {
    const file = [...e.clipboardData.items].find((i) => i.kind === "file" && i.type.startsWith("image/"))?.getAsFile();
    if (!file) return;
    e.preventDefault();
    setPasting("busy");
    try {
      const a = await uploadBlob(file, file.name && file.name !== "image.png" ? file.name : `pasted-${Date.now()}.${file.type.split("/")[1] || "png"}`);
      onChange({ ...latest.current, imageAssetId: a.id });
      setPasting("");
    } catch {
      setPasting("error");
      setTimeout(() => setPasting(""), 3000);
    }
  }
  // The text box grows with the text, so a long word or phrase is never hidden.
  useLayoutEffect(() => {
    const el = textRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [face.text]);
  // Alt text stays open while it is empty (that's when it's needed), then folds into a chip.
  const showAlt = !!face.imageAssetId && (!face.imageAlt?.trim() || altOpen);
  return (
    <div className={`min-w-0 ${className}`}>
      {showLabel && <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted md:hidden">{label}</span>}
      <div onPaste={onPaste} className="relative flex min-h-[88px] items-start gap-3 rounded-[10px] border border-line bg-card p-2 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
        {face.imageAssetId && (
          <ImageField compact onSearch={onSearch} label={label} assetId={face.imageAssetId} alt={face.imageAlt} suggest={face.text} onChange={(a) => onChange({ ...face, imageAssetId: a?.id ?? null })} />
        )}
        <div className="min-w-0 flex-1">
          <textarea
            ref={textRef}
            rows={1}
            value={face.text ?? ""}
            {...auto.props}
            maxLength={200}
            placeholder={t.text}
            aria-label={`${label}: ${t.text}`}
            lang={language === "es-419" ? "es" : language}
            className="block min-h-10 w-full resize-none overflow-hidden break-words bg-transparent px-2 py-1.5 text-lg font-semibold leading-7 text-ink focus:outline-none"
          />
          <div className="flex flex-wrap items-center gap-1 px-1 pt-1">
            <AudioField
              inline
              audio={face.audio}
              onChange={(a: FaceAudio | null) => onChange({ ...face, audio: a })}
              defaultText={face.text ?? ""}
              defaultLanguage={language}
              tts={tts}
              rate={rate}
              label={label}
            />
            {!face.imageAssetId && (
              <ImageField compact inline onSearch={onSearch} label={label} assetId={null} suggest={face.text} onChange={(a) => onChange({ ...face, imageAssetId: a?.id ?? null })} />
            )}
            {face.imageAssetId && !showAlt && (
              <button
                type="button"
                onClick={() => (setAltOpen(true), setTimeout(() => altRef.current?.focus(), 0))}
                className="inline-flex h-8 shrink-0 items-center rounded-md px-2 text-[11px] font-extrabold uppercase tracking-wide text-leaf hover:bg-leaf-soft"
                title={`${t.altText}: ${face.imageAlt}`}
                aria-label={`${t.edit} ${t.altText.toLowerCase()} (${label})`}
              >
                Alt ✓
              </button>
            )}
          </div>
        </div>
        <CorrectionNote notice={auto.notice} className="absolute -bottom-3 left-3 z-10" />
        {pasting && (
          <span role="status" className={`absolute -bottom-3 right-3 z-10 rounded-full px-2.5 py-0.5 text-[11px] font-bold text-white shadow-soft ${pasting === "error" ? "bg-coral" : "bg-ink"}`}>
            {pasting === "busy" ? t.pasting : t.pasteFailed}
          </span>
        )}
      </div>
      {showAlt && (
        <input
          value={face.imageAlt ?? ""}
          ref={altRef}
          onChange={(e) => onChange({ ...face, imageAlt: e.target.value })}
          onBlur={() => {
            // Folding the box moves what's below it: when the blur comes from a click, fold after
            // the click so it lands on the button the teacher aimed at.
            const fold = () => setTimeout(() => setAltOpen(false), 0);
            if (pointerIsDown) window.addEventListener("click", fold, { once: true });
            else fold();
          }}
          maxLength={200}
          placeholder={`${t.altText} — ${t.altHint}`}
          title={t.altHint}
          aria-label={`${t.altText} (${label})`}
          className="mt-2 h-10 w-full rounded-lg border border-line bg-card px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      )}
    </div>
  );
}

/**
 * The card's action bar: swap front/back (two-sided only), drag handle, move up, move down,
 * duplicate, then delete after a separator. 44×44 buttons, named on hover and keyboard focus.
 * The drag handle also moves the card with ↑ / ↓.
 */
export function RowControls({
  index,
  count,
  canDuplicate,
  onMove,
  onDuplicate,
  onDelete,
  onDragStart,
  onSwap,
}: {
  index: number;
  count: number;
  canDuplicate: boolean;
  onMove: (d: -1 | 1) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onDragStart: () => void;
  /** Swaps this card's front and back (two-sided flashcards). */
  onSwap?: () => void;
}) {
  const { t } = useUi();
  const n = index + 1;
  return (
    <div role="group" aria-label={`${t.actionsFor} ${n}`} className="flex flex-wrap items-center gap-2" data-testid="row-controls">
      {onSwap && <IconButton icon="swap" tone="lavender" label={`${t.swapOne} (${n})`} onClick={onSwap} data-testid="row-swap" />}
      <IconButton
        icon="grip"
        tone="lavender"
        label={`${t.move} (${n}) · ↑ ↓`}
        draggable
        onDragStart={(e) => {
          e.dataTransfer.effectAllowed = "move";
          e.dataTransfer.setData("text/plain", String(index));
          onDragStart();
        }}
        onKeyDown={(e) => {
          // Arrow keys move the row; focus follows it.
          if (e.key === "ArrowUp" && index > 0) {
            e.preventDefault();
            onMove(-1);
          }
          if (e.key === "ArrowDown" && index < count - 1) {
            e.preventDefault();
            onMove(1);
          }
        }}
        className="cursor-grab active:cursor-grabbing"
        data-row-handle={index}
      />
      <IconButton icon="arrowUp" tone="lavender" label={`${t.moveUp} (${n})`} onClick={() => onMove(-1)} disabled={index === 0} />
      <IconButton icon="arrowDown" tone="lavender" label={`${t.moveDown} (${n})`} onClick={() => onMove(1)} disabled={index === count - 1} />
      <IconButton icon="copy" tone="mango" label={`${t.duplicate} (${n})`} onClick={onDuplicate} disabled={!canDuplicate} />
      <span aria-hidden className="mx-0.5 h-8 w-px bg-line" />
      <IconButton icon="trash" tone="coral" label={`${t.delete} (${n})`} onClick={onDelete} />
    </div>
  );
}

/** What a student sees: the front, flip (two sides), previous / next, and the visible face's audio. */
export function FlashcardPreview({ items, twoSided, rate, language, onClose }: { items: EditorItem[]; twoSided: boolean; rate: number; language: Lang; onClose: () => void }) {
  const { t } = useUi();
  const [pos, setPos] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const it = items[pos];
  const face: FaceData = it ? (flipped ? (it.data.back ?? {}) : { text: it.text, imageAssetId: it.imageAssetId, imageAlt: it.data.imageAlt, audio: it.data.audio }) : {};
  const go = (d: number) => {
    stopFaceAudio();
    setFlipped(false);
    setPos((p) => Math.min(items.length - 1, Math.max(0, p + d)));
  };
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", k);
    return () => (window.removeEventListener("keydown", k), stopFaceAudio());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length]);
  const img = mediaSrc(face.imageAssetId);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-3" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-label={t.preview} className="w-full max-w-md rounded-xl2 bg-paper p-4 shadow-soft">
        <div className="mb-2 flex items-center">
          <span className="text-sm font-bold text-muted">{items.length ? `${pos + 1} ${t.of} ${items.length}` : "—"}</span>
          <button type="button" onClick={onClose} className="ml-auto rounded-full px-2 text-2xl leading-none text-muted hover:text-ink" aria-label={t.close}>×</button>
        </div>
        <button
          type="button"
          disabled={!twoSided}
          onClick={() => (stopFaceAudio(), setFlipped((f) => !f))}
          className={`flex aspect-[4/5] w-full flex-col items-center justify-center gap-3 rounded-[2rem] border-2 p-6 shadow-soft ${flipped ? "border-teal/40 bg-teal-soft" : "border-line bg-card"}`}
          aria-label={twoSided ? t.flip : t.front}
          data-testid="preview-card"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {img && <img src={img} alt={face.imageAlt ?? ""} className="max-h-[60%] w-full rounded-2xl object-contain" />}
          {face.text && <span className="text-center font-display text-3xl font-semibold">{face.text}</span>}
          {!img && !face.text && face.audio && <span className="text-5xl" aria-hidden>🔊</span>}
          <span className="mt-auto text-xs font-bold uppercase tracking-wider text-muted">{flipped ? t.back : t.front}</span>
        </button>
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          <button type="button" onClick={() => go(-1)} disabled={pos === 0} className="rounded-full bg-card px-4 py-2 text-sm font-bold ring-1 ring-line disabled:opacity-40">← {t.prev}</button>
          <button type="button" onClick={() => playFaceAudio(face.audio, rate)} disabled={!face.audio} className="rounded-full bg-teal px-4 py-2 text-sm font-bold text-white disabled:opacity-40" data-testid="preview-play">🔊 {t.play}</button>
          {twoSided && <button type="button" onClick={() => (stopFaceAudio(), setFlipped((f) => !f))} className="rounded-full bg-card px-4 py-2 text-sm font-bold ring-1 ring-line">↻ {t.flip}</button>}
          <button type="button" onClick={() => go(1)} disabled={pos >= items.length - 1} className="rounded-full bg-card px-4 py-2 text-sm font-bold ring-1 ring-line disabled:opacity-40">{t.next} →</button>
        </div>
        <span className="sr-only">{language}</span>
      </div>
    </div>
  );
}
