"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { Icon } from "@/components/ui/Art";
import { KIND_ACCESS_LABEL, KIND_ICON_3D } from "@/lib/library/kindIcons";
import { KIND_LABEL, type Kind } from "@/lib/library/types";

export type AccessItem = { key: string; title: string; href: string };

/** The category picture: one of the five 3D icons, or a colored tile for the other types. */
export function KindPicture({ kind }: { kind: string }) {
  const src = KIND_ICON_3D[kind];
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt="" width={32} height={32} className="topic-access-img" />;
  }
  const k = KIND_LABEL[kind as Kind];
  return (
    <span className="topic-access-img grid place-items-center rounded-lg text-white" style={{ background: k?.color ?? "#8A94A6" }} aria-hidden>
      <Icon name={k?.icon ?? "book"} className="h-5 w-5" />
    </span>
  );
}

/**
 * One category access in a teacher's topic row: a preview of the resources (nothing is recorded).
 * One resource → a link to its preview; several of the same type → a small menu with their titles.
 */
export function TopicAccess({ kind, items, topic }: { kind: string; items: AccessItem[]; topic: string }) {
  const label = KIND_ACCESS_LABEL[kind] ?? kind;
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const close = (e: Event) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !box.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", close);
    return () => (document.removeEventListener("pointerdown", close), document.removeEventListener("keydown", close));
  }, [open]);

  const inner = (
    <>
      <span className="relative">
        <KindPicture kind={kind} />
        {items.length > 1 && <span className="topic-access-count" aria-hidden>{items.length}</span>}
      </span>
      <span className="topic-access-label">{label}</span>
    </>
  );

  if (items.length === 1) {
    return (
      <Link href={items[0].href} className="topic-access" aria-label={`Preview ${label}: ${items[0].title} (${topic})`} title={items[0].title} data-testid="topic-access" data-kind={kind}>
        {inner}
      </Link>
    );
  }
  return (
    <div ref={box} className="relative">
      <button
        type="button"
        className="topic-access"
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={`Preview ${label}: ${items.length} resources (${topic})`}
        onClick={() => setOpen((o) => !o)}
        data-testid="topic-access"
        data-kind={kind}
      >
        {inner}
      </button>
      {open && (
        <ul id={menuId} className="topic-access-menu" data-testid="topic-access-menu">
          {items.map((it) => (
            <li key={it.key}>
              <Link href={it.href} className="topic-access-option" onClick={() => setOpen(false)}>
                <KindPicture kind={kind} />
                <span className="min-w-0 flex-1 break-words">{it.title}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
