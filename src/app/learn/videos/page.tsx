import Link from "next/link";
import { assignmentsForStudentWhere } from "@/lib/access";
import { requireStudentPage } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { toPlayVideo } from "@/lib/videos";

export const metadata = { title: "My Videos" };

export default async function MyVideos() {
  const { student } = await requireStudentPage();
  const assignments = await db.assignment.findMany({
    where: { ...assignmentsForStudentWhere(student), OR: [{ videoId: { not: null } }, { collectionId: { not: null } }] },
    include: {
      video: true,
      collection: { include: { videos: { orderBy: { position: "asc" }, include: { video: true } } } },
    },
    orderBy: [{ dueAt: { sort: "asc", nulls: "last" } }, { createdAt: "desc" }],
  });
  const groups = assignments
    .map((a) => ({
      a,
      title: a.collection?.title ?? null,
      videos: (a.video ? [a.video] : (a.collection?.videos.map((cv) => cv.video) ?? [])).filter((v) => v.status === "PUBLISHED"),
    }))
    .filter((g) => g.videos.length > 0);
  const ids = [...new Set(groups.flatMap((g) => g.videos.map((v) => v.id)))];
  const progress = new Map((await db.videoProgress.findMany({ where: { studentId: student.id, videoId: { in: ids } } })).map((p) => [p.videoId, p]));

  return (
    <>
      <h1 className="font-display text-4xl font-semibold">Mis videos</h1>
      <p className="mt-1 text-lg text-ink-2">Watch, listen, then practice out loud.</p>
      {groups.length === 0 && <p className="mt-8 rounded-xl2 border border-dashed border-line p-8 text-center text-ink-2">Your teacher hasn&apos;t shared any videos yet.</p>}
      {groups.map(({ a, title, videos }) => (
        <section key={a.id} className="mt-8">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-[0.16em] text-teal">
            {title ?? "Video"}
            {a.dueAt && <span className="ml-2 normal-case tracking-normal text-muted">· due {a.dueAt.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>}
          </h2>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {videos.map((v, i) => {
              const pv = toPlayVideo(v);
              const p = progress.get(v.id);
              const dur = p?.durationSec ?? v.durationSec;
              const pct = p && dur ? Math.min(100, Math.round((p.watchedSec / dur) * 100)) : 0;
              return (
                <li key={v.id}>
                  <Link href={`/learn/videos/${a.id}/${v.id}`} className="group block overflow-hidden rounded-xl2 border border-line bg-card hover:border-teal">
                    <span className="relative block aspect-video bg-ink">
                      {pv.coverUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={pv.coverUrl} alt="" className="h-full w-full object-cover opacity-90 group-hover:opacity-100" />
                      )}
                      {title && <span className="absolute left-2 top-2 rounded-full bg-paper px-2 py-0.5 text-xs font-bold">{i + 1}</span>}
                      {p?.completed && <span className="absolute right-2 top-2 rounded-full bg-leaf px-2 py-0.5 text-xs font-bold text-white">✓ Visto</span>}
                    </span>
                    <span className="block p-3">
                      <span className="block font-display text-lg font-semibold leading-tight">{v.title}</span>
                      <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-paper-2" aria-label={p ? `Watched ${pct}%` : "Not started"}>
                        <span className="block h-full bg-teal" style={{ width: `${pct}%` }} />
                      </span>
                      <span className="mt-1 block text-xs text-muted">{p?.completed ? "Watched" : p ? "Continue watching" : "Not started"}{v.practiceGameId ? " · Watch & Practice" : ""}</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </>
  );
}
