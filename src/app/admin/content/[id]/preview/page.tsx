import Link from "next/link";
import { notFound } from "next/navigation";
import { LibraryFeedbackProvider } from "@/components/library/feedback";
import { ResourcePlayer } from "@/components/library/Players";
import { KindBadge } from "@/components/library/LibraryBits";
import { requireAdminPage } from "@/lib/auth/guards";
import { resourceForPreview } from "@/lib/library/service";
import { getMontessoriConfig } from "@/lib/montessori/server";

export default async function DraftPreview({ params }: { params: Promise<{ id: string }> }) {
  const { user } = await requireAdminPage();
  const { id } = await params;
  const r = await resourceForPreview(user, id, "draft").catch(() => null);
  if (!r) notFound();
  return (
    <>
      <p className="no-print mb-3 rounded-[18px] bg-sun-soft px-4 py-2 text-sm font-bold">Draft preview — this is what students will see after you publish. <Link href={`/admin/content/${id}`} className="text-sky underline">Back to the editor</Link></p>
      <KindBadge kind={r.kind} />
      <h1 className="mb-6 mt-2 font-display text-4xl font-extrabold">{r.title}</h1>
      {/* Same Montessori feedback as students see; nothing is recorded in a preview. */}
      <LibraryFeedbackProvider config={await getMontessoriConfig()} topic={r.title}>
        <ResourcePlayer kind={r.kind} content={r.content} title={r.title} />
      </LibraryFeedbackProvider>
    </>
  );
}
