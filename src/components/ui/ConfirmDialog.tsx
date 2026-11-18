"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { Button } from "./Button";

/** Small modal to confirm an action that can't be undone. Esc or Cancel closes it. */
export function ConfirmDialog({
  title,
  body,
  confirmLabel,
  tone = "primary",
  busy,
  onConfirm,
  onCancel,
}: {
  title: string;
  body?: ReactNode;
  confirmLabel: string;
  tone?: "primary" | "danger";
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    cancelRef.current?.focus();
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onCancel();
    window.addEventListener("keydown", esc);
    return () => (window.removeEventListener("keydown", esc), prev?.focus?.());
  }, [onCancel]);
  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-ink/40 p-4" onMouseDown={(e) => e.target === e.currentTarget && onCancel()}>
      <div role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" className="w-full max-w-sm rounded-xl border border-line bg-card p-6 shadow-[var(--shadow-menu)]">
        <h2 id="confirm-title" className="text-lg font-bold text-ink">{title}</h2>
        {body && <div className="mt-2 text-[15px] text-ink-2">{body}</div>}
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <Button ref={cancelRef} variant="secondary" onClick={onCancel}>Cancel</Button>
          <Button variant={tone === "danger" ? "danger" : "primary"} onClick={onConfirm} disabled={busy} data-testid="confirm-action">
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
