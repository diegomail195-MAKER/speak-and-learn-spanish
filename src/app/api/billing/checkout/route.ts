import { NextResponse } from "next/server";
import { handle } from "@/lib/api";
import { HttpError, requireTeacher } from "@/lib/auth/guards";
import { billingConfigured, stripe } from "@/lib/billing/stripe";
import { db } from "@/lib/db";
import { appUrl } from "@/lib/email";

// Starts Stripe Checkout (subscription) for the signed-in teacher.
export const POST = handle(async () => {
  const { user } = await requireTeacher();
  if (!billingConfigured()) throw new HttpError(503, "Payments aren't set up yet (STRIPE_SECRET_KEY / STRIPE_PRICE_ID).");
  const s = stripe();
  let customerId = user.stripeCustomerId;
  if (!customerId) {
    const c = await s.customers.create({ email: user.email ?? undefined, name: user.displayName, metadata: { userId: user.id } });
    customerId = c.id;
    await db.user.update({ where: { id: user.id }, data: { stripeCustomerId: customerId } });
  }
  const session = await s.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    client_reference_id: user.id,
    line_items: [{ price: process.env.STRIPE_PRICE_ID!, quantity: 1 }],
    subscription_data: { metadata: { userId: user.id } },
    success_url: `${appUrl()}/teacher/billing?checkout=success`,
    cancel_url: `${appUrl()}/teacher/billing?checkout=cancel`,
  });
  return NextResponse.json({ url: session.url });
});
