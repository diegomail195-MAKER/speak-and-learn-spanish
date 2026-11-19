import "server-only";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

// Topic lists for Platform Admin (Overview and Topics): every status, with the number of
// resources in use (archived resources are not counted).

export type AdminTopicFilter = { q?: string; status?: string; language?: string; gradeId?: string; category?: string };

const STATUSES = ["PUBLISHED", "DRAFT", "ARCHIVED"] as const;

export function topicWhere(f: AdminTopicFilter): Prisma.TopicWhereInput {
  const q = f.q?.trim();
  return {
    ...(STATUSES.includes(f.status as (typeof STATUSES)[number]) ? { status: f.status as (typeof STATUSES)[number] } : {}),
    ...(f.language ? { language: f.language } : {}),
    ...(f.gradeId ? { gradeId: f.gradeId } : {}),
    ...(f.category ? { category: f.category } : {}),
    ...(q
      ? { OR: [{ titleEs: { contains: q, mode: "insensitive" } }, { titleEn: { contains: q, mode: "insensitive" } }, { category: { contains: q, mode: "insensitive" } }] }
      : {}),
  };
}

export async function adminTopics(f: AdminTopicFilter, opts: { take?: number; skip?: number } = {}) {
  const where = topicWhere(f);
  const [rows, total] = await Promise.all([
    db.topic.findMany({
      where,
      orderBy: [{ updatedAt: "desc" }],
      take: opts.take,
      skip: opts.skip,
      include: {
        grade: { select: { name: true } },
        resources: { where: { resource: { status: { not: "ARCHIVED" } } }, select: { resource: { select: { kind: true, status: true } } } },
        _count: { select: { assignments: true } },
      },
    }),
    db.topic.count({ where }),
  ]);
  return { rows, total };
}

/** Draft topics that already have resources: ready for an administrator to review and publish. */
export async function topicsReadyToPublish(take = 3) {
  return db.topic.findMany({
    where: { status: "DRAFT", resources: { some: { resource: { status: { not: "ARCHIVED" } } } } },
    orderBy: { updatedAt: "desc" },
    take,
    include: { resources: { where: { resource: { status: { not: "ARCHIVED" } } }, select: { resourceId: true } } },
  });
}
