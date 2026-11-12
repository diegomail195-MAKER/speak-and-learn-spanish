"use client";

import { useEffect, useRef, useState } from "react";
import type { EditorItem, FaceAudio, FaceData, Lang } from "@/lib/games/types";
import type { TtsConfig } from "./AudioControl";
import { AudioField, playFaceAudio, stopFaceAudio } from "./AudioField";
import { useUi } from "./i18n";
import { ImageField, mediaSrc } from "./ImageField";

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
}: {
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
  return (
    <div className={`min-w-0 ${className}`}>
      {showLabel && <span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-muted md:hidden">{label}</span>}
      <div className="flex min-h-11 items-center gap-1 rounded-lg border border-line bg-card px-1.5 py-1 focus-within:border-sky focus-within:ring-2 focus-within:ring-sky/20">
        {face.imageAssetId && (
          <ImageField compact inline label={label} assetId={face.imageAssetId} alt={face.imageAlt} suggest={face.text} onChange={(a) => onChange({ ...face, imageAssetId: a?.id ?? null })} />
        )}
        <input
          value={face.text ?? ""}
          onChange={(e) => onChange({ ...face, text: e.target.value })}
          maxLength={200}
          placeholder={t.text}
          aria-label={`${label}: ${t.text}`}
          className="h-8 min-w-0 flex-1 bg-transparent px-1.5 text-sm focus:outline-none"
        />
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
          <ImageField compact inline label={label} assetId={null} suggest={face.text} onChange={(a) => onChange({ ...face, imageAssetId: a?.id ?? null })} />
        )}
      </div>
      {face.imageAssetId && (
        <input
          value={face.imageAlt ?? ""}
          onChange={(e) => onChange({ ...face, imageAlt: e.target.value })}
          maxLength={200}
          placeholder={`${t.altText} — ${t.altHint}`}
          title={t.altHint}
          aria-label={`${t.altText} (${label})`}
          className="mt-1 h-7 w-full rounded-md border border-line bg-card px-2 text-xs"
        />
      )}
    </div>
  );
}

/** Drag handle plus keyboard-friendly move / duplicate / delete buttons for a row. */
export function RowControls({
  index,
  count,
  canDuplicate,
  onMove,
  onDuplicate,
  onDelete,
  onDragStart,
}: {
  index: number;
  count: number;
  canDuplicate: boolean;
  onMove: (d: -1 | 1) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onDragStart: () => void;
}) {
  const { t } = useUi();
  const handle = useRef<HTMLButtonElement>(null);
  const btn = "grid h-8 w-8 place-items-center rounded-full text-sm text-muted hover:bg-paper-2 hover:text-ink disabled:opacity-30";
  return (
    <div className="flex items-center gap-0.5 font-bold">
      <button
        ref={handle}
        type="button"
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
        className={`${btn} cursor-grab active:cursor-grabbing`}
        aria-label={`${t.move} (${index + 1}). ↑ ↓`}
        title={t.move}
        data-row-handle={index}
      >
        ⠿
      </button>
      <button type="button" onClick={() => onMove(-1)} disabled={index === 0} className={btn} aria-label={`${t.moveUp} (${index + 1})`} title={t.moveUp}>↑</button>
      <button type="button" onClick={() => onMove(1)} disabled={index === count - 1} className={btn} aria-label={`${t.moveDown} (${index + 1})`} title={t.moveDown}>↓</button>
      <button type="button" onClick={onDuplicate} disabled={!canDuplicate} className={btn} aria-label={`${t.duplicate} (${index + 1})`} title={t.duplicate}>⧉</button>
      <button type="button" onClick={onDelete} className={`${btn} hover:bg-coral-soft hover:text-coral-dark`} aria-label={`${t.delete} (${index + 1})`} title={t.delete}>🗑</button>
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
