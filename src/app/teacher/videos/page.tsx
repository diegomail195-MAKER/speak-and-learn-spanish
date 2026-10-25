import Link from "next/link";
import { ButtonLink } from "@/components/ui/Button";
import { Badge, EmptyState, PageHeader } from "@/components/ui/Panel";
import { deleteVideo, setVideoStatus } from "@/lib/actions/videos";
import { requireTeacherPage } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { toPlayVideo } from "@/lib/videos";

export const metadata = { title: "Videos" };

const fmt = (s: number | null) => (s == null ? "" : `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`);

export default async function VideosPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; category?: string; source?: string }> }) {
  const sp = await searchParams;
  const { user } = await requireTeacherPage();
  const status = ["DRAFT", "PUBLISHED", "ARCHIVED"].includes(sp.status ?? "") ? (sp.status as "DRAFT" | "PUBLISHED" | "ARCHIVED") : undefined;
  const [videos, categories] = await Promise.all([
    db.video.findMany({
      where: {
        schoolId: user.schoolId,
        status: status ?? { not: "ARCHIVED" },
        categoryId: sp.category || undefined,
        source: sp.source === "HOSTED" || sp.source === "YOUTUBE" ? sp.source : undefined,
        ...(sp.q ? { OR: [{ title: { contains: sp.q, mode: "insensitive" as const } }, { keywords: { has: sp.q.toLowerCase() } }, { description: { contains: sp.q, mode: "insensitive" as const } }] } : {}),
      },
      include: { category: true, practiceGame: { select: { title: true } }, _count: { select: { assignments: true } } },
      orderBy: { updatedAt: "desc" },
    }),
    db.category.findMany({ where: { schoolId: user.schoolId }, orderBy: { sortOrder: "asc" } }),
  ]);

  return (
    <>
      <PageHeader
        eyebrow="Videos"
        title="Video library"
        subtitle="Upload your own videos or add YouTube links, then assign them or group them into collections."
        actions={
          <>
            <ButtonLink href="/teacher/videos/collections" variant="secondary">Collections</ButtonLink>
            <ButtonLink href="/teacher/videos/new">Add video</ButtonLink>
          </>
        }
      />
      <form className="mb-4 flex flex-wrap gap-2 text-sm">
        <input name="q" defaultValue={sp.q} placeholder="Search title, keyword" className="h-10 min-w-56 flex-1 rounded-full border border-line bg-card px-4" aria-label="Search" />
        <select name="source" defaultValue={sp.source ?? ""} className="h-10 rounded-full border border-line bg-card px-3" aria-label="Source">
          <option value="">All sources</option>
          <option value="HOSTED">Uploaded</option>
          <option value="YOUTUBE">YouTube</option>
        </select>
        <select name="status" defaultValue={sp.status ?? ""} className="h-10 rounded-full border border-line bg-card px-3" aria-label="Status">
          <option value="">Drafts &amp; published</option>
          <option value="DRAFT">Drafts</option>
          <option value="PUBLISHED">Published</option>
          <option value="ARCHIVED">Archived</option>
        </select>
        <select name="category" defaultValue={sp.category ?? ""} className="h-10 rounded-full border border-line bg-card px-3" aria-label="Category">
          <option value="">All categories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.nameEn}</option>)}
        </select>
        <button className="h-10 rounded-full bg-ink px-5 font-bold text-white">Filter</button>
      </form>
      {videos.length === 0 ? (
        <EmptyState title="No videos yet" body="Upload an MP4 from your computer or paste a YouTube link." action={<ButtonLink href="/teacher/videos/new">Add video</ButtonLink>} />
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-xl2 border border-line bg-card">
          {videos.map((v) => {
            const cover = toPlayVideo(v).coverUrl;
            return (
              <li key={v.id} className="flex flex-wrap items-center gap-4 px-5 py-3.5">
                <Link href={`/teacher/videos/${v.id}`} className="relative aspect-video w-32 shrink-0 overflow-hidden rounded-lg bg-paper-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {cover && <img src={cover} alt="" className="h-full w-full object-cover" loading="lazy" />}
                  {v.durationSec != null && <span className="absolute bottom-1 right-1 rounded bg-ink/80 px-1 text-[11px] font-bold text-white">{fmt(v.durationSec)}</span>}
                </Link>
                <Link href={`/teacher/videos/${v.id}/edit`} className="min-w-52 flex-1">
                  <span className="block font-display text-lg font-semibold hover:text-coral">{v.title}</span>
                  <span className="text-sm text-muted">
                    {v.source === "YOUTUBE" ? "YouTube" : "Uploaded"}
                    {v.category ? ` · ${v.category.nameEn}` : ""}
                    {v.level ? ` · ${v.level}` : ""}
                    {v.practiceGame ? ` · practice: ${v.practiceGame.title}` : ""}
                  </span>
                </Link>
                <Badge tone={v.status === "PUBLISHED" ? "leaf" : v.status === "ARCHIVED" ? "coral" : "neutral"}>{v.status.toLowerCase()}</Badge>
                <div className="flex flex-wrap items-center gap-1 text-sm font-bold">
                  <Link href={`/teacher/videos/${v.id}`} className="rounded-full px-3 py-1.5 text-ink-2 hover:bg-paper-2">Watch</Link>
                  {v.status === "PUBLISHED" && <Link href={`/teacher/assignments/new?videoId=${v.id}`} className="rounded-full px-3 py-1.5 text-teal-dark hover:bg-teal-soft">Assign</Link>}
                  <form action={setVideoStatus}>
                    <input type="hidden" name="videoId" value={v.id} />
                    <input type="hidden" name="status" value={v.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED"} />
                    <button className="rounded-full px-3 py-1.5 text-ink-2 hover:bg-paper-2">{v.status === "PUBLISHED" ? "Unpublish" : "Publish"}</button>
                  </form>
                  {v.status !== "ARCHIVED" ? (
                    <form action={setVideoStatus}>
                      <input type="hidden" name="videoId" value={v.id} />
                      <input type="hidden" name="status" value="ARCHIVED" />
                      <button className="rounded-full px-3 py-1.5 text-ink-2 hover:bg-paper-2">Archive</button>
                    </form>
                  ) : (
                    <details className="relative">
                      <summary className="cursor-pointer list-none rounded-full px-3 py-1.5 text-coral-dark hover:bg-coral-soft">Delete…</summary>
                      <form action={deleteVideo} className="absolute right-0 z-10 mt-1 w-64 rounded-xl border border-line bg-card p-3 text-xs font-normal shadow-soft">
                        <input type="hidden" name="videoId" value={v.id} />
                        <p>Deletes the video, its assignments and watch history. Type <strong>DELETE</strong> to confirm.</p>
                        <input name="confirm" required pattern="DELETE" className="mt-2 w-full rounded-lg border border-line px-2 py-1" aria-label="Type DELETE" />
                        <button className="mt-2 rounded-full bg-coral px-3 py-1 font-bold text-white">Delete forever</button>
                      </form>
                    </details>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
