import { NextResponse } from "next/server";
import { handle } from "@/lib/api";
import { HttpError, requireTeacher } from "@/lib/auth/guards";
import { billingConfigured, stripe } from "@/lib/billing/stripe";
import { appUrl } from "@/lib/email";

// "Manage Subscription": opens the Stripe customer portal for the signed-in teacher.
export const POST = handle(async () => {
  const { user } = await requireTeacher();
  if (!billingConfigured()) throw new HttpError(503, "Payments aren't set up yet.");
  if (!user.stripeCustomerId) throw new HttpError(400, "No subscription yet.");
  const session = await stripe().billingPortal.sessions.create({ customer: user.stripeCustomerId, return_url: `${appUrl()}/teacher/billing` });
  return NextResponse.json({ url: session.url });
});
