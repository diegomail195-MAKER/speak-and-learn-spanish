import { describe, expect, it } from "vitest";
import { planBillingEmail } from "./plan";

const invoice = (extra: Record<string, unknown>) => ({ id: "evt", type: "invoice.paid", data: { object: { id: "in_1", amount_paid: 900, currency: "usd", customer: "cus_1", hosted_invoice_url: "https://pay.stripe.com/r/1", created: 1_700_000_000, ...extra } } });

describe("planBillingEmail", () => {
  it("first payment of a new subscription → one combined email", () => {
    const p = planBillingEmail(invoice({ billing_reason: "subscription_create", subscription: "sub_1" }));
    expect(p).toMatchObject({ send: true, key: "purchase:sub_1", activated: true, alsoClaim: ["payment:in_1", "activated:sub_1:initial"] });
    if (p.send) expect(p.payment?.receiptUrl).toBe("https://pay.stripe.com/r/1");
  });
  it("reads the subscription from the newer invoice shape", () => {
    const p = planBillingEmail(invoice({ billing_reason: "subscription_create", parent: { subscription_details: { subscription: "sub_9" } } }));
    expect(p).toMatchObject({ key: "purchase:sub_9" });
  });
  it("renewal → payment email only", () => {
    expect(planBillingEmail(invoice({ billing_reason: "subscription_cycle", subscription: "sub_1" }))).toMatchObject({ key: "payment:in_1", activated: false });
  });
  it("zero-amount invoices send nothing", () => {
    expect(planBillingEmail(invoice({ amount_paid: 0, billing_reason: "subscription_create", subscription: "sub_1" }))).toEqual({ send: false });
  });
  it("trial checkout → activation email with the purchase key", () => {
    const p = planBillingEmail({ id: "e", type: "checkout.session.completed", data: { object: { mode: "subscription", payment_status: "no_payment_required", subscription: "sub_2", customer: "cus_2" } } });
    expect(p).toMatchObject({ key: "purchase:sub_2", activated: true, payment: null });
  });
  it("paid checkout sends nothing (the invoice email covers it)", () => {
    expect(planBillingEmail({ id: "e", type: "checkout.session.completed", data: { object: { mode: "subscription", payment_status: "paid", subscription: "sub_2" } } })).toEqual({ send: false });
  });
  it("reactivation → activation email; initial incomplete→active does not", () => {
    const sub = { id: "sub_3", status: "active", customer: "cus_3", current_period_start: 123 };
    expect(planBillingEmail({ id: "e", type: "customer.subscription.updated", data: { object: sub, previous_attributes: { status: "past_due" } } })).toMatchObject({ key: "activated:sub_3:123" });
    expect(planBillingEmail({ id: "e", type: "customer.subscription.updated", data: { object: sub, previous_attributes: { status: "incomplete" } } })).toEqual({ send: false });
  });
});
