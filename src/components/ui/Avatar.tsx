// Simple geometric avatars students pick instead of photos.
export const AVATARS = ["sun", "leaf", "wave", "star", "moon", "drop"] as const;
export type AvatarKey = (typeof AVATARS)[number];

// Brand palette; each pair keeps the initial readable (AA) on its fill.
const colors: Record<string, [string, string]> = {
  sun: ["#f3c55d", "#24283b"],
  leaf: ["#2e7550", "#ffffff"],
  wave: ["#303477", "#ffffff"],
  star: ["#c4452c", "#ffffff"],
  moon: ["#bee7e5", "#165e5a"],
  drop: ["#1d6f6b", "#ffffff"],
};

export function Avatar({ name, kind, size = 48 }: { name: string; kind: string; size?: number }) {
  const [bg, fg] = colors[kind] ?? colors.sun;
  return (
    <span
      aria-hidden="true"
      className="inline-grid shrink-0 place-items-center rounded-full border-2 border-ink font-display font-bold"
      style={{ width: size, height: size, background: bg, color: fg, fontSize: size * 0.42 }}
    >
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}
