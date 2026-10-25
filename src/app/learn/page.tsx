import Link from "next/link";
import { assignmentsForStudentWhere } from "@/lib/access";
import { requireStudentPage } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { templateByKey } from "@/lib/games/templates";

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
      <h1 className="font-display text-4xl font-semibold">¡Hola, {student.firstName}!</h1>
      <p className="mt-1 text-lg text-ink-2">{todo.length ? "Here is what to do today." : "You're all caught up."}</p>

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-[0.16em] text-teal">My Activities</h2>
        {todo.length === 0 ? (
          <p className="rounded-xl2 border border-dashed border-line p-8 text-center text-ink-2">No new activities.</p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {todo.map(({ a, state }) => (
              <li key={a.id}>
                <Link href={`/play/${a.id}`} className="group flex items-center gap-4 rounded-xl2 border border-line bg-card p-4 hover:border-teal">
                  <span className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-2xl bg-sun-soft">
                    {a.game?.items[0]?.imageAssetId ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={`/api/media/${a.game.items[0].imageAssetId}`} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span className="font-display text-3xl text-[#8a5a00]">¡!</span>
                    )}
                  </span>
                  <span className="flex-1">
                    <span className="block font-display text-xl font-semibold">{a.game?.title}</span>
                    <span className="text-sm text-muted">
                      {templateByKey(a.game?.templateKey ?? "")?.nameEs} · {a.game?._count.items} preguntas
                      {a.dueAt && ` · due ${a.dueAt.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`}
                    </span>
                  </span>
                  <span className="rounded-full bg-teal px-4 py-2 font-bold text-white group-hover:bg-teal-dark">{state === "continue" ? "Continue" : "Start"}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {finished.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-[0.16em] text-muted">Done</h2>
          <ul className="divide-y divide-line rounded-xl2 border border-line bg-card">
            {finished.map(({ a, outOfTries }) => (
              <li key={a.id} className="flex items-center gap-3 px-4 py-3">
                <span className="text-leaf">✓</span>
                <span className="flex-1 font-bold">{a.game?.title}</span>
                {!outOfTries && <Link href={`/play/${a.id}`} className="rounded-full px-3 py-1.5 text-sm font-bold text-teal-dark hover:bg-teal-soft">Practice again</Link>}
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
