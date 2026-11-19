import { NextResponse } from "next/server";
import { verifyWebhook } from "@/lib/billing/stripe";
import { processStripeEvent } from "@/lib/billing/webhook";

// Stripe webhook (test mode). Configure in Stripe → Developers → Webhooks with the events:
// checkout.session.completed, invoice.paid, customer.subscription.created/updated/deleted.
export async function POST(req: Request) {
  const raw = await req.text();
  let event;
  try {
    event = verifyWebhook(raw, req.headers.get("stripe-signature"));
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message.includes("not set") ? "webhook_not_configured" : "invalid_signature" }, { status: 400 });
  }
  try {
    const result = await processStripeEvent(event);
    return NextResponse.json({ received: true, ...result });
  } catch (e) {
    console.error("stripe webhook failed", event.type, (e as Error).message);
    return NextResponse.json({ error: "processing_failed" }, { status: 500 });
  }
}
