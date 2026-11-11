import "server-only";

/**
 * Other classroom tools that live under the Speak & Learn Spanish platform.
 * Each tool keeps its own site; its address comes from an environment variable so it can
 * move (for example to a subdomain like rocket.yourdomain.com) without a code change.
 * A tool without an address is hidden.
 */
export type PlatformTool = { key: string; name: string; tagline: string; description: string; url: string };

const TOOLS: Array<Omit<PlatformTool, "url"> & { env: string }> = [
  {
    key: "roll-call-rocket",
    name: "Roll Call Rocket",
    tagline: "Take attendance, blast off",
    description: "A quick, playful roll call for the start of class.",
    env: "ROLL_CALL_ROCKET_URL",
  },
];

function safeUrl(raw: string | undefined): string | null {
  if (!raw) return null;
  try {
    const u = new URL(raw.trim());
    return u.protocol === "https:" || u.protocol === "http:" ? u.toString() : null;
  } catch {
    return null;
  }
}

export function platformTools(): PlatformTool[] {
  return TOOLS.flatMap(({ env, ...t }) => {
    const url = safeUrl(process.env[env]);
    return url ? [{ ...t, url }] : [];
  });
}
