import { notFound } from "next/navigation";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Select } from "@/components/ui/Field";
import { Badge, EmptyState, PageHeader, Panel } from "@/components/ui/Panel";
import { addToCollection, deleteCollection, moveInCollection, removeFromCollection } from "@/lib/actions/videos";
import { requireTeacherPage } from "@/lib/auth/guards";
import { db } from "@/lib/db";

export default async function CollectionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user } = await requireTeacherPage();
  const c = await db.collection.findFirst({ where: { id, schoolId: user.schoolId }, include: { videos: { orderBy: { position: "asc" }, include: { video: true } } } });
  if (!c) notFound();
  const all = await db.video.findMany({ where: { schoolId: user.schoolId, status: { not: "ARCHIVED" }, id: { notIn: c.videos.map((x) => x.videoId) } }, orderBy: { title: "asc" } });
  return (
    <>
      <PageHeader eyebrow="Collection" title={c.title} actions={c.videos.length > 0 ? <ButtonLink href={`/teacher/assignments/new?collectionId=${c.id}`} variant="voice">Assign collection</ButtonLink> : undefined} />
      <Panel className="mb-6">
        <form action={addToCollection} className="flex flex-wrap gap-2">
          <input type="hidden" name="collectionId" value={c.id} />
          <Select name="videoId" required defaultValue="" aria-label="Video to add" className="min-w-64 flex-1">
            <option value="" disabled>Choose a video to add</option>
            {all.map((v) => <option key={v.id} value={v.id}>{v.title}{v.status !== "PUBLISHED" ? " (draft)" : ""}</option>)}
          </Select>
          <Button>Add</Button>
        </form>
        <p className="mt-2 text-xs text-muted">Students only see the published videos of a collection.</p>
      </Panel>
      {c.videos.length === 0 ? (
        <EmptyState title="This collection is empty" />
      ) : (
        <ol className="divide-y divide-line overflow-hidden rounded-xl2 border border-line bg-card">
          {c.videos.map((x, i) => (
            <li key={x.videoId} className="flex flex-wrap items-center gap-3 px-5 py-3">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-ink text-xs font-bold text-white">{i + 1}</span>
              <span className="flex-1 font-bold">{x.video.title}</span>
              {x.video.status !== "PUBLISHED" && <Badge>draft</Badge>}
              {(["up", "down"] as const).map((dir) => (
                <form key={dir} action={moveInCollection}>
                  <input type="hidden" name="collectionId" value={c.id} />
                  <input type="hidden" name="videoId" value={x.videoId} />
                  <input type="hidden" name="dir" value={dir} />
                  <button className="rounded-full px-2 py-1 text-muted hover:bg-paper-2" aria-label={`Move ${dir}`} disabled={(dir === "up" && i === 0) || (dir === "down" && i === c.videos.length - 1)}>{dir === "up" ? "↑" : "↓"}</button>
                </form>
              ))}
              <form action={removeFromCollection}>
                <input type="hidden" name="collectionId" value={c.id} />
                <input type="hidden" name="videoId" value={x.videoId} />
                <button className="rounded-full px-3 py-1 text-sm font-bold text-muted hover:bg-coral-soft hover:text-coral-dark">Remove</button>
              </form>
            </li>
          ))}
        </ol>
      )}
      <form action={deleteCollection} className="mt-8 flex items-center gap-2 text-sm">
        <input type="hidden" name="collectionId" value={c.id} />
        <label className="flex items-center gap-1 text-muted"><input type="checkbox" name="confirm" value="yes" required /> I want to delete this collection (videos are kept)</label>
        <Button size="sm" variant="danger">Delete collection</Button>
      </form>
    </>
  );
}
