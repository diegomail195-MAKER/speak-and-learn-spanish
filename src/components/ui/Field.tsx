import type { ComponentProps, ReactNode } from "react";

export const inputClass =
  "w-full rounded-xl border border-line bg-card px-3.5 py-2.5 text-[0.98rem] text-ink placeholder:text-muted/70 focus:border-sky focus:outline-none focus:ring-3 focus:ring-sky/20";

export function Label({ children, htmlFor, hint }: { children: ReactNode; htmlFor?: string; hint?: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-bold text-ink-2">
      {children}
      {hint && <span className="ml-2 font-normal text-muted">{hint}</span>}
    </label>
  );
}

export function Input(props: ComponentProps<"input">) {
  return <input {...props} className={`${inputClass} ${props.className ?? ""}`} />;
}

export function Select(props: ComponentProps<"select">) {
  return <select {...props} className={`${inputClass} pr-8 ${props.className ?? ""}`} />;
}

export function FormError({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-xl bg-coral-soft px-3.5 py-2.5 text-sm font-semibold text-coral-dark">
      {message}
    </p>
  );
}
