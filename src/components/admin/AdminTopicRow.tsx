import Link from "next/link";
import { LocalTime } from "@/components/dashboard/LocalTime";
import { Kind3D, StatusPill, TopicThumb, orderedKinds } from "@/components/dashboard/DashBits";
import { WsIcon } from "@/components/shell/WsIcons";
import { LANGUAGE_LABEL } from "@/lib/library/topicMeta";
import { TopicStatusMenu } from "./TopicStatusMenu";

export type AdminRowTopic = {
  id: string;
  titleEs: string;
  titleEn: string;
  art: string;
  color: string;
  status: string;
  category: string;
  language: string;
  updatedAt: Date;
  grade: { name: string } | null;
  resources: Array<{ resource: { kind: string; status: string } }>;
  _count?: { assignments: number };
};

/** A topic in Platform Admin: thumbnail, title, resources, status and Preview / Edit (and the status menu). */
export function AdminTopicRow({ topic: t, detailed = false }: { topic: AdminRowTopic; detailed?: boolean }) {
  const n = t.resources.length;
  const kinds = orderedKinds(t.resources.map((r) => r.resource.kind));
  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-3 py-4 sm:flex-nowrap" data-testid="admin-topic-row">
      <TopicThumb topic={t} size={detailed ? "md" : "xl"} />
      <div className="min-w-0 flex-1 basis-48">
        <p className="font-display text-xl font-extrabold leading-tight text-[#172033] [overflow-wrap:anywhere]">
          {t.titleEs}
          {detailed && t.titleEn !== t.titleEs && <span className="ml-2 text-sm font-bold text-[#5B6577]">{t.titleEn}</span>}
        </p>
        <p className="mt-1 text-[15px] text-[#5B6577]">
          {n} resource{n === 1 ? "" : "s"} · Updated <LocalTime iso={t.updatedAt.toISOString()} mode="day" />
          {detailed && (
            <>
              {" · "}
              {t.category} · {LANGUAGE_LABEL[t.language] ?? t.language}
              {t.grade ? ` · ${t.grade.name}` : ""}
              {t._count && t._count.assignments > 0 ? ` · used in ${t._count.assignments} assignment${t._count.assignments === 1 ? "" : "s"}` : ""}
            </>
          )}
        </p>
        {detailed && kinds.length > 0 && (
          <p className="mt-2 flex flex-wrap gap-1.5" aria-label={`Resource types: ${kinds.join(", ")}`}>
            {kinds.map((k) => <Kind3D key={k} kind={k} className="h-7 w-7" />)}
          </p>
        )}
      </div>
      <StatusPill status={t.status} />
      <div className="flex shrink-0 items-center gap-2">
        <Link href={`/admin/topics/${t.id}/preview`} className="ws-btn ws-btn-secondary" aria-label={`Preview ${t.titleEs}`} data-testid="topic-preview">
          <WsIcon name="eye" className="h-5 w-5" /> Preview
        </Link>
        <Link href={`/admin/topics/${t.id}`} className="ws-btn ws-btn-primary" aria-label={`Edit ${t.titleEs}`} data-testid="topic-edit">
          <WsIcon name="pencil" className="h-5 w-5" /> Edit
        </Link>
        {detailed && <TopicStatusMenu topicId={t.id} title={t.titleEs} status={t.status} />}
      </div>
    </li>
  );
}
