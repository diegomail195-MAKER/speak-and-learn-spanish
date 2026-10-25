import "server-only";
import { db } from "@/lib/db";

export async function videoFormOptions(schoolId: string) {
  const [categories, games] = await Promise.all([
    db.category.findMany({ where: { schoolId }, orderBy: { sortOrder: "asc" }, select: { id: true, nameEn: true, nameEs: true } }),
    db.game.findMany({ where: { schoolId, status: "PUBLISHED" }, orderBy: { updatedAt: "desc" }, select: { id: true, title: true } }),
  ]);
  return { categories, games };
}
