import { notFound } from "next/navigation";
import { BackLink } from "@/components/library/BackLink";
import { LibraryFeedbackProvider } from "@/components/library/feedback";
import { ResourcePlayer } from "@/components/library/Players";
import { KindBadge } from "@/components/library/LibraryBits";
import { requireTeacherPage } from "@/lib/auth/guards";
import { HttpError } from "@/lib/auth/guards";
import { resourceForPreview } from "@/lib/library/service";
import { getMontessoriConfig } from "@/lib/montessori/server";

export default async function ResourcePreview({ params }: { params: Promise<{ id: string }> }) {
  const { user } = await requireTeacherPage();
  const { id } = await params;
  let r;
  try {
    r = await resourceForPreview(user, id, "published");
  } catch (e) {
    if (e instanceof HttpError) notFound();
    throw e;
  }
  return (
    <>
      <BackLink />
      <div className="mb-6 mt-3">
        <KindBadge kind={r.kind} />
        <h1 className="mt-2 font-display text-4xl font-extrabold">{r.title}</h1>
      </div>
      {/* Same Montessori feedback as students see; nothing is recorded in a preview. */}
      <LibraryFeedbackProvider config={await getMontessoriConfig()} topic={r.title}>
        <ResourcePlayer kind={r.kind} content={r.content} title={r.title} />
      </LibraryFeedbackProvider>
    </>
  );
}
