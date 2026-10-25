import type { ReactNode } from "react";
import { PublicHeader } from "@/components/shell/PublicHeader";

export function AuthLayout({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <div className="min-h-dvh">
      <PublicHeader />
      <main className="mx-auto max-w-md px-5 pb-16 pt-6">
        <h1 className="font-display text-3xl font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1.5 text-muted">{subtitle}</p>}
        <div className="mt-6 rounded-xl2 border border-line bg-card p-6">{children}</div>
      </main>
    </div>
  );
}
