import Link from "next/link";
import { assignmentsForStudentWhere } from "@/lib/access";
import { requireStudentPage } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { templateByKey } from "@/lib/games/templates";
import { Icon } from "@/components/ui/Icon";

export const metadata = { title: "My Activities" };

export default async function MyActivities() {
  const { student } = await requireStudentPage();
  const assignments = await db.assignment.findMany({
    where: { ...assignmentsForStudentWhere(student), gameId: { not: null } },
    include: {
      game: { include: { _count: { select: { items: true } }, items: { take: 1, orderBy: { position: "asc" }, select: { imageAssetId: true } } } },
      attempts: { where: { studentId: student.id }, orderBy: { startedAt: "desc" } },
    },
    orderBy: [{ dueAt: { sort: "asc", nulls: "last" } }, { createdAt: "desc" }],
  });
  const withState = assignments.map((a) => {
    const done = a.attempts.filter((t) => t.completedAt).length;
    const open = a.attempts.find((t) => !t.completedAt);
    const outOfTries = !!a.maxAttempts && done >= a.maxAttempts && !open;
    return { a, done, open, outOfTries, state: open ? "continue" : done ? "done" : "new" };
  });
  const todo = withState.filter((x) => x.state !== "done");
  const finished = withState.filter((x) => x.state === "done");

  return (
    <>
      <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">¡Hola, <span className="tilde-underline">{student.firstName}</span>!</h1>
      <p className="mt-1 text-lg text-ink-2">{todo.length ? "Here is what to do today." : "You're all caught up."}</p>

      <section className="mt-8">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.16em] text-indigo"><span aria-hidden="true" className="h-0.5 w-5 rounded-full bg-coral-bright" />My Activities</h2>
        {todo.length === 0 ? (
          <p className="rounded-2xl border-2 border-dashed border-line-strong/60 p-8 text-center text-ink-2">No new activities.</p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {todo.map(({ a, state }, i) => (
              <li key={a.id}>
                <Link href={`/play/${a.id}`} className="press group flex items-center gap-4 rounded-2xl border-2 border-ink bg-card p-3.5 shadow-[4px_4px_0_var(--color-ink)] hover:-translate-y-0.5 hover:shadow-[5px_6px_0_var(--color-ink)]">
                  <span className={`grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-xl border-[1.5px] border-ink/15 ${["bg-sun-soft", "bg-teal-soft", "bg-coral-soft", "bg-indigo-soft"][i % 4]}`}>
                    {a.game?.items[0]?.imageAssetId ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={`/api/media/${a.game.items[0].imageAssetId}`} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span className="font-display text-3xl font-bold text-ink">¡!</span>
                    )}
                  </span>
                  <span className="flex-1">
                    <span className="block font-display text-xl font-bold leading-tight">{a.game?.title}</span>
                    <span className="text-sm text-muted">
                      {templateByKey(a.game?.templateKey ?? "")?.nameEs} · {a.game?._count.items} preguntas
                      {a.dueAt && ` · due ${a.dueAt.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`}
                    </span>
                  </span>
                  <span className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-indigo px-4 font-bold text-white group-hover:bg-indigo-dark">{state === "continue" ? "Continue" : "Start"}<Icon name="next" size={18} /></span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {finished.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-[0.16em] text-muted">Done</h2>
          <ul className="divide-y divide-line rounded-2xl border border-line bg-card">
            {finished.map(({ a, outOfTries }) => (
              <li key={a.id} className="flex items-center gap-3 px-4 py-3">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-leaf text-white"><Icon name="check" size={16} strokeWidth={3} /><span className="sr-only">Done</span></span>
                <span className="flex-1 font-bold">{a.game?.title}</span>
                {!outOfTries && <Link href={`/play/${a.id}`} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg px-3 text-sm font-bold text-indigo hover:bg-indigo-soft"><Icon name="retry" size={16} />Practice again</Link>}
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
