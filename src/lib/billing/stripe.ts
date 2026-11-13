import "server-only";
import Stripe from "stripe";

// Stripe, in TEST MODE outside production: a live key (sk_live_…) is refused unless this is the
// production deployment and STRIPE_ALLOW_LIVE=1 is set on purpose.
export function billingConfigured() {
  return !!process.env.STRIPE_SECRET_KEY && !!process.env.STRIPE_PRICE_ID;
}

export function isLiveKey(key: string) {
  return key.startsWith("sk_live_") || key.startsWith("rk_live_");
}

let client: Stripe | null = null;

export function stripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  if (isLiveKey(key) && !(process.env.VERCEL_ENV === "production" && process.env.STRIPE_ALLOW_LIVE === "1")) {
    throw new Error("Live Stripe keys are only allowed in production with STRIPE_ALLOW_LIVE=1. Use a test key (sk_test_…).");
  }
  return (client ??= new Stripe(key, { maxNetworkRetries: 2, appInfo: { name: "LaxtroSpeak" } }));
}

/** Verifies a webhook signature. Needs only STRIPE_WEBHOOK_SECRET (no network call). */
export function verifyWebhook(rawBody: string, signature: string | null): Stripe.Event {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) throw new Error("STRIPE_WEBHOOK_SECRET is not set");
  if (!signature) throw new Error("Missing Stripe-Signature");
  const verifier = client ?? new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder");
  return verifier.webhooks.constructEvent(rawBody, signature, secret);
}

export const PLAN_NAME = () => process.env.STRIPE_PLAN_NAME || "LaxtroSpeak Teacher";
