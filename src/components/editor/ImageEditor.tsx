"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useUi } from "./i18n";

type Rect = { x: number; y: number; w: number; h: number };
/** One edit, applied to the picture as it looks at that moment: rotate left/right, flip, or cut to a box. */
type Op = "L" | "R" | "H" | "V" | Rect;
/** A step of the history: the edits so far and the crop box being drawn (not cut yet). */
export type EditStep = { ops: Op[]; box: Rect | null };
const START: EditStep = { ops: [], box: null };
const MAX_SIDE = 1600;

/** The picture with every edit applied, in order. */
function render(img: HTMLImageElement, ops: Op[]): HTMLCanvasElement {
  const scale = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
  let c = document.createElement("canvas");
  c.width = Math.round(img.naturalWidth * scale);
  c.height = Math.round(img.naturalHeight * scale);
  c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
  for (const op of ops) {
    const n = document.createElement("canvas");
    const ctx = n.getContext("2d")!;
    if (typeof op === "object") {
      n.width = Math.max(1, Math.round(op.w * c.width));
      n.height = Math.max(1, Math.round(op.h * c.height));
      ctx.drawImage(c, op.x * c.width, op.y * c.height, n.width, n.height, 0, 0, n.width, n.height);
    } else if (op === "L" || op === "R") {
      n.width = c.height;
      n.height = c.width;
      ctx.translate(n.width / 2, n.height / 2);
      ctx.rotate(op === "R" ? Math.PI / 2 : -Math.PI / 2); // canvas y points down: + is clockwise
      ctx.drawImage(c, -c.width / 2, -c.height / 2);
    } else {
      n.width = c.width;
      n.height = c.height;
      ctx.translate(op === "H" ? n.width : 0, op === "V" ? n.height : 0);
      ctx.scale(op === "H" ? -1 : 1, op === "V" ? -1 : 1);
      ctx.drawImage(c, 0, 0);
    }
    c = n;
  }
  return c;
}

/** Moves a crop box with the picture when it is rotated or flipped. */
function moveBox(b: Rect | null, op: "L" | "R" | "H" | "V"): Rect | null {
  if (!b) return null;
  if (op === "R") return { x: 1 - (b.y + b.h), y: b.x, w: b.h, h: b.w };
  if (op === "L") return { x: b.y, y: 1 - (b.x + b.w), w: b.h, h: b.w };
  if (op === "H") return { ...b, x: 1 - (b.x + b.w) };
  return { ...b, y: 1 - (b.y + b.h) };
}

const ico = { viewBox: "0 0 24 24", width: 16, height: 16, fill: "none", stroke: "currentColor", strokeWidth: 2.4, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
const Icons = {
  undo: <svg {...ico}><path d="M9 14 4 9l5-5" /><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" /></svg>,
  rotL: <svg {...ico}><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" /></svg>,
  rotR: <svg {...ico}><path d="M21 12a9 9 0 1 1-3-6.7L21 8" /><path d="M21 3v5h-5" /></svg>,
  flipH: <svg {...ico}><path d="M8 3 4 7l4 4" /><path d="M4 7h16" /><path d="m16 21 4-4-4-4" /><path d="M20 17H4" /></svg>,
  flipV: <svg {...ico}><path d="m8 7 4-4 4 4" /><path d="M12 3v18" /><path d="m8 17 4 4 4-4" /></svg>,
  crop: <svg {...ico}><path d="M6 2v14a2 2 0 0 0 2 2h14" /><path d="M18 22V8a2 2 0 0 0-2-2H2" /></svg>,
  reset: <svg {...ico}><path d="M21 12a9 9 0 1 1-2.6-6.4" /><path d="M21 3v6h-6" /></svg>,
  replace: (
    <svg {...ico} strokeWidth={2}>
      <rect x="2" y="3" width="10" height="8" rx="1.5" /><path d="m3 10 3-3 2 2 1.5-1.5L12 10" />
      <rect x="12" y="13" width="10" height="8" rx="1.5" /><path d="m13 20 3-3 2 2 1.5-1.5L22 20" />
      <path d="M16 3h2a2 2 0 0 1 2 2v3" /><path d="m18 6 2 2 2-2" /><path d="M8 21H6a2 2 0 0 1-2-2v-3" /><path d="m6 18-2-2-2 2" />
    </svg>
  ),
  trash: <svg {...ico}><path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="M5 6l1 15h12l1-15" /><path d="M10 10v7M14 10v7" /></svg>,
};

/** A compact 3D color-block tool button. An icon-only one gets a tooltip and an accessible name. */
function Tool({ color, icon, label, text, onClick, disabled }: { color: string; icon: ReactNode; label: string; text?: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button type="button" className={`tool-3d tool-3d-${color}`} onClick={onClick} disabled={disabled} aria-label={text ? undefined : label} title={label}>
      {icon}
      {text && <span>{text}</span>}
    </button>
  );
}

/**
 * Rotate, flip and crop (drag a box, then "Crop"); "Undo" steps back one edit and "Undo changes"
 * goes back to the original picture. Nothing is saved until "Apply" (the result is uploaded as a
 * new picture). `initial`: the history of an earlier edit of this picture, so it can still be undone.
 */
export function ImageEditor({
  src,
  initial,
  onApply,
  onCancel,
  onRemove,
  onReplace,
  busy,
  progress,
  error,
}: {
  src: string;
  initial?: EditStep[];
  /** `blob` null: nothing changed. `reverted`: back to the original picture. */
  onApply: (blob: Blob | null, r: { history: EditStep[]; reverted: boolean }) => void;
  onCancel: () => void;
  onRemove?: () => void;
  onReplace?: () => void;
  busy?: boolean;
  /** Upload progress 0–100 while the edited picture is sent. */
  progress?: number | null;
  error?: string;
}) {
  const { t } = useUi();
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [loadError, setLoadError] = useState("");
  const [hist, setHist] = useState<EditStep[]>(() => (initial?.length ? initial : [START]));
  const startState = useRef(JSON.stringify(hist[hist.length - 1]));
  const [drag, setDrag] = useState<{ x0: number; y0: number; x: number; y: number } | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const e = hist[hist.length - 1];
  const push = (n: EditStep) => setHist((h) => [...h, n]);
  const edited = e.ops.length > 0 || !!e.box;

  useEffect(() => {
    const i = new Image();
    i.crossOrigin = "anonymous"; // remote storage: keeps the canvas exportable
    i.onload = () => setImg(i);
    i.onerror = () => setLoadError("Could not load the picture.");
    i.src = src;
  }, [src]);

  const base = useMemo(() => (img ? render(img, e.ops) : null), [img, e.ops]);

  useEffect(() => {
    if (!base || !canvasRef.current) return;
    const c = canvasRef.current;
    c.width = base.width;
    c.height = base.height;
    const ctx = c.getContext("2d")!;
    ctx.drawImage(base, 0, 0);
    const r = drag ? { x: Math.min(drag.x0, drag.x), y: Math.min(drag.y0, drag.y), w: Math.abs(drag.x - drag.x0), h: Math.abs(drag.y - drag.y0) } : e.box;
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
  }, [base, e.box, drag]);

  const rel = (ev: React.PointerEvent) => {
    const b = canvasRef.current!.getBoundingClientRect();
    return { x: Math.min(1, Math.max(0, (ev.clientX - b.left) / b.width)), y: Math.min(1, Math.max(0, (ev.clientY - b.top) / b.height)) };
  };

  // A crop box being drawn turns and flips with the picture.
  const turn = (op: "L" | "R" | "H" | "V") => push({ ops: [...e.ops, op], box: moveBox(e.box, op) });
  const crop = () => e.box && push({ ops: [...e.ops, e.box], box: null });

  function apply() {
    if (!img) return;
    if (JSON.stringify(e) === startState.current) return onApply(null, { history: hist, reverted: false });
    if (!edited) return onApply(null, { history: hist, reverted: true });
    const out = render(img, e.box ? [...e.ops, e.box] : e.ops);
    try {
      out.toBlob((b) => onApply(b, { history: e.box ? [...hist, { ops: [...e.ops, e.box], box: null }] : hist, reverted: false }), "image/webp", 0.9);
    } catch {
      setLoadError("This picture can't be edited here. Upload it from your device instead.");
    }
  }

  useEffect(() => {
    const esc = (ev: KeyboardEvent) => ev.key === "Escape" && onCancel();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [onCancel]);

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center bg-ink/50 p-3 sm:p-8">
      <div role="dialog" aria-modal="true" aria-label={t.edit} className="flex max-h-full w-full max-w-3xl flex-col overflow-hidden rounded-xl2 bg-card shadow-soft">
        <div className="flex items-center gap-2 border-b border-line bg-paper px-3 pb-1.5 pt-2">
          <div className="flex flex-1 flex-wrap items-center gap-2" role="toolbar" aria-label={t.edit} data-testid="image-tools">
            <Tool color="gray" icon={Icons.undo} label={t.undo} text={t.undo} onClick={() => setHist((h) => (h.length > 1 ? h.slice(0, -1) : h))} disabled={hist.length === 1} />
            <Tool color="lavender" icon={Icons.rotL} label={t.rotateL} onClick={() => turn("L")} />
            <Tool color="lavender" icon={Icons.rotR} label={t.rotateR} onClick={() => turn("R")} />
            <Tool color="mango" icon={Icons.flipH} label={t.flipH} onClick={() => turn("H")} />
            <Tool color="mint" icon={Icons.flipV} label={t.flipV} onClick={() => turn("V")} />
            <Tool color="sky" icon={Icons.crop} label={t.crop} text={t.crop} onClick={crop} disabled={!e.box} />
            <Tool color="gray" icon={Icons.reset} label={t.reset} text={t.reset} onClick={() => push(START)} disabled={!edited} />
            {onReplace && <Tool color="grape" icon={Icons.replace} label={t.replace} text={t.replace} onClick={onReplace} />}
            {onRemove && <Tool color="coral" icon={Icons.trash} label={t.remove} text={t.remove} onClick={onRemove} />}
          </div>
          <button type="button" onClick={onCancel} className="mb-1 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-coral-soft text-coral-dark hover:bg-coral hover:text-white" aria-label={t.close} title={t.close} data-testid="image-close">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden><path d="M6 6l12 12M18 6 6 18" /></svg>
          </button>
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
              data-testid="image-canvas"
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
                if (r.w > 0.03 && r.h > 0.03) push({ ops: e.ops, box: r });
              }}
            />
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2 border-t border-line px-4 py-3">
          <span className="text-xs text-muted">{t.cropHint}</span>
          {error && <span role="alert" className="text-xs font-semibold text-coral-dark" data-testid="image-upload-error">{error}</span>}
          {busy && progress != null && (
            <span className="flex items-center gap-2 text-xs font-bold text-ink-2" role="status" data-testid="image-upload-progress">
              <span className="h-2 w-24 overflow-hidden rounded-full bg-paper-2"><span className="block h-full rounded-full bg-primary transition-[width]" style={{ width: `${progress}%` }} /></span>
              {progress}%
            </span>
          )}
          <button type="button" onClick={onCancel} className="ml-auto rounded-full px-4 py-2 text-sm font-bold text-ink-2 hover:bg-paper-2">{t.cancel}</button>
          <button type="button" onClick={apply} disabled={!img || busy} className="min-h-11 rounded-[10px] bg-primary px-5 text-sm font-bold text-white hover:bg-primary-dark disabled:opacity-50">
            {busy ? t.uploading : t.apply}
          </button>
        </div>
      </div>
    </div>
  );
}
