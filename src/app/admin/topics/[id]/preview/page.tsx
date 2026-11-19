import Link from "next/link";
import { notFound } from "next/navigation";
import { StatusPill } from "@/components/dashboard/DashBits";
import { EyeIcon } from "@/components/library/LibraryBits";
import { TopicLesson } from "@/components/library/TopicLesson";
import { requireAdminPage } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import type { LessonStep } from "@/lib/library/lessonData";
import { safeContent, type AnyContent, type Kind } from "@/lib/library/types";

export const metadata = { title: "Preview topic" };

// Platform Admin › Preview: the whole topic as a student will get it (presentation, each activity,
// final screen) in the topic's resource order. Draft resources play their draft content so the
// flow can be checked before publishing. Nothing is recorded.
export default async function AdminTopicPreview({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminPage();
  const { id } = await params;
  const topic = await db.topic.findUnique({
    where: { id },
    include: { resources: { where: { resource: { status: { not: "ARCHIVED" } } }, orderBy: { position: "asc" }, include: { resource: { include: { currentVersion: { select: { title: true, content: true } } } } } } },
  });
  if (!topic) notFound();
  const steps: LessonStep[] = topic.resources.map(({ resource: r }) => {
    const usePublished = r.status === "PUBLISHED" && r.currentVersion;
    const raw = usePublished ? r.currentVersion!.content : r.draft;
    return { id: `r:${r.id}`, kind: r.kind as Kind, title: usePublished ? r.currentVersion!.title : r.title, content: safeContent(r.kind as Kind, raw) as AnyContent, game: null, done: false };
  });
  const drafts = topic.resources.filter((r) => r.resource.status !== "PUBLISHED").length;
  const back = `/admin/topics/${topic.id}`;
  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-[#E2E6EC] bg-white px-4 py-3" data-testid="admin-preview-banner">
        <span className="inline-flex items-center gap-2 font-bold text-[#172033]"><EyeIcon /> Preview · nothing is saved</span>
        <StatusPill status={topic.status} />
        {drafts > 0 && <span className="text-sm text-[#5B6577]">{drafts} resource{drafts === 1 ? " is a draft" : "s are drafts"} (shown with their draft content)</span>}
        <span className="flex-1" />
        <Link href={back} className="ws-btn ws-btn-secondary">Back to editing</Link>
      </div>
      {steps.length === 0 ? (
        <div className="ws-card p-8 text-center"><p className="font-bold">This topic has no resources yet.</p><Link href={back} className="ws-btn ws-btn-primary mt-4">Add resources</Link></div>
      ) : (
        <TopicLesson mode="preview" title={`${topic.titleEs} · ${topic.titleEn}`} topic={{ art: topic.art, color: topic.color }} steps={steps} lessonHref={`/admin/topics/${topic.id}/preview`} nextHref={null} exitHref={back} />
      )}
    </>
  );
}
