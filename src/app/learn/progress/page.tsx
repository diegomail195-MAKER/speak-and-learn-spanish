import { Icon } from "@/components/ui/Icon";
import { requireStudentPage } from "@/lib/auth/guards";
import { db } from "@/lib/db";

export const metadata = { title: "My Progress" };

export default async function MyProgress() {
  const { student } = await requireStudentPage();
  const records = await db.progressRecord.findMany({
    where: { studentId: student.id },
    include: { question: { include: { item: { include: { game: { include: { category: true } } } } } } },
    orderBy: { lastSeenAt: "desc" },
  });
  const word = (r: (typeof records)[number]) => (r.question.expectedAnswer.startsWith("{{") ? "Mi nombre" : r.question.expectedAnswer);
  const mastered = records.filter((r) => r.status === "INDEPENDENT");
  const practicing = records.filter((r) => r.status !== "INDEPENDENT");
  return (
    <>
      <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">My <span className="tilde-underline">Progress</span></h1>
      {records.length === 0 ? (
        <p className="mt-6 rounded-2xl border-2 border-dashed border-line-strong/60 p-8 text-center text-ink-2">Play an activity and your words will appear here.</p>
      ) : (
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <section className="rounded-2xl border-2 border-ink bg-card p-5 shadow-[5px_5px_0_var(--color-leaf)]">
            <h2 className="flex items-center gap-2 font-display text-2xl font-bold text-leaf"><span className="grid h-8 w-8 place-items-center rounded-full bg-leaf text-white"><Icon name="star" size={18} /></span>¡Ya lo sé! <span className="text-base text-muted">({mastered.length})</span></h2>
            <ul className="mt-3 flex flex-wrap gap-2">
              {mastered.map((r) => <li key={r.id} className="rounded-lg border-[1.5px] border-leaf/40 bg-leaf-soft px-3 py-1 text-lg font-bold text-leaf">{word(r)}</li>)}
            </ul>
          </section>
          <section className="rounded-2xl border-2 border-ink bg-card p-5 shadow-[5px_5px_0_var(--color-sun)]">
            <h2 className="flex items-center gap-2 font-display text-2xl font-bold text-sun-ink"><span className="grid h-8 w-8 place-items-center rounded-full bg-sun text-ink"><Icon name="retry" size={18} /></span>Estoy practicando <span className="text-base text-muted">({practicing.length})</span></h2>
            <ul className="mt-3 flex flex-wrap gap-2">
              {practicing.map((r) => <li key={r.id} className="rounded-lg border-[1.5px] border-sun-ink/30 bg-sun-soft px-3 py-1 text-lg font-bold text-sun-ink">{word(r)}</li>)}
            </ul>
          </section>
        </div>
      )}
    </>
  );
}
