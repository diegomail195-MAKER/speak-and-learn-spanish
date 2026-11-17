import Link from "next/link";
import { notFound } from "next/navigation";
import { TopicHero } from "@/components/library/TopicHero";
import { ButtonLink } from "@/components/ui/Button";
import { requireTeacherPage } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { publishedWhere } from "@/lib/library/service";
import { buildHero, heroShapes } from "@/lib/library/topicHero";
import { GRADES, GRADE_LABEL, type Grade, type Kind } from "@/lib/library/types";

export default async function TopicPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ grade?: string }> }) {
  await requireTeacherPage();
  const { slug } = await params;
  const sp = await searchParams;
  const grade = (GRADES as readonly string[]).includes(sp.grade ?? "") ? (sp.grade as Grade) : null;
  const topic = await db.topic.findFirst({
    where: { slug, status: "PUBLISHED" },
    include: {
      resources: {
        where: { resource: { ...publishedWhere, ...(grade ? { grades: { has: grade } } : {}) } },
        orderBy: { position: "asc" },
        include: { resource: { select: { id: true, kind: true, title: true, currentVersion: { select: { title: true, content: true } } } } },
      },
    },
  });
  if (!topic) notFound();
  const data = buildHero(
    topic.resources.map(({ resource: r }) => ({
      id: r.id,
      kind: r.kind as Kind,
      title: r.currentVersion?.title || r.title,
      content: r.currentVersion?.content,
      href: `/teacher/library/resources/${r.id}`,
    })),
  );
  return (
    <TopicHero
      title={topic.titleEs}
      subtitle={[topic.titleEn, grade ? GRADE_LABEL[grade].label : ""].filter(Boolean).join(" · ")}
      art={topic.art}
      shapes={heroShapes(topic)}
      data={data}
      toolbar={
        <>
          <Link href={`/teacher/library${grade ? `?grade=${grade}` : ""}`} className="text-sm font-bold text-sky hover:underline">‹ Library</Link>
          <ButtonLink href={`/teacher/tasks/assign?topicId=${topic.id}${grade ? `&grade=${grade}` : ""}`} size="sm">Assign this topic</ButtonLink>
        </>
      }
    />
  );
}
