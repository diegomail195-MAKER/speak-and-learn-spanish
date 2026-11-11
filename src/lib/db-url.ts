// Supabase's transaction pooler (port 6543) does not support prepared statements, so Prisma
// needs `pgbouncer=true` there; without it queries fail with "prepared statement already exists".
// This adds the flag (and a connection limit suited to serverless) when the URL forgot them.
export function poolerSafeUrl(url: string | undefined): string | undefined {
  if (!url) return url;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return url;
  }
  if (parsed.port !== "6543") return url;
  if (!parsed.searchParams.has("pgbouncer")) parsed.searchParams.set("pgbouncer", "true");
  if (!parsed.searchParams.has("connection_limit")) parsed.searchParams.set("connection_limit", "1");
  return parsed.toString();
}
