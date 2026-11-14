import Link from "next/link";
import { notFound } from "next/navigation";
import { GradeChips, KindBadge } from "@/components/library/LibraryBits";
import { Art } from "@/components/ui/Art";
import { ButtonLink } from "@/components/ui/Button";
import { requireTeacherPage } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { publishedWhere } from "@/lib/library/service";
import { GRADES, GRADE_LABEL, KIND_LABEL, type Grade, type Kind } from "@/lib/library/types";

export default async function TopicPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ grade?: string }> }) {
  await requireTeacherPage();
  const { slug } = await params;
  const sp = await searchParams;
  const grade = (GRADES as readonly string[]).includes(sp.grade ?? "") ? (sp.grade as Grade) : null;
  const topic = await db.topic.findFirst({
    where: { slug, status: "PUBLISHED" },
    include: { resources: { where: { resource: { ...publishedWhere, ...(grade ? { grades: { has: grade } } : {}) } }, orderBy: { position: "asc" }, include: { resource: true } } },
  });
  if (!topic) notFound();
  return (
    <>
      <Link href={`/teacher/library${grade ? `?grade=${grade}` : ""}`} className="text-sm font-bold text-sky hover:underline">‹ Library</Link>
      <div className="mb-6 mt-3 flex flex-wrap items-center gap-5 rounded-[28px] p-6 shadow-pop" style={{ background: topic.color }}>
        <Art k={topic.art} className="h-24 w-24" />
        <div className="flex-1">
          <h1 className="font-display text-4xl font-extrabold leading-none">{topic.titleEs}</h1>
          <p className="mt-1 text-lg font-bold text-ink/75">{topic.titleEn} · {topic.category}{grade && ` · ${GRADE_LABEL[grade].label}`}</p>
        </div>
        <ButtonLink href={`/teacher/tasks/assign?topicId=${topic.id}${grade ? `&grade=${grade}` : ""}`}>Assign this topic</ButtonLink>
      </div>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {topic.resources.map(({ resource: r }) => (
          <li key={r.id} className="flex flex-col gap-2 rounded-[22px] bg-card p-5 shadow-pop">
            <KindBadge kind={r.kind as Kind} />
            <span className="font-display text-xl font-extrabold">{r.title}</span>
            {r.description && <span className="text-sm text-ink-2">{r.description}</span>}
            <GradeChips grades={r.grades} />
            <ButtonLink href={`/teacher/library/resources/${r.id}`} variant="secondary" size="sm" className="mt-auto self-start">{KIND_LABEL[r.kind as Kind].verb}</ButtonLink>
          </li>
        ))}
        {topic.resources.length === 0 && <li className="text-muted">No published activities for this grade yet.</li>}
      </ul>
    </>
  );
}
