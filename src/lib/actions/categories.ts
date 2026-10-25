"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { requireTeacher } from "@/lib/auth/guards";
import { db } from "@/lib/db";

const names = z.object({ nameEn: z.string().trim().min(1).max(60), nameEs: z.string().trim().min(1).max(60), parentId: z.string().optional() });

export async function createCategory(form: FormData) {
  const { user } = await requireTeacher();
  const d = names.parse(Object.fromEntries(form));
  const parentId = d.parentId ? (await db.category.findFirstOrThrow({ where: { id: d.parentId, schoolId: user.schoolId } })).id : null;
  const count = await db.category.count({ where: { schoolId: user.schoolId, parentId } });
  const c = await db.category.create({ data: { schoolId: user.schoolId, nameEn: d.nameEn, nameEs: d.nameEs, parentId, sortOrder: count } });
  await audit(user.schoolId, user.id, "category.create", "Category", c.id);
  revalidatePath("/teacher/categories");
}

export async function updateCategory(form: FormData) {
  const { user } = await requireTeacher();
  const id = String(form.get("id"));
  const d = names.parse(Object.fromEntries(form));
  await db.category.updateMany({ where: { id, schoolId: user.schoolId }, data: { nameEn: d.nameEn, nameEs: d.nameEs } });
  await audit(user.schoolId, user.id, "category.update", "Category", id);
  revalidatePath("/teacher/categories");
}

export async function deleteCategory(form: FormData) {
  const { user } = await requireTeacher();
  const id = String(form.get("id"));
  if (form.get("confirm") !== "yes") throw new Error("Confirmation required");
  // Games keep existing; their category is cleared (onDelete: SetNull).
  await db.category.deleteMany({ where: { id, schoolId: user.schoolId } });
  await audit(user.schoolId, user.id, "category.delete", "Category", id);
  revalidatePath("/teacher/categories");
}
