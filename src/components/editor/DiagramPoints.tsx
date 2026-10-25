"use client";

import { useRef } from "react";
import { plainText } from "@/lib/text/segments";

type Point = { x?: number; y?: number; label: string };

/**
 * Label the Diagram editor: the picture with numbered points. Clicking the picture places the
 * chosen point there; a placed point can be dragged. Positions are % of the picture so they
 * hold at any screen size.
 */
export function DiagramPoints({ imageUrl, points, active, onSelect, onPlace }: { imageUrl: string; points: Point[]; active: number; onSelect: (i: number) => void; onPlace: (i: number, x: number, y: number) => void }) {
  const box = useRef<HTMLDivElement>(null);
  const dragging = useRef<number | null>(null);

  function pos(e: { clientX: number; clientY: number }) {
    const r = box.current!.getBoundingClientRect();
    const clamp = (v: number) => Math.round(Math.min(98, Math.max(2, v)) * 10) / 10;
    return [clamp(((e.clientX - r.left) / r.width) * 100), clamp(((e.clientY - r.top) / r.height) * 100)] as const;
  }

  return (
    <div
      ref={box}
      className="relative w-full max-w-2xl cursor-crosshair select-none overflow-hidden rounded-xl border border-line"
      onClick={(e) => {
        if (dragging.current !== null) return;
        const [x, y] = pos(e);
        onPlace(active, x, y);
      }}
      onPointerMove={(e) => {
        if (dragging.current === null) return;
        const [x, y] = pos(e);
        onPlace(dragging.current, x, y);
      }}
      onPointerUp={() => setTimeout(() => (dragging.current = null), 0)}
      data-testid="diagram-editor"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={imageUrl} alt="Picture to label" className="block w-full" draggable={false} />
      {points.map((p, i) =>
        p.x == null || p.y == null ? null : (
          <button
            key={i}
            type="button"
            aria-label={`Point ${i + 1}${p.label ? `: ${plainText(p.label)}` : ""}`}
            onPointerDown={(e) => {
              e.stopPropagation();
              (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
              dragging.current = i;
              onSelect(i);
            }}
            onClick={(e) => e.stopPropagation()}
            className={`absolute flex -translate-x-1/2 -translate-y-1/2 cursor-grab items-center gap-1 rounded-full border-[3px] border-white px-2 py-0.5 font-display text-sm font-bold text-white shadow-soft ${i === active ? "bg-teal ring-4 ring-teal/30" : "bg-ink"}`}
            style={{ left: `${p.x}%`, top: `${p.y}%` }}
          >
            {i + 1}
            {p.label && <span className="max-w-[8rem] truncate font-sans text-xs font-semibold">{plainText(p.label)}</span>}
          </button>
        ),
      )}
    </div>
  );
}
