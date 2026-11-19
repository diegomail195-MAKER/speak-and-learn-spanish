import Link from "next/link";
import { TopicForm } from "@/components/admin/TopicForm";
import { Card, PageTitle } from "@/components/dashboard/DashBits";
import { requireAdminPage } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { pickableLibrary } from "@/lib/library/service";

export const metadata = { title: "Create topic" };

export default async function NewTopic() {
  await requireAdminPage();
  const [grades, library, categories] = await Promise.all([
    db.grade.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }], select: { id: true, name: true } }),
    pickableLibrary(),
    db.topic.findMany({ select: { category: true }, distinct: ["category"], orderBy: { category: "asc" } }),
  ]);
  return (
    <>
      <Link href="/admin/topics" className="ws-link inline-flex min-h-11 items-center">‹ Topics</Link>
      <PageTitle title="Create topic" subtitle="Title, description, thumbnail and classification. You can add and order its resources now or after saving." />
      <Card>
        <TopicForm grades={grades} library={library} categories={categories.map((c) => c.category)} />
      </Card>
    </>
  );
}
