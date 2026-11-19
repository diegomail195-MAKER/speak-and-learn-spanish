import { TOPIC_STATUS_LABEL } from "@/lib/library/topicMeta";

export function StatusPillClient({ status }: { status: string }) {
  const cls = status === "PUBLISHED" ? "ws-pill-published" : status === "DRAFT" ? "ws-pill-draft" : "ws-pill-archived";
  return <span className={`ws-pill ${cls}`} data-testid="status-pill">{TOPIC_STATUS_LABEL[status] ?? status}</span>;
}
