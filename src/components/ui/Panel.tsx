import type { ReactNode } from "react";

export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-2xl border border-line bg-card p-5 sm:p-6 ${className}`}>{children}</section>;
}

/** Editorial page heading: a short coral rule + small caps eyebrow, then an expressive title. */
export function PageHeader({ title, subtitle, actions, eyebrow }: { title: string; subtitle?: ReactNode; actions?: ReactNode; eyebrow?: string }) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && (
          <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-coral">
            <span aria-hidden="true" className="h-0.5 w-5 rounded-full bg-coral-bright" />
            {eyebrow}
          </p>
        )}
        <h1 className="font-display text-3xl font-bold tracking-tight text-ink sm:text-[2.25rem] sm:leading-tight">{title}</h1>
        {subtitle && <p className="mt-1.5 max-w-2xl text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

const tones = {
  neutral: "bg-paper-2 text-ink-2",
  coral: "bg-coral-soft text-coral-dark",
  teal: "bg-teal-soft text-teal-dark",
  sun: "bg-sun-soft text-sun-ink",
  leaf: "bg-leaf-soft text-leaf",
  sky: "bg-sky-soft text-sky",
};

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: keyof typeof tones }) {
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${tones[tone]}`}>{children}</span>;
}

export function EmptyState({ title, body, action }: { title: string; body?: ReactNode; action?: ReactNode }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-line-strong/60 bg-card/50 px-6 py-10 text-center">
      <svg viewBox="0 0 64 40" className="mx-auto mb-3 h-10 w-16" aria-hidden="true">
        <path d="M6 6h40a4 4 0 0 1 4 4v14a4 4 0 0 1-4 4H24l-8 7v-7H6a4 4 0 0 1-4-4V10a4 4 0 0 1 4-4Z" fill="#bee7e5" stroke="#24283b" strokeWidth="2" strokeLinejoin="round" />
        <path d="M14 17c3-3.5 6-3.5 9-1s6 2.5 9-1" fill="none" stroke="#24283b" strokeWidth="2.2" strokeLinecap="round" />
        <circle cx="55" cy="9" r="4" fill="#f3c55d" stroke="#24283b" strokeWidth="1.6" />
      </svg>
      <p className="font-display text-lg font-bold text-ink">{title}</p>
      {body && <p className="mx-auto mt-1 max-w-md text-sm text-muted">{body}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}
