import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { EmptyState, PageHeader, Panel } from "@/components/ui/Panel";
import { createCollection } from "@/lib/actions/videos";
import { requireTeacherPage } from "@/lib/auth/guards";
import { db } from "@/lib/db";

export const metadata = { title: "Collections" };

export default async function Collections() {
  const { user } = await requireTeacherPage();
  const list = await db.collection.findMany({ where: { schoolId: user.schoolId }, include: { _count: { select: { videos: true } } }, orderBy: { createdAt: "desc" } });
  return (
    <>
      <PageHeader eyebrow="Videos" title="Collections" subtitle="Ordered sets of videos, e.g. a unit. Assign a whole collection at once." />
      <Panel className="mb-6">
        <form action={createCollection} className="flex flex-wrap items-end gap-3">
          <Input name="title" placeholder="Unidad 3: Los animales" required maxLength={120} className="min-w-64 flex-1" aria-label="Collection title" lang="es" />
          <Button>Create collection</Button>
        </form>
      </Panel>
      {list.length === 0 ? (
        <EmptyState title="No collections yet" />
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-xl2 border border-line bg-card">
          {list.map((c) => (
            <li key={c.id}>
              <Link href={`/teacher/videos/collections/${c.id}`} className="flex items-center justify-between px-5 py-4 hover:bg-paper">
                <span className="font-display text-lg font-semibold">{c.title}</span>
                <span className="text-sm text-muted">{c._count.videos} videos</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
