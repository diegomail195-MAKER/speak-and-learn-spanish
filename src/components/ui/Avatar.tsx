// Simple geometric avatars students pick instead of photos.
export const AVATARS = ["sun", "leaf", "wave", "star", "moon", "drop"] as const;
export type AvatarKey = (typeof AVATARS)[number];

const colors: Record<string, string> = { sun: "#f2b33d", leaf: "#2b8f55", wave: "#3a74c9", star: "#e4553c", moon: "#6a5acd", drop: "#12827a" };

export function Avatar({ name, kind, size = 48 }: { name: string; kind: string; size?: number }) {
  const c = colors[kind] ?? colors.sun;
  return (
    <span
      aria-hidden="true"
      className="inline-grid shrink-0 place-items-center rounded-full font-display font-semibold text-white"
      style={{ width: size, height: size, background: c, fontSize: size * 0.42 }}
    >
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}
