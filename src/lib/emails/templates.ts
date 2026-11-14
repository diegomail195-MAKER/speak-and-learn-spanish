// LaxtroSpeak automatic emails (English). Pure functions: each returns subject, text and HTML.
// Every dynamic value is HTML-escaped.

export type Rendered = { subject: string; text: string; html: string };

export function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

const INK = "#1F2A44";
const BRAND = "#D93A30";

function button(href: string, label: string) {
  return `<p style="margin:24px 0"><a href="${escapeHtml(href)}" style="background:${BRAND};color:#ffffff;text-decoration:none;font-weight:bold;padding:12px 24px;border-radius:999px;display:inline-block">${escapeHtml(label)}</a></p>`;
}

function layout(appUrl: string, inner: string) {
  return `<div style="font-family:'Century Gothic',CenturyGothic,'URW Gothic',sans-serif;font-size:16px;line-height:1.55;color:${INK};max-width:560px">
<p style="margin:0 0 20px"><img src="${escapeHtml(appUrl)}/brand/laxtrospeak-logo.png" alt="LaxtroSpeak" width="180" style="display:block;height:auto"></p>
${inner}
<hr style="border:none;border-top:1px solid #EADFCB;margin:28px 0 12px">
<p style="font-size:13px;color:#4A5572;margin:0">LaxtroSpeak · Speak &amp; Learn Spanish</p>
</div>`;
}

export function firstNameOf(displayName: string) {
  return displayName.trim().split(/\s+/)[0] || "there";
}

/** Welcome. The "My Classes" paragraph is only for teacher accounts. */
export function welcomeEmail(o: { firstName: string; dashboardUrl: string; isTeacher: boolean; appUrl: string }): Rendered {
  const teacherLine = "If you’re a teacher, go to My Classes to add students and assign your first activity.";
  const text = [
    `Hi ${o.firstName},`,
    "",
    "Welcome to LaxtroSpeak! Your account is ready. Open your dashboard to explore Spanish songs, videos, games, and flashcards.",
    "",
    `Open your dashboard: ${o.dashboardUrl}`,
    "",
    ...(o.isTeacher ? [teacherLine, ""] : []),
    "See you there,",
    "The LaxtroSpeak Team",
  ].join("\n");
  const html = layout(
    o.appUrl,
    `<p>Hi ${escapeHtml(o.firstName)},</p>
<p>Welcome to LaxtroSpeak! Your account is ready. Open your dashboard to explore Spanish songs, videos, games, and flashcards.</p>
${button(o.dashboardUrl, "Open my dashboard")}
${o.isTeacher ? `<p>${teacherLine}</p>` : ""}
<p>See you there,<br>The LaxtroSpeak Team</p>`,
  );
  return { subject: "Welcome to LaxtroSpeak!", text, html };
}

export function verifyEmail(o: { firstName: string; link: string; appUrl: string }): Rendered {
  return {
    subject: "Confirm your email for LaxtroSpeak",
    text: `Hi ${o.firstName},\n\nPlease confirm your email address to finish setting up your LaxtroSpeak account:\n\n${o.link}\n\nThe link works for 24 hours. If you didn't create an account, you can ignore this email.\n\nThe LaxtroSpeak Team`,
    html: layout(
      o.appUrl,
      `<p>Hi ${escapeHtml(o.firstName)},</p><p>Please confirm your email address to finish setting up your LaxtroSpeak account.</p>${button(o.link, "Confirm my email")}
<p style="font-size:14px;color:#4A5572">The link works for 24 hours. If the button doesn't work, copy this address into your browser:<br><a href="${escapeHtml(o.link)}" style="color:${INK};word-break:break-all">${escapeHtml(o.link)}</a></p>
<p style="font-size:14px;color:#4A5572">If you didn't create an account, you can ignore this email.</p>`,
    ),
  };
}

export function adminInviteEmail(o: { link: string; appUrl: string }): Rendered {
  return {
    subject: "You're invited to administer LaxtroSpeak",
    text: `Hello,\n\nYou've been invited to be an administrator of LaxtroSpeak. Open this link to confirm your email and set up your access (valid for 7 days):\n\n${o.link}\n\nIf you weren't expecting this, ignore this email.\n\nThe LaxtroSpeak Team`,
    html: layout(
      o.appUrl,
      `<p>Hello,</p><p>You've been invited to be an administrator of LaxtroSpeak. Confirm your email and set up your access (the link is valid for 7 days).</p>${button(o.link, "Set up my admin access")}
<p style="font-size:14px;color:#4A5572">If you weren't expecting this, ignore this email.</p>`,
    ),
  };
}

export type Money = { amount: number; currency: string }; // amount in the smallest unit (cents)

export function formatMoney(m: Money) {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: m.currency.toUpperCase() }).format(m.amount / 100);
  } catch {
    return `${(m.amount / 100).toFixed(2)} ${m.currency.toUpperCase()}`;
  }
}

/**
 * Billing emails. One template covers the three confirmed events:
 *   activation only · payment only · activation + first payment of the same purchase (one email).
 */
export function billingEmail(o: {
  firstName: string;
  appUrl: string;
  manageUrl: string;
  planName: string;
  activated: boolean;
  payment?: (Money & { receiptUrl?: string | null; date: Date }) | null;
}): Rendered {
  const paid = o.payment ? formatMoney(o.payment) : null;
  const date = o.payment ? o.payment.date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "";
  const subject = o.activated && o.payment ? "Your LaxtroSpeak subscription is active — payment received" : o.activated ? "Your LaxtroSpeak subscription is active" : "Payment received — thank you!";
  const lines: string[] = [`Hi ${o.firstName},`, ""];
  const html: string[] = [`<p>Hi ${escapeHtml(o.firstName)},</p>`];
  if (o.activated) {
    lines.push(`Your ${o.planName} plan is now active. You have full access to LaxtroSpeak.`);
    html.push(`<p>Your <strong>${escapeHtml(o.planName)}</strong> plan is now active. You have full access to LaxtroSpeak.</p>`);
  }
  if (o.payment) {
    lines.push(`We received your payment of ${paid} on ${date}.`);
    html.push(`<p>We received your payment of <strong>${escapeHtml(paid!)}</strong> on ${escapeHtml(date)}.</p>`);
    if (o.payment.receiptUrl) {
      lines.push(`View your receipt: ${o.payment.receiptUrl}`);
      html.push(`<p><a href="${escapeHtml(o.payment.receiptUrl)}" style="color:${INK};font-weight:bold">View your receipt</a></p>`);
    }
  }
  lines.push("", `Manage Subscription: ${o.manageUrl}`, "", "Thank you,", "The LaxtroSpeak Team");
  html.push(button(o.manageUrl, "Manage Subscription"), "<p>Thank you,<br>The LaxtroSpeak Team</p>");
  return { subject, text: lines.join("\n"), html: layout(o.appUrl, html.join("\n")) };
}
