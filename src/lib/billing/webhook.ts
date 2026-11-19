import "server-only";
import { Prisma } from "@prisma/client";
import type Stripe from "stripe";
import { db } from "@/lib/db";
import { appUrl } from "@/lib/email";
import { claimKeys, sendOnce } from "@/lib/emails/automatic";
import { billingEmail, firstNameOf } from "@/lib/emails/templates";
import { planBillingEmail, subscriptionIdOfInvoice } from "./plan";
import { PLAN_NAME } from "./stripe";

/* eslint-disable @typescript-eslint/no-explicit-any */

async function userFor(customerId: string | null, metaUserId?: string | null) {
  if (metaUserId) {
    const u = await db.user.findUnique({ where: { id: metaUserId } });
    if (u) {
      if (customerId && !u.stripeCustomerId) await db.user.update({ where: { id: u.id }, data: { stripeCustomerId: customerId } }).catch(() => undefined);
      return u;
    }
  }
  return customerId ? db.user.findUnique({ where: { stripeCustomerId: customerId } }) : null;
}

async function upsertSubscription(sub: any, userId: string) {
  const periodEnd = sub.current_period_end ?? sub.items?.data?.[0]?.current_period_end ?? null;
  const data = {
    userId,
    customerId: typeof sub.customer === "string" ? sub.customer : sub.customer?.id ?? "",
    status: String(sub.status ?? "incomplete"),
    priceId: sub.items?.data?.[0]?.price?.id ?? null,
    currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
  };
  await db.subscription.upsert({ where: { id: sub.id }, create: { id: sub.id, ...data }, update: data });
}

export type WebhookOutcome = { duplicate?: boolean; email?: "sent" | "duplicate" | "failed" | "none" | "no_user" };

/** Applies a verified Stripe event. Safe to receive more than once. */
export async function processStripeEvent(event: Stripe.Event): Promise<WebhookOutcome> {
  if (await db.stripeEvent.findUnique({ where: { id: event.id } })) return { duplicate: true };
  const o = event.data.object as any;

  // Keep our copy of the subscription up to date.
  if (event.type.startsWith("customer.subscription.")) {
    const u = await userFor(typeof o.customer === "string" ? o.customer : null, o.metadata?.userId);
    if (u) await upsertSubscription(o, u.id);
  } else if (event.type === "checkout.session.completed") {
    const u = await userFor(typeof o.customer === "string" ? o.customer : null, o.client_reference_id ?? o.metadata?.userId);
    if (u && typeof o.subscription === "string") {
      await db.subscription.upsert({
        where: { id: o.subscription },
        create: { id: o.subscription, userId: u.id, customerId: o.customer ?? "", status: o.payment_status === "paid" || o.payment_status === "no_payment_required" ? "active" : "incomplete" },
        update: {},
      });
    }
  } else if (event.type === "invoice.paid") {
    const subId = subscriptionIdOfInvoice(o);
    if (subId) await db.subscription.updateMany({ where: { id: subId, status: { in: ["incomplete", "past_due", "unpaid"] } }, data: { status: "active" } });
  }

  let email: WebhookOutcome["email"] = "none";
  const plan = planBillingEmail(event as any);
  if (plan.send) {
    const metaUser = o.metadata?.userId ?? o.client_reference_id ?? o.subscription_details?.metadata?.userId ?? o.parent?.subscription_details?.metadata?.userId ?? null;
    const user = await userFor(plan.customerId, metaUser);
    if (!user?.email) email = "no_user";
    else {
      const msg = billingEmail({ firstName: firstNameOf(user.displayName), appUrl: appUrl(), manageUrl: `${appUrl()}/teacher/billing`, planName: PLAN_NAME(), activated: plan.activated, payment: plan.payment });
      email = await sendOnce(plan.key, user.email, user.id, plan.activated && plan.payment ? "purchase" : plan.activated ? "subscription_activated" : "payment", msg);
      if (email === "sent") await claimKeys(plan.alsoClaim, user.email, user.id, "covered", msg.subject);
      if (email === "failed") throw new Error("Email provider failed; Stripe will retry this event.");
    }
  }

  try {
    await db.stripeEvent.create({ data: { id: event.id, type: event.type } });
  } catch (e) {
    if (!(e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002")) throw e;
  }
  return { email };
}
