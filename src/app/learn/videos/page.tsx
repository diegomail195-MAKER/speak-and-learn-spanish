import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
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
      <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">Mis <span className="tilde-underline">videos</span></h1>
      <p className="mt-1 text-lg text-ink-2">Watch, listen, then practice out loud.</p>
      {groups.length === 0 && <p className="mt-8 rounded-2xl border-2 border-dashed border-line-strong/60 p-8 text-center text-ink-2">Your teacher hasn&apos;t shared any videos yet.</p>}
      {groups.map(({ a, title, videos }) => (
        <section key={a.id} className="mt-8">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.16em] text-indigo"><span aria-hidden="true" className="h-0.5 w-5 rounded-full bg-coral-bright" />
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
                  <Link href={`/learn/videos/${a.id}/${v.id}`} className="press group block overflow-hidden rounded-2xl border-2 border-ink bg-card shadow-[4px_4px_0_var(--color-ink)] hover:-translate-y-0.5 hover:shadow-[5px_6px_0_var(--color-ink)]">
                    <span className="relative block aspect-video border-b-2 border-ink bg-indigo">
                      {!pv.coverUrl && <span className="absolute inset-0 grid place-items-center text-white/80" aria-hidden="true"><Icon name="play" size={40} /></span>}
                      {pv.coverUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={pv.coverUrl} alt="" className="h-full w-full object-cover opacity-90 group-hover:opacity-100" />
                      )}
                      {title && <span className="absolute left-2 top-2 grid h-7 min-w-7 place-items-center rounded-full border-[1.5px] border-ink bg-sun px-1.5 text-xs font-bold text-ink">{i + 1}</span>}
                      {p?.completed && <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full border-[1.5px] border-white bg-leaf px-2 py-0.5 text-xs font-bold text-white"><Icon name="check" size={12} strokeWidth={3.5} /> Visto</span>}
                    </span>
                    <span className="block p-3">
                      <span className="block font-display text-lg font-bold leading-tight">{v.title}</span>
                      <span className="mt-2 block h-2 overflow-hidden rounded-full border border-line-strong/50 bg-paper-2" aria-label={p ? `Watched ${pct}%` : "Not started"}>
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
