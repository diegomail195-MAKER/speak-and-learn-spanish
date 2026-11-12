import "server-only";

// Transactional email (only "reset your password" for now), sent through Resend's HTTP API.
// Configure on the server:  RESEND_API_KEY  and  EMAIL_FROM  (an address on a domain verified in
// Resend, e.g. "Speak & Learn Spanish <no-reply@speakandlearnspanish.com>").
// Without a key, development (or EMAIL_DRIVER="console", used by the e2e tests, never in
// production) prints the message to the server console; otherwise the app reports that email is
// not configured instead of pretending a message was sent.

export type Email = { to: string; subject: string; text: string; html: string };

const randomRef = () => crypto.randomUUID();

export function emailConfigured(): boolean {
  return !!process.env.RESEND_API_KEY && !!process.env.EMAIL_FROM;
}

const consoleDriver = () => process.env.EMAIL_DRIVER === "console" || process.env.NODE_ENV !== "production";

/** Whether a reset link can reach the teacher: a real provider, or the dev console. */
export function canSendEmail(): boolean {
  return emailConfigured() || consoleDriver();
}

export async function sendEmail(msg: Email): Promise<boolean> {
  if (!emailConfigured()) {
    if (consoleDriver()) {
      console.info(`[email:dev] to=${msg.to} subject=${msg.subject}\n${msg.text}`);
      return true;
    }
    return false;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      // A unique X-Entity-Ref-ID stops Gmail from threading these messages together and hiding
      // the repeated text (which is where the reset link is) behind "•••".
      body: JSON.stringify({ from: process.env.EMAIL_FROM, to: [msg.to], subject: msg.subject, text: msg.text, html: msg.html, headers: { "X-Entity-Ref-ID": randomRef() } }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) console.error("email send failed", res.status); // never log the address or the link
    return res.ok;
  } catch (e) {
    console.error("email send failed", (e as Error).name);
    return false;
  }
}

/** Public base URL for links in emails. Never taken from the request's Host header. */
export function appUrl(): string {
  const configured = process.env.APP_URL ?? (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000");
  return configured.replace(/\/$/, "");
}
