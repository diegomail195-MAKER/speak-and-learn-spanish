// End-to-end test of the security additions: forgot password, cross-site API blocking and the
// shared sign-in limits.
// Run against a production build started with EMAIL_DRIVER=console (the reset email is printed to
// the server log) and APP_URL=$BASE_URL:
//   BASE_URL=http://localhost:3100 SERVER_LOG=/tmp/server.log node e2e/security.e2e.mjs
import { chromium } from "playwright";
import { readFileSync } from "node:fs";

const BASE = process.env.BASE_URL ?? "http://localhost:3100";
const SERVER_LOG = process.env.SERVER_LOG;
const stamp = Date.now();
const email = `reset${stamp}@school.test`;
const log = (...a) => console.log("•", ...a);
const assert = (cond, msg) => {
  if (!cond) throw new Error(`ASSERTION FAILED: ${msg}`);
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function resetLinkFromLog() {
  for (let i = 0; i < 40; i++) {
    const text = readFileSync(SERVER_LOG, "utf8");
    const at = text.lastIndexOf(`to=${email}`);
    if (at >= 0) {
      const m = text.slice(at).match(/https?:\/\/\S+\/reset-password\/[A-Za-z0-9_-]+/);
      if (m) return m[0];
    }
    await sleep(250);
  }
  throw new Error("reset email not found in server log");
}

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } }); // phone size
const page = await ctx.newPage();
page.on("pageerror", (e) => console.error("PAGE ERROR", e.message));

try {
  // Teacher account, then sign out by dropping cookies but keep a second session to check it gets revoked.
  await page.goto(`${BASE}/signup`);
  await page.fill("#displayName", "Rosa Prueba");
  await page.fill("#schoolName", "Test School");
  await page.fill("#email", email);
  await page.fill("#password", "old-password-123");
  await page.click("button[type=submit]");
  await page.waitForURL(`${BASE}/teacher`);
  const oldSession = (await ctx.cookies()).find((c) => c.name === "sls_session");
  assert(oldSession, "session cookie set");
  log("teacher signed up");

  // Sign-in page shows the link
  const anon = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const p2 = await anon.newPage();
  await p2.goto(`${BASE}/login`);
  await p2.getByRole("link", { name: /Forgot your password/ }).click();
  await p2.waitForURL(`${BASE}/forgot-password`);
  log("sign-in page links to forgot password");

  // Unknown email gets the same answer as a real one
  await p2.fill("#email", `nobody${stamp}@school.test`);
  await p2.click("button[type=submit]");
  await p2.getByText(/If an account exists for that email/).waitFor();
  log("unknown email: same neutral answer");

  await p2.goto(`${BASE}/forgot-password`);
  await p2.fill("#email", email);
  await p2.click("button[type=submit]");
  await p2.getByText(/If an account exists for that email/).waitFor();
  const link = await resetLinkFromLog();
  assert(link.startsWith(BASE), "link uses APP_URL");
  log("reset email sent with a link");

  // Mismatched passwords are refused
  await p2.goto(link);
  await p2.fill("#password", "new-password-456");
  await p2.fill("#confirm", "something-else-1");
  await p2.click("button[type=submit]");
  await p2.getByText("Las contraseñas no coinciden.").waitFor();
  await p2.fill("#password", "new-password-456");
  await p2.fill("#confirm", "new-password-456");
  await p2.click("button[type=submit]");
  await p2.getByText(/Your password was changed/).waitFor();
  log("new password saved");

  // The link is single-use
  await p2.goto(link);
  await p2.getByText(/This link expired or was already used/).waitFor();
  log("link cannot be reused");

  // The old session was signed out
  const res = await page.request.get(`${BASE}/api/media`);
  assert(res.status() === 401, `old session revoked (got ${res.status()})`);
  log("existing sessions signed out");

  // Old password fails, new password works
  await p2.goto(`${BASE}/login`);
  await p2.fill("#email", email);
  await p2.fill("#password", "old-password-123");
  await p2.click("button[type=submit]");
  await p2.getByText("Correo o contraseña incorrectos.").waitFor();
  await p2.fill("#email", email); // React resets the form after each submit
  await p2.fill("#password", "new-password-456");
  await p2.click("button[type=submit]");
  await p2.waitForURL(`${BASE}/teacher`);
  log("old password refused, new password signs in");

  // Garbage token
  await p2.goto(`${BASE}/reset-password/not-a-real-token-abcdefghijk`);
  await p2.getByText(/This link expired or was already used/).waitFor();
  log("invalid token refused");

  // Cross-site API calls are refused even with a valid session; same-origin still works
  const cross = await p2.request.post(`${BASE}/api/text/keep`, { headers: { Origin: "https://evil.example", "Content-Type": "application/json" }, data: { word: "hola" } });
  assert(cross.status() === 403, `cross-site POST blocked (got ${cross.status()})`);
  const sub = await p2.request.post(`${BASE}/api/text/keep`, { headers: { Origin: "https://tool.localhost:3100", "Content-Type": "application/json" }, data: { word: "hola" } });
  assert(sub.status() === 403, `other subdomain blocked (got ${sub.status()})`);
  const same = await p2.request.post(`${BASE}/api/text/keep`, { headers: { Origin: BASE, "Content-Type": "application/json" }, data: { word: "hola" } });
  assert(same.status() === 200, `same-origin POST allowed (got ${same.status()})`);
  log("cross-site and cross-subdomain API writes blocked; same origin allowed");

  // Reset requests per email are limited (3 per hour; one used above)
  let limited = false;
  for (let i = 0; i < 4 && !limited; i++) {
    await p2.goto(`${BASE}/forgot-password`);
    await p2.fill("#email", email);
    await p2.click("button[type=submit]");
    await Promise.race([p2.getByText(/If an account exists/).waitFor(), p2.getByText(/Demasiadas solicitudes/).waitFor()]);
    limited = await p2.getByText(/Demasiadas solicitudes/).isVisible();
  }
  assert(limited, "reset requests are rate limited");
  log("reset requests rate limited");

  // Teacher sign-in limit (8 per IP+email per 10 min), shared through the database
  const victim = `limit${stamp}@school.test`;
  let blocked = false;
  for (let i = 0; i < 10 && !blocked; i++) {
    await p2.goto(`${BASE}/login`);
    await p2.fill("#email", victim);
    await p2.fill("#password", "wrong-password");
    await p2.click("button[type=submit]");
    await Promise.race([p2.getByText("Correo o contraseña incorrectos.").waitFor(), p2.getByText(/Demasiados intentos/).waitFor()]);
    blocked = await p2.getByText(/Demasiados intentos/).isVisible();
  }
  assert(blocked, "sign-in attempts are rate limited");
  log("teacher sign-in rate limited");

  console.log("\nSECURITY E2E PASSED");
} catch (e) {
  console.error(e);
  await page.screenshot({ path: "/tmp/security-fail.png" }).catch(() => undefined);
  process.exitCode = 1;
} finally {
  await browser.close();
}
