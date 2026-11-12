// Platform administrators (the platform owner). Only they can upload, edit or delete videos.
// Set ADMIN_EMAILS in the environment (comma separated). Users with role ADMIN also count.

export function adminEmails(raw = process.env.ADMIN_EMAILS ?? ""): string[] {
  return raw
    .split(/[,;\s]+/)
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isPlatformAdmin(user: { role: string; email: string | null } | null | undefined, raw?: string): boolean {
  if (!user) return false;
  if (user.role === "ADMIN") return true;
  return !!user.email && adminEmails(raw).includes(user.email.toLowerCase());
}
