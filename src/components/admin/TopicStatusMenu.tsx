"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { WsIcon } from "@/components/shell/WsIcons";
import { setTopicStatus } from "@/lib/actions/library";

const OPTIONS: Record<string, Array<{ to: string; label: string }>> = {
  DRAFT: [{ to: "publish", label: "Publish" }, { to: "archive", label: "Archive" }],
  PUBLISHED: [{ to: "unpublish", label: "Unpublish (back to draft)" }, { to: "archive", label: "Archive" }],
  ARCHIVED: [{ to: "restore", label: "Restore as draft" }],
};

/** "⋯" menu of a topic row: publish, unpublish, archive or restore (checked again on the server). */
export function TopicStatusMenu({ topicId, title, status }: { topicId: string; title: string; status: string }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(setTopicStatus, undefined);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onDown = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
    };
  }, [open]);
  useEffect(() => {
    if (state) setOpen(false);
  }, [state]);
  return (
    <div className="relative" ref={ref}>
      <button type="button" className="ws-btn ws-btn-secondary w-11 px-0" aria-haspopup="true" aria-expanded={open} aria-label={`More actions for ${title}`} onClick={() => setOpen((o) => !o)} data-testid="topic-more">
        <span aria-hidden className="text-xl leading-none">⋯</span>
      </button>
      {open && (
        <form action={action} className="ws-popup right-0 top-full mt-1 w-64 py-1">
          <input type="hidden" name="topicId" value={topicId} />
          {(OPTIONS[status] ?? []).map((o) => (
            <button key={o.to} name="to" value={o.to} disabled={pending} className="ws-popup-item w-full text-left" data-testid={`topic-${o.to}`}>
              {o.label}
            </button>
          ))}
        </form>
      )}
      {state?.error && (
        <p role="alert" className="absolute right-0 top-full z-10 mt-1 w-72 rounded-lg border border-[#F1B7B0] bg-[#FEF3F2] p-3 text-sm font-semibold text-[#B42318]">
          <WsIcon name="alert" className="mr-1 inline h-4 w-4" />
          {state.error}
        </p>
      )}
    </div>
  );
}
