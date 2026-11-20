import { notFound } from "next/navigation";
import { TopicPreview } from "@/components/library/TopicPreview";
import { HttpError, requireAdminPage } from "@/lib/auth/guards";
import { previewOutline } from "@/lib/library/previewData";

export const metadata = { title: "Preview topic" };

// Platform Admin › Topics › Preview: every resource of the topic in its configured order, with free
// navigation (Previous / Next, the resource list) and the real players. Draft resources play their
// draft content so they can be checked before publishing. A test session: nothing is recorded.
export default async function AdminTopicPreview({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ step?: string }> }) {
  const { user } = await requireAdminPage();
  const { id } = await params;
  const sp = await searchParams;
  const data = await previewOutline({ ...user, teacher: user.teacher }, "admin", { id }).catch((e) => {
    if (e instanceof HttpError && e.status === 404) notFound();
    throw e;
  });
  const { topic, steps, drafts } = data;
  const n = Number(sp.step);
  return (
    <TopicPreview
      scope="admin"
      topicId={topic.id}
      grade={null}
      title={`${topic.titleEs} · ${topic.titleEn}`}
      topic={{ art: topic.art, color: topic.color }}
      steps={steps}
      initialIndex={Number.isInteger(n) ? n - 1 : null}
      exitHref={`/admin/topics/${topic.id}`}
      note={drafts > 0 ? `${drafts} resource${drafts === 1 ? " is a draft" : "s are drafts"}: shown with the draft content.` : undefined}
    />
  );
}
