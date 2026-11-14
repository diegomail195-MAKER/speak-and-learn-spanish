import { describe, expect, it } from "vitest";
import { billingEmail, welcomeEmail } from "./templates";

describe("welcomeEmail", () => {
  it("uses the template and shows My Classes only to teachers", () => {
    const t = welcomeEmail({ firstName: "Ana", dashboardUrl: "https://x/teacher", isTeacher: true, appUrl: "https://x" });
    expect(t.subject).toBe("Welcome to LextroSpeak!");
    expect(t.text).toContain("Hi Ana,");
    expect(t.text).toContain("Welcome to LextroSpeak! Your account is ready.");
    expect(t.text).toContain("go to My Classes");
    expect(t.text).toContain("The LextroSpeak Team");
    const s = welcomeEmail({ firstName: "Leo", dashboardUrl: "https://x/teacher", isTeacher: false, appUrl: "https://x" });
    expect(s.text).not.toContain("My Classes");
    expect(s.html).not.toContain("My Classes");
  });
  it("escapes names", () => {
    expect(welcomeEmail({ firstName: "<b>", dashboardUrl: "https://x", isTeacher: true, appUrl: "https://x" }).html).toContain("&lt;b&gt;");
  });
});

describe("billingEmail", () => {
  const base = { firstName: "Ana", appUrl: "https://x", manageUrl: "https://x/teacher/billing", planName: "Teacher" };
  it("combines activation and payment in one email", () => {
    const e = billingEmail({ ...base, activated: true, payment: { amount: 900, currency: "usd", receiptUrl: "https://r", date: new Date("2026-11-13") } });
    expect(e.subject).toMatch(/active — payment received/);
    expect(e.text).toContain("$9.00");
    expect(e.text).toContain("View your receipt: https://r");
    expect(e.text).toContain("Manage Subscription: https://x/teacher/billing");
  });
  it("payment without a receipt link from the provider", () => {
    const e = billingEmail({ ...base, activated: false, payment: { amount: 900, currency: "usd", receiptUrl: null, date: new Date() } });
    expect(e.subject).toBe("Payment received — thank you!");
    expect(e.text).not.toContain("receipt");
  });
});
