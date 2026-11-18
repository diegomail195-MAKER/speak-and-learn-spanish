"use client";

import { forwardRef, useLayoutEffect, useRef, useState, type ComponentProps } from "react";
import { createPortal } from "react-dom";
import { UiIcon, type IconName } from "./icons";

/**
 * 44×44 icon button with a 20px icon, 12px corners and a name tooltip that shows on hover and
 * on keyboard focus. The tooltip lives on <body> and is kept inside the screen (above the
 * button, or below when there is no room). The button's aria-label is the same text.
 *
 * Tones follow the editor tools: lavender (organize), mango (duplicate), coral (delete),
 * plain (white with a border).
 */
export type IconTone = "lavender" | "mango" | "coral" | "plain";

const tones: Record<IconTone, string> = {
  lavender: "bg-lavender text-plum hover:bg-lavender-2",
  mango: "bg-mango-soft text-plum hover:bg-mango",
  coral: "bg-coral-soft text-coral hover:bg-[#fbcfcb]",
  plain: "bg-card text-ink-2 border border-line hover:bg-paper-2",
};

export const IconButton = forwardRef<HTMLButtonElement, { icon: IconName; label: string; tone?: IconTone; size?: 44 | 40 } & Omit<ComponentProps<"button">, "children">>(
  function IconButton({ icon, label, tone = "plain", size = 44, className = "", onPointerEnter, onPointerLeave, onFocus, onBlur, ...rest }, ref) {
    const inner = useRef<HTMLButtonElement | null>(null);
    const [tip, setTip] = useState(false);
    return (
      <>
        <button
          ref={(el) => {
            inner.current = el;
            if (typeof ref === "function") ref(el);
            else if (ref) ref.current = el;
          }}
          type="button"
          aria-label={label}
          {...rest}
          onPointerEnter={(e) => (onPointerEnter?.(e), e.pointerType === "mouse" && setTip(true))}
          onPointerLeave={(e) => (onPointerLeave?.(e), setTip(false))}
          onFocus={(e) => (onFocus?.(e), e.currentTarget.matches(":focus-visible") && setTip(true))}
          onBlur={(e) => (onBlur?.(e), setTip(false))}
          className={`inline-grid shrink-0 place-items-center rounded-xl disabled:cursor-not-allowed disabled:opacity-40 ${size === 44 ? "h-11 w-11" : "h-10 w-10"} ${tones[tone]} ${className}`}
        >
          <UiIcon name={icon} size={20} />
        </button>
        {tip && <Tip anchor={inner.current} text={label} />}
      </>
    );
  },
);

function Tip({ anchor, text }: { anchor: HTMLElement | null; text: string }) {
  const el = useRef<HTMLSpanElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  useLayoutEffect(() => {
    if (!anchor || !el.current) return;
    const a = anchor.getBoundingClientRect();
    const t = el.current.getBoundingClientRect();
    const up = a.top - t.height - 8 >= 8;
    const top = up ? a.top - t.height - 8 : a.bottom + 8;
    const left = Math.min(Math.max(8, a.left + a.width / 2 - t.width / 2), window.innerWidth - t.width - 8);
    setPos({ top, left });
  }, [anchor, text]);
  if (!anchor) return null;
  return createPortal(
    <span
      ref={el}
      aria-hidden="true"
      role="presentation"
      style={{ position: "fixed", top: pos?.top ?? -9999, left: pos?.left ?? -9999 }}
      className="pointer-events-none z-[70] max-w-[min(260px,calc(100vw-16px))] rounded-lg bg-ink px-2.5 py-1.5 text-[13px] font-semibold leading-tight text-white shadow-[var(--shadow-menu)]"
    >
      {text}
    </span>,
    document.body,
  );
}
