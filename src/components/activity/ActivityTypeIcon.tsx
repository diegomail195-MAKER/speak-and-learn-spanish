import { activityIconSrc, activityIconSrcSet, activityName } from "@/lib/games/activityTypes";

/**
 * The 3D icon of an activity type (same file everywhere: Create Activity, My Activities,
 * Community, editor header, preview). `size` is the CSS size in px; the browser picks the
 * 80/160/240 px file that fits the screen density. Decorative by default (the name is next to it).
 */
export function ActivityTypeIcon({ templateKey, size = 80, label, className = "" }: { templateKey: string; size?: number; label?: string; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={activityIconSrc(templateKey, 160)}
      srcSet={activityIconSrcSet(templateKey)}
      sizes={`${size}px`}
      width={size}
      height={size}
      alt={label === undefined ? "" : label || activityName(templateKey)}
      aria-hidden={label === undefined || undefined}
      draggable={false}
      decoding="async"
      className={`shrink-0 select-none object-contain ${className}`}
      style={{ width: size, height: size }}
      data-activity-icon={templateKey}
    />
  );
}
