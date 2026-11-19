// Pure decision: which billing email (if any) a confirmed Stripe event produces, and the
// idempotency keys it uses. Kept free of I/O so it can be unit-tested.
//
//  · First payment of a new subscription (invoice.paid, billing_reason=subscription_create):
//    ONE combined email "subscription active + payment", key purchase:<sub> (also claims
//    payment:<invoice> and activated:<sub>:initial so nothing else repeats it).
//  · Checkout with nothing to pay (free trial): activation email, same purchase:<sub> key.
//  · Renewals and other paid invoices: payment email, key payment:<invoice>.
//  · A subscription that becomes active again (past_due/unpaid/paused/canceled → active):
//    activation email, key activated:<sub>:<period start>.
//  · Everything else: no email (incomplete → active is the initial purchase, covered above).

/* eslint-disable @typescript-eslint/no-explicit-any */
export type EmailPlan =
  | { send: false }
  | {
      send: true;
      key: string;
      alsoClaim: string[];
      activated: boolean;
      payment: { amount: number; currency: string; receiptUrl: string | null; date: Date } | null;
      subscriptionId: string | null;
      customerId: string | null;
    };

export function subscriptionIdOfInvoice(inv: any): string | null {
  const s = inv?.subscription ?? inv?.parent?.subscription_details?.subscription ?? inv?.lines?.data?.[0]?.parent?.subscription_item_details?.subscription ?? null;
  return typeof s === "string" ? s : s?.id ?? null;
}

const idOf = (x: any): string | null => (typeof x === "string" ? x : x?.id ?? null);

export function planBillingEmail(event: { id: string; type: string; data: { object: any; previous_attributes?: any } }): EmailPlan {
  const o = event.data.object;
  switch (event.type) {
    case "invoice.paid":
    case "invoice.payment_succeeded": {
      if (!o?.id || !(o.amount_paid > 0)) return { send: false };
      const sub = subscriptionIdOfInvoice(o);
      const payment = { amount: o.amount_paid, currency: o.currency ?? "usd", receiptUrl: o.hosted_invoice_url ?? null, date: new Date((o.status_transitions?.paid_at ?? o.created ?? Date.now() / 1000) * 1000) };
      if (o.billing_reason === "subscription_create" && sub) {
        return { send: true, key: `purchase:${sub}`, alsoClaim: [`payment:${o.id}`, `activated:${sub}:initial`], activated: true, payment, subscriptionId: sub, customerId: idOf(o.customer) };
      }
      return { send: true, key: `payment:${o.id}`, alsoClaim: [], activated: false, payment, subscriptionId: sub, customerId: idOf(o.customer) };
    }
    case "checkout.session.completed": {
      if (o?.mode !== "subscription" || o.payment_status !== "no_payment_required") return { send: false };
      const sub = idOf(o.subscription);
      if (!sub) return { send: false };
      return { send: true, key: `purchase:${sub}`, alsoClaim: [`activated:${sub}:initial`], activated: true, payment: null, subscriptionId: sub, customerId: idOf(o.customer) };
    }
    case "customer.subscription.updated": {
      const prev = event.data.previous_attributes?.status;
      if (o?.status !== "active" || !["past_due", "unpaid", "paused", "canceled"].includes(prev)) return { send: false };
      const start = o.current_period_start ?? o.items?.data?.[0]?.current_period_start ?? "now";
      return { send: true, key: `activated:${o.id}:${start}`, alsoClaim: [], activated: true, payment: null, subscriptionId: o.id, customerId: idOf(o.customer) };
    }
    default:
      return { send: false };
  }
}
