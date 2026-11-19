import { NewResourceForm } from "@/components/admin/ResourceForms";
import { PageHeader, Panel } from "@/components/ui/Panel";
import { db } from "@/lib/db";

export const metadata = { title: "Add Content" };

export default async function AddContent({ searchParams }: { searchParams: Promise<{ topicId?: string }> }) {
  const { topicId } = await searchParams;
  const topics = await db.topic.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, titleEn: true, titleEs: true } });
  return (
    <>
      <PageHeader title="Add Content" subtitle="Videos, songs, flashcards, games, printables and worksheets. One resource can be in several grades and topics without uploading it twice." />
      <Panel><NewResourceForm topics={topics} topicId={topicId} /></Panel>
    </>
  );
}
