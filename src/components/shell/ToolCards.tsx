import type { PlatformTool } from "@/lib/tools";

export function ToolCards({ tools }: { tools: PlatformTool[] }) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {tools.map((t) => (
        <li key={t.key}>
          <a
            href={t.url}
            target="_blank"
            rel="noopener"
            className="group flex h-full flex-col rounded-2xl border border-line bg-card p-5 transition-colors hover:border-ink"
          >
            <span className="text-xs font-bold uppercase tracking-[0.15em] text-teal">{t.tagline}</span>
            <span className="mt-1 font-display text-xl font-semibold text-ink">{t.name}</span>
            <span className="mt-2 flex-1 leading-relaxed text-muted">{t.description}</span>
            <span className="mt-4 text-sm font-bold text-coral group-hover:underline">Open {t.name} ↗</span>
          </a>
        </li>
      ))}
    </ul>
  );
}
