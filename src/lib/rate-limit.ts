import "server-only";
import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { db } from "@/lib/db";

// Rate limits shared by every server instance (a single atomic upsert in Postgres), so they hold
// on Vercel where each request may land on a different instance. Keys are hashed: no raw email
// addresses or IP addresses are written to the database.
// If the database is unreachable the check falls back to a per-instance memory counter, so a
// database hiccup never blocks a child in the middle of an activity.

const memory = new Map<string, { count: number; resetAt: number }>();

function memoryLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = memory.get(key);
  if (!entry || entry.resetAt < now) {
    memory.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  entry.count++;
  return entry.count <= max;
}

const hashKey = (key: string) => createHash("sha256").update(`sls-rl:${key}`).digest("hex");

/** Counts one hit for `key`; returns false once more than `max` hits happened inside the window. */
export async function rateLimit(key: string, max: number, windowMs: number): Promise<boolean> {
  const id = hashKey(key);
  try {
    const resetAt = new Date(Date.now() + windowMs);
    const rows = await db.$queryRaw<{ count: number }[]>`
      INSERT INTO "RateLimit" ("key", "count", "resetAt") VALUES (${id}, 1, ${resetAt})
      ON CONFLICT ("key") DO UPDATE SET
        "count"   = CASE WHEN "RateLimit"."resetAt" < (NOW() AT TIME ZONE 'UTC') THEN 1 ELSE "RateLimit"."count" + 1 END,
        "resetAt" = CASE WHEN "RateLimit"."resetAt" < (NOW() AT TIME ZONE 'UTC') THEN EXCLUDED."resetAt" ELSE "RateLimit"."resetAt" END
      RETURNING "count"`;
    // Occasionally clear out expired counters so the table stays small.
    if (Math.random() < 0.01) await db.rateLimit.deleteMany({ where: { resetAt: { lt: new Date() } } }).catch(() => undefined);
    return Number(rows[0]?.count ?? 1) <= max;
  } catch (e) {
    console.error("rate limit store unavailable, using memory", (e as Error).message);
    return memoryLimit(id, max, windowMs);
  }
}

/** The caller's IP as reported by the hosting proxy (Vercel sets x-real-ip / x-forwarded-for). */
export async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-real-ip") ?? h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
}
