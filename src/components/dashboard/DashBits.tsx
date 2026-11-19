/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import type { ReactNode } from "react";
import { WsIcon, type WsIconName } from "@/components/shell/WsIcons";
import { Art } from "@/components/ui/Art";
import { KIND_ACCESS_LABEL, KIND_ICON_3D, KIND_ORDER } from "@/lib/library/kindIcons";
import { TOPIC_STATUS_LABEL } from "@/lib/library/topicMeta";
import { displayKind } from "@/lib/library/types";

// Small building blocks shared by the Platform Admin and Teacher dashboards.

/** A KPI card: icon, value and label; the whole card opens the matching list. */
export function StatCard({ href, icon, value, label, tone = "blue", testId }: { href: string; icon: WsIconName; value: number | string; label: string; tone?: "blue" | "purple" | "teal"; testId?: string }) {
  const toneCls = tone === "purple" ? "bg-[#F3E8FF] text-[#7E22CE]" : tone === "teal" ? "bg-[#E6F6F4] text-[#0F766E]" : "bg-[#E8EFFF] text-[#2563EB]";
  return (
    <Link href={href} className="ws-card group flex min-h-[104px] items-center gap-4 p-4 transition-colors hover:border-[#2563EB] sm:p-5" data-testid={testId ?? "stat-card"}>
      <span className={`grid h-14 w-14 shrink-0 place-items-center rounded-xl ${toneCls}`}>
        <WsIcon name={icon} className="h-7 w-7" />
      </span>
      <span className="min-w-0">
        <span className="block font-display text-3xl font-extrabold leading-none text-[#172033]" data-testid="stat-value">{value}</span>
        <span className="mt-1 block text-[17px] text-[#3D4759] group-hover:text-[#1D4ED8]">{label}</span>
      </span>
    </Link>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="ws-card flex min-h-[104px] items-center gap-4 p-5" aria-hidden>
      <span className="ws-skeleton h-14 w-14" />
      <span className="flex-1 space-y-2"><span className="ws-skeleton block h-7 w-16" /><span className="ws-skeleton block h-4 w-28" /></span>
    </div>
  );
}

export function StatusPill({ status }: { status: string }) {
  const cls = status === "PUBLISHED" ? "ws-pill-published" : status === "DRAFT" ? "ws-pill-draft" : status === "ARCHIVED" ? "ws-pill-archived" : "ws-pill-active";
  return <span className={`ws-pill ${cls}`} data-testid="status-pill">{TOPIC_STATUS_LABEL[status] ?? status}</span>;
}

export function TopicThumb({ topic, size = "md" }: { topic: { art: string; color: string }; size?: "sm" | "md" | "lg" }) {
  const box = size === "sm" ? "h-14 w-[72px]" : size === "lg" ? "h-[104px] w-[150px]" : "h-[72px] w-[104px]";
  return (
    <span className={`grid ${box} shrink-0 place-items-center overflow-hidden rounded-xl`} style={{ background: `color-mix(in srgb, ${topic.color} 22%, white)` }} aria-hidden>
      <Art k={topic.art} className="h-[84%] w-[84%]" />
    </span>
  );
}

/** One of the LextroSpeak 3D category icons. */
export function Kind3D({ kind, className = "h-8 w-8" }: { kind: string; className?: string }) {
  const k = displayKind(kind);
  return KIND_ICON_3D[k] ? <img src={KIND_ICON_3D[k]} alt="" width={64} height={64} className={`${className} object-contain`} /> : <span className={`${className} grid place-items-center rounded-lg bg-[#EEF1F5]`} aria-hidden>•</span>;
}

/** Kinds in the fixed category order, without duplicates. */
export function orderedKinds(kinds: string[]) {
  const set = [...new Set(kinds.map(displayKind))];
  const rank = (k: string) => (KIND_ORDER.includes(k) ? KIND_ORDER.indexOf(k) : 99);
  return set.sort((a, b) => rank(a) - rank(b));
}

export function kindLabel(kind: string) {
  return KIND_ACCESS_LABEL[displayKind(kind)] ?? kind;
}

export function Progress({ done, total, label }: { done: number; total: number; label?: string }) {
  const pct = total ? Math.round((done / total) * 100) : 0;
  return (
    <div>
      <p className="text-[15px] text-[#3D4759]">{label ?? `${done}/${total} completed`}</p>
      <div className="ws-progress mt-2" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={done} aria-label={label ?? `${done} of ${total} completed`}>
        <span style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function Card({ title, action, children, className = "", testId }: { title?: ReactNode; action?: ReactNode; children: ReactNode; className?: string; testId?: string }) {
  return (
    <section className={`ws-card p-4 sm:p-6 ${className}`} data-testid={testId}>
      {(title || action) && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          {title && <h2 className="ws-h2">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Empty({ title, body, action }: { title: string; body?: ReactNode; action?: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-[#C9D0DB] px-5 py-8 text-center" data-testid="empty-state">
      <p className="font-bold text-[#172033]">{title}</p>
      {body && <p className="mx-auto mt-1 max-w-md text-[15px] text-[#5B6577]">{body}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

export function PageTitle({ title, subtitle, action }: { title: string; subtitle?: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="ws-h1">{title}</h1>
        {subtitle && <p className="mt-1.5 text-lg text-[#3D4759]">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
