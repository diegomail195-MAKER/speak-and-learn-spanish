"use client";

import Link from "next/link";
import { useActionState } from "react";
import { StatusPillClient } from "./StatusPillClient";
import { WsIcon } from "@/components/shell/WsIcons";
import { setTopicStatus } from "@/lib/actions/library";

/** Topic editor header: status, Preview and the publish / unpublish / archive / restore buttons. */
export function TopicStatusBar({ topicId, status, assignments }: { topicId: string; status: string; assignments: number }) {
  const [state, action, pending] = useActionState(setTopicStatus, undefined);
  return (
    <div className="ws-card mb-6 p-4" data-testid="topic-status-bar">
      <form action={action} className="flex flex-wrap items-center gap-3">
        <input type="hidden" name="topicId" value={topicId} />
        <span className="font-bold text-[#3D4759]">Status</span>
        <StatusPillClient status={status} />
        <span className="flex-1" />
        <Link href={`/admin/topics/${topicId}/preview`} className="ws-btn ws-btn-secondary" data-testid="topic-preview"><WsIcon name="eye" className="h-5 w-5" /> Preview</Link>
        {status === "DRAFT" && <button name="to" value="publish" disabled={pending} className="ws-btn ws-btn-primary" data-testid="topic-publish">Publish</button>}
        {status === "PUBLISHED" && <button name="to" value="unpublish" disabled={pending} className="ws-btn ws-btn-secondary" data-testid="topic-unpublish">Unpublish</button>}
        {status !== "ARCHIVED" && <button name="to" value="archive" disabled={pending} className="ws-btn ws-btn-danger" data-testid="topic-archive">Archive</button>}
        {status === "ARCHIVED" && <button name="to" value="restore" disabled={pending} className="ws-btn ws-btn-secondary" data-testid="topic-restore">Restore as draft</button>}
      </form>
      {state?.error && <p role="alert" className="mt-3 rounded-lg bg-[#FEF3F2] px-3 py-2 text-sm font-semibold text-[#B42318]">{state.error}</p>}
      {state?.message && <p role="status" className="mt-3 rounded-lg bg-[#E7F6EC] px-3 py-2 text-sm font-semibold text-[#17803D]">{state.message}</p>}
      {assignments > 0 && <p className="mt-3 text-sm text-[#5B6577]">Used in {assignments} assignment{assignments === 1 ? "" : "s"}. Each one keeps the resource versions it was assigned with, so publishing changes here never alters students’ recorded progress.</p>}
    </div>
  );
}
