"use client";

import Link from "next/link";
import { createContext, useCallback, useContext, useEffect, useId, useLayoutEffect, useRef, useState, type ComponentProps, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { UiIcon, type IconName } from "./icons";

/**
 * Dropdown menu that always opens fully inside the screen: it is placed on <body> next to its
 * button, opens upward when there is no room below (last table row) and slides left/right to
 * stay off the edges. Keyboard: Enter/Space/↓ opens, ↑/↓/Home/End move, Esc closes and returns
 * focus to the button, Tab leaves.
 */
const MenuCtx = createContext<{ close: () => void } | null>(null);
const GAP = 8;
const EDGE = 8;

export function Menu({
  label,
  trigger,
  children,
  align = "end",
  width = 240,
  testId,
}: {
  /** Accessible name of the menu (and the button when it shows only an icon). */
  label: string;
  trigger: (p: { ref: React.Ref<HTMLButtonElement>; open: boolean; props: ComponentProps<"button"> }) => ReactNode;
  children: ReactNode;
  align?: "start" | "end";
  width?: number;
  testId?: string;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number; maxHeight: number } | null>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const id = useId();
  const focusFirst = useRef<"first" | "last" | null>(null);

  const place = useCallback(() => {
    const b = btn.current?.getBoundingClientRect();
    const m = list.current;
    if (!b || !m) return;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const w = Math.min(width, vw - EDGE * 2);
    const h = m.scrollHeight;
    const below = vh - b.bottom - GAP - EDGE;
    const above = b.top - GAP - EDGE;
    const up = h > below && above > below;
    const maxHeight = Math.max(120, up ? above : below);
    const top = up ? Math.max(EDGE, b.top - GAP - Math.min(h, maxHeight)) : b.bottom + GAP;
    let left = align === "end" ? b.right - w : b.left;
    left = Math.min(Math.max(EDGE, left), vw - w - EDGE);
    setPos({ top, left, maxHeight });
  }, [align, width]);

  useLayoutEffect(() => {
    if (!open) return;
    place();
    const items = list.current?.querySelectorAll<HTMLElement>('[role="menuitem"]:not([disabled])');
    if (items?.length) (focusFirst.current === "last" ? items[items.length - 1] : items[0]).focus({ preventScroll: true });
  }, [open, place]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!list.current?.contains(t) && !btn.current?.contains(t)) setOpen(false);
    };
    const onMove = () => place();
    document.addEventListener("pointerdown", onDown);
    window.addEventListener("resize", onMove);
    window.addEventListener("scroll", onMove, true);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      window.removeEventListener("resize", onMove);
      window.removeEventListener("scroll", onMove, true);
    };
  }, [open, place]);

  const close = useCallback((refocus = true) => {
    setOpen(false);
    if (refocus) btn.current?.focus();
  }, []);

  function onListKey(e: React.KeyboardEvent) {
    const items = [...(list.current?.querySelectorAll<HTMLElement>('[role="menuitem"]:not([disabled])') ?? [])];
    const i = items.indexOf(document.activeElement as HTMLElement);
    const go = (el: HTMLElement | undefined) => {
      e.preventDefault();
      el?.focus();
    };
    if (e.key === "Escape") {
      e.preventDefault();
      close();
    } else if (e.key === "ArrowDown") go(items[(i + 1) % items.length]);
    else if (e.key === "ArrowUp") go(items[(i - 1 + items.length) % items.length]);
    else if (e.key === "Home") go(items[0]);
    else if (e.key === "End") go(items[items.length - 1]);
    else if (e.key === "Tab") close(false);
  }

  return (
    <>
      {trigger({
        ref: btn,
        open,
        props: {
          type: "button",
          "aria-haspopup": "menu",
          "aria-expanded": open,
          "aria-controls": open ? id : undefined,
          onClick: () => ((focusFirst.current = "first"), setOpen((o) => !o)),
          onKeyDown: (e) => {
            if (e.key === "ArrowDown" || e.key === "ArrowUp") {
              e.preventDefault();
              focusFirst.current = e.key === "ArrowUp" ? "last" : "first";
              setOpen(true);
            }
          },
        },
      })}
      {open &&
        createPortal(
          <MenuCtx.Provider value={{ close: () => close() }}>
            <div
              ref={list}
              id={id}
              role="menu"
              aria-label={label}
              data-testid={testId}
              onKeyDown={onListKey}
              style={{ position: "fixed", top: pos?.top ?? -9999, left: pos?.left ?? -9999, width: `min(${width}px, calc(100vw - ${EDGE * 2}px))`, maxHeight: pos?.maxHeight }}
              className="z-[60] overflow-y-auto rounded-xl border border-line bg-card p-1.5 text-[15px] text-ink shadow-[var(--shadow-menu)]"
            >
              {children}
            </div>
          </MenuCtx.Provider>,
          document.body,
        )}
    </>
  );
}

const itemClass = (tone: "default" | "danger", active?: boolean) =>
  `flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-left font-semibold outline-none focus-visible:outline-2 focus-visible:outline-offset-[-2px] disabled:cursor-not-allowed disabled:opacity-50 ${
    tone === "danger" ? "text-coral-dark hover:bg-coral-soft focus:bg-coral-soft" : active ? "bg-primary-soft text-primary" : "text-ink hover:bg-paper-2 focus:bg-paper-2"
  }`;

type ItemBase = { icon?: IconName; tone?: "default" | "danger"; children: ReactNode };

export function MenuItem({ icon, tone = "default", children, onSelect, keepOpen, ...rest }: ItemBase & Omit<ComponentProps<"button">, "children"> & { onSelect?: () => void; keepOpen?: boolean }) {
  const ctx = useContext(MenuCtx);
  return (
    <button
      type="button"
      role="menuitem"
      {...rest}
      onClick={(e) => {
        rest.onClick?.(e);
        onSelect?.();
        if (!keepOpen && rest.type !== "submit") ctx?.close();
      }}
      className={itemClass(tone)}
    >
      {icon && <UiIcon name={icon} className={tone === "danger" ? "text-coral" : "text-muted"} />}
      <span className="min-w-0 flex-1">{children}</span>
    </button>
  );
}

export function MenuLink({ icon, tone = "default", children, href, active, ...rest }: ItemBase & { href: string; active?: boolean } & Omit<ComponentProps<typeof Link>, "children" | "href">) {
  const ctx = useContext(MenuCtx);
  return (
    <Link href={href} role="menuitem" aria-current={active ? "page" : undefined} {...rest} onClick={() => ctx?.close()} className={itemClass(tone, active)}>
      {icon && <UiIcon name={icon} className={active ? "text-primary" : "text-muted"} />}
      <span className="min-w-0 flex-1">{children}</span>
    </Link>
  );
}

export function MenuSeparator() {
  return <div role="separator" className="my-1.5 h-px bg-line" />;
}

export function MenuHeader({ children }: { children: ReactNode }) {
  return <div className="px-3 pb-2 pt-1.5">{children}</div>;
}
