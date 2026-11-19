import type { ComponentProps, ReactNode } from "react";

/**
 * Text fields and selects: 44px tall (grow for long content), 1px border, 10px corners, 16px text
 * (also keeps iOS from zooming in). Focus = blue border + one soft 2px halo; the global outline is
 * turned off here so the two never stack into a thick frame.
 */
export const inputClass =
  "w-full min-w-0 min-h-control rounded-ctl border border-line bg-card px-3.5 py-2 text-base leading-snug text-ink placeholder:text-muted hover:border-line-strong focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25 disabled:cursor-not-allowed disabled:bg-paper-2 disabled:text-muted aria-[invalid=true]:border-coral";

export function Label({ children, htmlFor, hint }: { children: ReactNode; htmlFor?: string; hint?: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-2 block text-left text-sm font-bold text-ink-2">
      {children}
      {hint && <span className="ml-2 font-normal text-muted">{hint}</span>}
    </label>
  );
}

export function Input(props: ComponentProps<"input">) {
  return <input {...props} className={`${inputClass} ${props.className ?? ""}`} />;
}

export function Select(props: ComponentProps<"select">) {
  return <select {...props} className={`${inputClass} ${props.className ?? ""}`} />;
}

export function FormError({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-ctl bg-coral-soft px-3.5 py-2.5 text-sm font-semibold text-coral-dark">
      {message}
    </p>
  );
}
