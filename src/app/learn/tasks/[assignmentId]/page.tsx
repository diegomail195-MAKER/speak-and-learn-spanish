import Link from "next/link";
import { notFound } from "next/navigation";
import { TopicHero } from "@/components/library/TopicHero";
import { assignmentsForStudentWhere } from "@/lib/access";
import { requireStudentPage } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { buildHero, heroShapes } from "@/lib/library/topicHero";
import type { Kind } from "@/lib/library/types";

export const metadata = { title: "My Task" };

export default async function StudentTask({ params }: { params: Promise<{ assignmentId: string }> }) {
  const { student } = await requireStudentPage();
  const { assignmentId } = await params;
  const t = await db.assignment.findFirst({
    where: { id: assignmentId, topicId: { not: null }, ...assignmentsForStudentWhere(student) },
    include: { topic: true, activities: { orderBy: { position: "asc" }, include: { resource: { select: { kind: true } }, version: { select: { title: true, content: true } }, progress: { where: { studentId: student.id, completedAt: { not: null } }, select: { id: true }, take: 1 } } } },
  });
  if (!t) notFound();
  const data = buildHero(
    t.activities.map((a) => ({
      id: a.id,
      kind: a.resource.kind as Kind,
      title: a.version.title,
      content: a.version.content,
      href: `/learn/tasks/${t.id}/${a.id}`,
      done: a.progress.length > 0,
      activityId: a.id,
    })),
  );
  return (
    <>
      <TopicHero
        title={t.topic?.titleEs ?? t.title}
        subtitle={t.topic?.titleEn}
        art={t.topic?.art ?? ""}
        shapes={heroShapes({ slug: t.topic?.slug ?? "", art: t.topic?.art ?? "" })}
        data={data}
        assignmentId={t.id}
        toolbar={<Link href="/learn" className="font-bold text-sky hover:underline">‹ My Activities</Link>}
      />
      {t.instructions && <p className="mt-5 rounded-[22px] bg-card p-4 font-bold">{t.instructions}</p>}
    </>
  );
}
