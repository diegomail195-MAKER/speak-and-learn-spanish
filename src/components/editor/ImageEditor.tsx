"use client";

import { useEffect, useRef, useState } from "react";
import { useUi } from "./i18n";

type Edit = { rot: 0 | 90 | 180 | 270; fh: boolean; fv: boolean; crop: { x: number; y: number; w: number; h: number } | null };
const START: Edit = { rot: 0, fh: false, fv: false, crop: null };
const MAX_SIDE = 1600;

/** Draws the rotated/flipped picture (no crop) onto a canvas. */
function transformed(img: HTMLImageElement, e: Edit): HTMLCanvasElement {
  const swap = e.rot === 90 || e.rot === 270;
  const scale = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.round(img.naturalWidth * scale);
  const h = Math.round(img.naturalHeight * scale);
  const c = document.createElement("canvas");
  c.width = swap ? h : w;
  c.height = swap ? w : h;
  const ctx = c.getContext("2d")!;
  ctx.translate(c.width / 2, c.height / 2);
  ctx.rotate((e.rot * Math.PI) / 180);
  ctx.scale(e.fh ? -1 : 1, e.fv ? -1 : 1);
  ctx.drawImage(img, -w / 2, -h / 2, w, h);
  return c;
}

/**
 * Crop (drag on the picture), rotate, flip; "Undo" steps back and "Undo changes" resets.
 * Nothing is saved until "Apply" (the result is uploaded as a new picture).
 */
export function ImageEditor({ src, onApply, onCancel, onRemove, onReplace, busy, error }: { src: string; onApply: (blob: Blob | null) => void; onCancel: () => void; onRemove?: () => void; onReplace?: () => void; busy?: boolean; error?: string }) {
  const { t } = useUi();
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [loadError, setLoadError] = useState("");
  const [hist, setHist] = useState<Edit[]>([START]);
  const [drag, setDrag] = useState<{ x0: number; y0: number; x: number; y: number } | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const e = hist[hist.length - 1];
  const push = (n: Partial<Edit>) => setHist((h) => [...h, { ...h[h.length - 1], ...n }]);

  useEffect(() => {
    const i = new Image();
    i.crossOrigin = "anonymous"; // remote storage: keeps the canvas exportable
    i.onload = () => setImg(i);
    i.onerror = () => setLoadError("Could not load the picture.");
    i.src = src;
  }, [src]);

  useEffect(() => {
    if (!img || !canvasRef.current) return;
    const base = transformed(img, e);
    const c = canvasRef.current;
    c.width = base.width;
    c.height = base.height;
    const ctx = c.getContext("2d")!;
    ctx.drawImage(base, 0, 0);
    const r = drag ? { x: Math.min(drag.x0, drag.x), y: Math.min(drag.y0, drag.y), w: Math.abs(drag.x - drag.x0), h: Math.abs(drag.y - drag.y0) } : e.crop;
    if (r && r.w > 0 && r.h > 0) {
      ctx.fillStyle = "rgba(30,35,64,0.55)";
      const W = c.width, H = c.height;
      ctx.fillRect(0, 0, W, r.y * H);
      ctx.fillRect(0, (r.y + r.h) * H, W, H - (r.y + r.h) * H);
      ctx.fillRect(0, r.y * H, r.x * W, r.h * H);
      ctx.fillRect((r.x + r.w) * W, r.y * H, W - (r.x + r.w) * W, r.h * H);
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = Math.max(2, W / 300);
      ctx.strokeRect(r.x * W, r.y * H, r.w * W, r.h * H);
    }
  }, [img, e, drag]);

  const rel = (ev: React.PointerEvent) => {
    const b = canvasRef.current!.getBoundingClientRect();
    return { x: Math.min(1, Math.max(0, (ev.clientX - b.left) / b.width)), y: Math.min(1, Math.max(0, (ev.clientY - b.top) / b.height)) };
  };

  // Rotating or flipping clears the crop (its box would no longer match the picture).
  const rotate = (d: 90 | -90) => push({ rot: (((e.rot + d) % 360) + 360) % 360 as Edit["rot"], crop: null });

  function apply() {
    if (!img) return;
    if (hist.length === 1) return onApply(null);
    const base = transformed(img, e);
    const r = e.crop ?? { x: 0, y: 0, w: 1, h: 1 };
    const out = document.createElement("canvas");
    out.width = Math.max(1, Math.round(r.w * base.width));
    out.height = Math.max(1, Math.round(r.h * base.height));
    out.getContext("2d")!.drawImage(base, r.x * base.width, r.y * base.height, out.width, out.height, 0, 0, out.width, out.height);
    try {
      out.toBlob((b) => onApply(b), "image/webp", 0.9);
    } catch {
      setLoadError("This picture can't be edited here. Upload it from your device instead.");
    }
  }

  useEffect(() => {
    const esc = (ev: KeyboardEvent) => ev.key === "Escape" && onCancel();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [onCancel]);

  const tool = "grid h-9 min-w-9 place-items-center rounded-lg border border-line bg-card px-2 text-sm font-bold text-ink-2 hover:bg-paper-2 disabled:opacity-40";
  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center bg-ink/50 p-3 sm:p-8">
      <div role="dialog" aria-modal="true" aria-label={t.edit} className="flex max-h-full w-full max-w-3xl flex-col overflow-hidden rounded-xl2 bg-card shadow-soft">
        <div className="flex flex-wrap items-center gap-1.5 border-b border-line bg-paper px-3 py-2">
          <button type="button" className={tool} onClick={() => setHist((h) => (h.length > 1 ? h.slice(0, -1) : h))} disabled={hist.length === 1}>{t.undo}</button>
          <button type="button" className={tool} onClick={() => rotate(-90)} aria-label={t.rotateL} title={t.rotateL}>⟲</button>
          <button type="button" className={tool} onClick={() => rotate(90)} aria-label={t.rotateR} title={t.rotateR}>⟳</button>
          <button type="button" className={tool} onClick={() => push({ fh: !e.fh, crop: null })} aria-label={t.flipH} title={t.flipH}>⇋</button>
          <button type="button" className={tool} onClick={() => push({ fv: !e.fv, crop: null })} aria-label={t.flipV} title={t.flipV}>⇵</button>
          <button type="button" className={tool} onClick={() => setHist([START])} disabled={hist.length === 1}>{t.reset}</button>
          {onReplace && <button type="button" className={tool} onClick={onReplace}>{t.replace}</button>}
          {onRemove && <button type="button" className={`${tool} text-coral-dark`} onClick={onRemove}>{t.remove}</button>}
          <button type="button" onClick={onCancel} className="ml-auto rounded-full px-2 text-2xl leading-none text-muted hover:text-ink" aria-label={t.close}>×</button>
        </div>
        <div className="min-h-0 flex-1 overflow-auto bg-paper-2 p-3">
          {loadError ? (
            <p className="p-6 text-center text-sm font-semibold text-coral-dark">{loadError}</p>
          ) : !img ? (
            <p className="p-6 text-center text-sm text-muted">…</p>
          ) : (
            <canvas
              ref={canvasRef}
              aria-label={t.cropHint}
              className="mx-auto block max-h-[60vh] max-w-full cursor-crosshair touch-none rounded-lg bg-[repeating-conic-gradient(#eee_0_25%,#fff_0_50%)] [background-size:16px_16px]"
              onPointerDown={(ev) => {
                ev.currentTarget.setPointerCapture(ev.pointerId);
                const p = rel(ev);
                setDrag({ x0: p.x, y0: p.y, x: p.x, y: p.y });
              }}
              onPointerMove={(ev) => drag && setDrag({ ...drag, ...rel(ev) })}
              onPointerUp={() => {
                if (!drag) return;
                const r = { x: Math.min(drag.x0, drag.x), y: Math.min(drag.y0, drag.y), w: Math.abs(drag.x - drag.x0), h: Math.abs(drag.y - drag.y0) };
                setDrag(null);
                if (r.w > 0.03 && r.h > 0.03) push({ crop: r });
              }}
            />
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2 border-t border-line px-4 py-3">
          <span className="text-xs text-muted">{t.cropHint}</span>
          {error && <span className="text-xs font-semibold text-coral-dark">{error}</span>}
          <button type="button" onClick={onCancel} className="ml-auto rounded-full px-4 py-2 text-sm font-bold text-ink-2 hover:bg-paper-2">{t.cancel}</button>
          <button type="button" onClick={apply} disabled={!img || busy} className="rounded-full bg-coral px-5 py-2 text-sm font-bold text-white hover:bg-coral-dark disabled:opacity-50">
            {busy ? t.uploading : t.apply}
          </button>
        </div>
      </div>
    </div>
  );
}
