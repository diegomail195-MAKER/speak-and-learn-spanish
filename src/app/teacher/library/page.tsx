import Link from "next/link";
import { KindBadge, TopicCard } from "@/components/library/LibraryBits";
import { PageHeader } from "@/components/ui/Panel";
import { libraryTopics } from "@/lib/library/service";
import { GRADES, GRADE_LABEL, KINDS, KIND_LABEL, type Grade, type Kind } from "@/lib/library/types";

export const metadata = { title: "Library" };

// Library: first by grade, then by topic or by type of resource. Published content only.
export default async function LibraryPage({ searchParams }: { searchParams: Promise<{ grade?: string; type?: string }> }) {
  const sp = await searchParams;
  const grade = (GRADES as readonly string[]).includes(sp.grade ?? "") ? (sp.grade as Grade) : null;
  const type = (KINDS as readonly string[]).includes(sp.type ?? "") ? (sp.type as Kind) : null;
  const topics = grade ? await libraryTopics({ grade }) : [];
  const tab = (active: boolean) => `rounded-full px-4 py-2.5 font-bold ${active ? "bg-ink text-white" : "bg-card text-ink-2 ring-1 ring-line hover:bg-paper-2"}`;

  return (
    <>
      <PageHeader eyebrow="LaxtroSpeak Library" title="Library" subtitle="Choose a grade, then browse by topic or by type of resource. Open any activity to try it, or assign a whole topic to your class." />
      <nav aria-label="Grade" className="mb-6 grid gap-3 sm:grid-cols-2">
        {GRADES.map((g) => (
          <Link key={g} href={`/teacher/library?grade=${g}`} aria-current={grade === g ? "page" : undefined}
            className={`rounded-[22px] p-5 shadow-pop transition ${grade === g ? "bg-ink text-white" : "bg-card hover:-translate-y-0.5"}`}>
            <span className="block font-display text-2xl font-extrabold">{GRADE_LABEL[g].label}</span>
            <span className={grade === g ? "text-white/80" : "text-muted"}>{GRADE_LABEL[g].grades}</span>
          </Link>
        ))}
      </nav>

      {!grade ? (
        <p className="rounded-[22px] border-2 border-dashed border-line p-8 text-center font-bold text-ink-2">Pick a grade to see its topics.</p>
      ) : (
        <>
          <nav aria-label="Browse by" className="mb-5 flex flex-wrap gap-2">
            <Link href={`/teacher/library?grade=${grade}`} className={tab(!type)}>Topics</Link>
            {KINDS.map((k) => (
              <Link key={k} href={`/teacher/library?grade=${grade}&type=${k}`} className={tab(type === k)}>{KIND_LABEL[k].plural}</Link>
            ))}
          </nav>
          {topics.length === 0 && <p className="text-muted">No published content for this grade yet.</p>}
          {!type ? (
            <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {topics.map((t) => (
                <li key={t.id}>
                  <TopicCard href={`/teacher/library/topics/${t.slug}?grade=${grade}`} topic={t} kinds={t.resources.map((r) => r.resource.kind as Kind)} />
                </li>
              ))}
            </ul>
          ) : (
            <div className="space-y-6">
              {topics.filter((t) => t.resources.some((r) => r.resource.kind === type)).map((t) => (
                <section key={t.id}>
                  <h2 className="mb-2 font-display text-xl font-extrabold">{t.titleEs} <span className="text-base font-bold text-muted">· {t.titleEn}</span></h2>
                  <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {t.resources.filter((r) => r.resource.kind === type).map((r) => (
                      <li key={r.resource.id}>
                        <Link href={`/teacher/library/resources/${r.resource.id}`} className="flex items-center justify-between gap-3 rounded-[20px] bg-card p-4 shadow-pop hover:-translate-y-0.5">
                          <span className="font-bold">{r.resource.title}</span>
                          <KindBadge kind={r.resource.kind as Kind} />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </>
      )}
    </>
  );
}
