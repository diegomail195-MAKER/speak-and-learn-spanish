import "server-only";
import { createHash, randomUUID } from "node:crypto";
import type { MediaKind } from "@prisma/client";
import { db } from "@/lib/db";
import { storage } from "@/lib/storage";
import { extFor } from "./validate";

/** Stores bytes privately and records a reusable MediaAsset (deduplicated per school). */
export async function saveMedia(opts: { schoolId: string; ownerUserId: string | null; kind: MediaKind; data: Buffer; mimeType: string; originalName: string }) {
  const sha256 = createHash("sha256").update(opts.data).digest("hex");
  const existing = await db.mediaAsset.findFirst({ where: { schoolId: opts.schoolId, sha256, kind: opts.kind } });
  if (existing) return existing;
  const key = `${opts.schoolId}/${opts.kind.toLowerCase()}/${randomUUID()}.${extFor[opts.mimeType] ?? "bin"}`;
  await storage().put(key, opts.data, opts.mimeType);
  return db.mediaAsset.create({
    data: {
      schoolId: opts.schoolId,
      ownerUserId: opts.ownerUserId,
      kind: opts.kind,
      storageKey: key,
      mimeType: opts.mimeType,
      sizeBytes: opts.data.length,
      originalName: opts.originalName.slice(0, 200),
      sha256,
    },
  });
}

export const mediaUrl = (id: string) => `/api/media/${id}`;
