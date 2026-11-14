import { BillingButtons } from "@/components/teacher/BillingButtons";
import { Badge, PageHeader, Panel } from "@/components/ui/Panel";
import { requireTeacherPage } from "@/lib/auth/guards";
import { billingConfigured, PLAN_NAME } from "@/lib/billing/stripe";
import { db } from "@/lib/db";

export const metadata = { title: "Plan & billing" };

export default async function BillingPage({ searchParams }: { searchParams: Promise<{ checkout?: string }> }) {
  const { user } = await requireTeacherPage();
  const { checkout } = await searchParams;
  const sub = await db.subscription.findFirst({ where: { userId: user.id }, orderBy: { updatedAt: "desc" } });
  const active = sub && ["active", "trialing"].includes(sub.status);
  const testMode = !(process.env.STRIPE_SECRET_KEY ?? "").startsWith("sk_live_");
  return (
    <>
      <PageHeader eyebrow="Account" title="Plan & billing" subtitle={`${PLAN_NAME()} — full access to the LextroSpeak library for your classes.`} />
      {checkout === "success" && <p role="status" className="mb-4 rounded-[18px] bg-leaf-soft px-4 py-3 font-bold text-leaf">Thank you! Your payment is being confirmed. You’ll get an email as soon as it is.</p>}
      {checkout === "cancel" && <p role="status" className="mb-4 rounded-[18px] bg-paper-2 px-4 py-3 font-bold">Checkout canceled. Nothing was charged.</p>}
      <Panel className="max-w-xl space-y-4">
        <p className="flex items-center gap-2 font-bold">
          Status: {sub ? <Badge tone={active ? "leaf" : "sun"}>{sub.status}</Badge> : <Badge>no subscription</Badge>}
          {billingConfigured() && testMode && <Badge tone="sky">test mode</Badge>}
        </p>
        {sub?.currentPeriodEnd && <p className="text-sm text-muted">Current period ends {sub.currentPeriodEnd.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}.</p>}
        {billingConfigured() ? (
          <BillingButtons hasCustomer={!!user.stripeCustomerId} active={!!active} />
        ) : (
          <p className="rounded-xl bg-paper-2 px-4 py-3 text-sm">Payments aren’t set up yet on this site.</p>
        )}
      </Panel>
    </>
  );
}
