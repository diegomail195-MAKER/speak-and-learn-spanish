import Link from "next/link";
import { Art, Icon } from "@/components/ui/Art";
import { GRADE_LABEL, KIND_LABEL, type Grade, type Kind } from "@/lib/library/types";

export function KindDot({ kind, size = "h-8 w-8" }: { kind: Kind; size?: string }) {
  const k = KIND_LABEL[kind];
  return (
    <span title={k.label} className={`grid ${size} place-items-center rounded-full text-white`} style={{ background: k.color }}>
      <Icon name={k.icon} className="h-4 w-4" />
      <span className="sr-only">{k.label}</span>
    </span>
  );
}

export function KindBadge({ kind }: { kind: Kind }) {
  const k = KIND_LABEL[kind];
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-extrabold text-ink" style={{ background: `${k.color}33` }}>
      <span className="h-2 w-2 rounded-full" style={{ background: k.color }} /> {k.label}
    </span>
  );
}

export function GradeChips({ grades }: { grades: string[] }) {
  return (
    <span className="inline-flex flex-wrap gap-1">
      {grades.map((g) => (
        <span key={g} className="rounded-full bg-paper-2 px-2 py-0.5 text-xs font-bold text-ink-2">{GRADE_LABEL[g as Grade]?.short ?? g}</span>
      ))}
    </span>
  );
}

/** Colored topic card (the approved LaxtroSpeak design). */
export function TopicCard({ href, topic, kinds, footer }: { href: string; topic: { titleEn: string; titleEs: string; color: string; art: string }; kinds: Kind[]; footer?: React.ReactNode }) {
  return (
    <div className="flex flex-col overflow-hidden rounded-[28px] bg-card shadow-pop">
      <Link href={href} className="group flex flex-1 flex-col items-center gap-2 p-5 text-center" style={{ background: topic.color }}>
        <Art k={topic.art} className="h-24 w-24 transition group-hover:scale-105" />
        <span className="font-display text-2xl font-extrabold leading-none text-ink">{topic.titleEs}</span>
        <span className="font-bold text-ink/75">{topic.titleEn}</span>
      </Link>
      <div className="flex flex-wrap items-center justify-center gap-1.5 px-4 py-3">
        {[...new Set(kinds)].map((k) => <KindDot key={k} kind={k} size="h-7 w-7" />)}
        {kinds.length === 0 && <span className="text-sm text-muted">No activities yet</span>}
      </div>
      {footer && <div className="border-t border-line px-4 py-3">{footer}</div>}
    </div>
  );
}
