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
      <h1 className="font-display text-4xl font-semibold">My Progress</h1>
      {records.length === 0 ? (
        <p className="mt-6 rounded-xl2 border border-dashed border-line p-8 text-center text-ink-2">Play an activity and your words will appear here.</p>
      ) : (
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <section className="rounded-xl2 border border-line bg-card p-5">
            <h2 className="font-display text-xl font-semibold text-leaf">¡Ya lo sé! <span className="text-base text-muted">({mastered.length})</span></h2>
            <ul className="mt-3 flex flex-wrap gap-2">
              {mastered.map((r) => <li key={r.id} className="rounded-full bg-leaf-soft px-3 py-1 font-bold text-leaf">{word(r)}</li>)}
            </ul>
          </section>
          <section className="rounded-xl2 border border-line bg-card p-5">
            <h2 className="font-display text-xl font-semibold text-[#8a5a00]">Estoy practicando <span className="text-base text-muted">({practicing.length})</span></h2>
            <ul className="mt-3 flex flex-wrap gap-2">
              {practicing.map((r) => <li key={r.id} className="rounded-full bg-sun-soft px-3 py-1 font-bold text-[#7a5200]">{word(r)}</li>)}
            </ul>
          </section>
        </div>
      )}
    </>
  );
}
