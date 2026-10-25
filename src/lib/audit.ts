import "server-only";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

export async function audit(schoolId: string, actorId: string | null, action: string, entityType: string, entityId?: string | null, meta: Prisma.InputJsonValue = {}) {
  await db.auditLog.create({ data: { schoolId, actorId, action, entityType, entityId: entityId ?? null, meta } });
}
