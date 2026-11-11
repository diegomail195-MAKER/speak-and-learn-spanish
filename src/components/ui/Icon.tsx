import type { SVGProps } from "react";

/**
 * Small line icons with the brand's stroke: 2px, round ends, slightly soft corners — drawn to sit
 * next to words (never as decoration on their own). Replaces emoji in controls so they render the
 * same on every Chromebook, iPad and phone.
 */
const PATHS = {
  mic: "M12 15a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v6a3 3 0 0 0 3 3Zm6-3a6 6 0 0 1-12 0m6 6v3",
  speaker: "M4 10v4h3.5L12 18V6L7.5 10H4Zm11.5-1.5a5 5 0 0 1 0 7m2.5-9.5a8.5 8.5 0 0 1 0 12",
  hint: "M9 18h6m-5 3h4M12 3a6 6 0 0 0-3.6 10.8c.6.5 1 1.2 1.1 2.2h5c.1-1 .5-1.7 1.1-2.2A6 6 0 0 0 12 3Z",
  check: "M5 12.5 10 17.5 19 7",
  retry: "M4.5 12a7.5 7.5 0 1 0 2.2-5.3M4.5 4v4.5H9",
  ear: "M8 9a4.5 4.5 0 1 1 8.4 2.3c-.8 1.3-2.4 2-2.4 4.2a3 3 0 0 1-5.4 1.8M10.5 9.5a1.8 1.8 0 0 1 3.4.8",
  next: "M5 12h13m-5-5 5 5-5 5",
  stop: "M7 7h10v10H7z",
  star: "m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8L3.5 9.7l5.9-.9L12 3.5Z",
  close: "M6 6l12 12M18 6 6 18",
  expand: "M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5",
  play: "M8 5.5v13l10.5-6.5L8 5.5Z",
  book: "M4 5.5C6.5 4.5 9.5 4.5 12 6c2.5-1.5 5.5-1.5 8-.5V19c-2.5-1-5.5-1-8 .5-2.5-1.5-5.5-1.5-8-.5V5.5Zm8 .5v13.5",
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 20, className = "", ...rest }: { name: IconName; size?: number } & SVGProps<SVGSVGElement>) {
  const filled = name === "star" || name === "play" || name === "stop";
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
      className={`shrink-0 ${className}`}
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={filled ? 1.5 : 2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...rest}
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
