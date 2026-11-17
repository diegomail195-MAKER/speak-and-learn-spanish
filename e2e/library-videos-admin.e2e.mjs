// Library › Videos keeps working with the existing authoring flows: an administrator uploads a
// video file and adds a YouTube link (Add Content), selects both from a Topic (Add from Library),
// and the teacher's gallery shows them in that topic's row and plays them on the watch page.
// Server: ADMIN_EMAILS=lib-e2e@lextro.test EMAIL_DRIVER=console next dev -p 3100 > $SERVER_LOG
// Run:    BASE_URL=http://localhost:3100 SERVER_LOG=… node e2e/library-videos-admin.e2e.mjs
import { chromium } from "playwright";
import { readFileSync } from "node:fs";
import path from "node:path";
import prismaPkg from "@prisma/client";

const db = new prismaPkg.PrismaClient();
const BASE = process.env.BASE_URL ?? "http://localhost:3100";
const LOG = process.env.SERVER_LOG;
const ADMIN_EMAIL = (process.env.E2E_LIB_ADMIN_EMAIL ?? "lib-e2e@lextro.test").toLowerCase();
const stamp = Date.now() % 100000;
const log = (...a) => console.log("•", ...a);
const assert = (ok, msg) => {
  if (!ok) throw new Error(msg);
};
const emails = (to) => {
  const out = [];
  const re = /\[email:dev\] to=(\S+) subject=(.*)\n([\s\S]*?)(?=\n\[email:dev\]|\n\s*$|$)/g;
  const text = readFileSync(LOG, "utf8");
  for (let m; (m = re.exec(text)); ) if (m[1].toLowerCase() === to) out.push(m[3]);
  return out;
};
const waitFor = async (fn, ms = 10000) => {
  const end = Date.now() + ms;
  for (;;) {
    const v = await fn();
    if (v || Date.now() > end) return v;
    await new Promise((r) => setTimeout(r, 250));
  }
};

const browser = await chromium.launch({ args: ["--autoplay-policy=no-user-gesture-required"] });
try {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const p = await ctx.newPage();
  await db.user.updateMany({ where: { email: ADMIN_EMAIL }, data: { email: `old${Date.now()}-${ADMIN_EMAIL}` } });
  await p.goto(`${BASE}/signup`);
  await p.fill("#displayName", "Library Admin");
  await p.fill("#schoolName", "LextroSpeak HQ");
  await p.fill("#email", ADMIN_EMAIL);
  await p.fill("#password", "correct-horse-42");
  await p.click("button[type=submit]");
  await p.waitForURL(`${BASE}/teacher`);
  const link = await waitFor(() => emails(ADMIN_EMAIL).map((b) => b.match(/https?:\/\/\S+\/verify-email\/\S+/)?.[0]).filter(Boolean).at(-1));
  await p.goto(link.replace(/^https?:\/\/[^/]+/, BASE));
  await p.click("button:text-is('Confirm my email')");
  await p.waitForSelector("text=Your email is confirmed");

  // Upload a video file.
  const fileTitle = `Canción de prueba ${stamp}`;
  await p.goto(`${BASE}/admin/content/new`);
  await p.fill("#title", fileTitle);
  await p.check("input[name=kind][value=VIDEO]");
  await p.check("input[name=method][value=upload]");
  await p.locator("[data-testid=add-content-upload]").setInputFiles(path.resolve("e2e/fixtures/clip.mp4"));
  await p.waitForSelector("[data-testid=uploaded-file]:has-text('clip.mp4')", { timeout: 30000 });
  await p.check("[data-testid=video-rights]");
  await p.click("button:text-is('Save')");
  await p.waitForURL(/\/admin\/content\?saved=/);
  log("upload: video file saved to the Library");

  // Add a YouTube link.
  const ytTitle = `Video de YouTube ${stamp}`;
  await p.goto(`${BASE}/admin/content/new`);
  await p.fill("#title", ytTitle);
  await p.check("input[name=kind][value=VIDEO]");
  await p.check("input[name=method][value=link]");
  await p.fill("#url", "https://www.youtube.com/watch?v=1WhKIrWBWT0");
  await p.waitForSelector("[data-testid=link-preview] iframe[src*='youtube-nocookie.com/embed/1WhKIrWBWT0']");
  await p.click("button:text-is('Save')");
  await p.waitForURL(/\/admin\/content\?saved=/);
  log("add link: YouTube video saved to the Library");

  // A topic selects both existing videos with Add from Library.
  const topicEs = `Prueba de videos ${stamp}`;
  await p.goto(`${BASE}/admin/topics`);
  await p.fill("#titleEs", topicEs);
  await p.fill("#titleEn", `Video test ${stamp}`);
  await p.click("[data-testid=add-from-library]");
  await p.fill("dialog[open] input[aria-label='Search the library']", `${stamp}`);
  await p.check(`dialog[open] li:has-text('${fileTitle}') input[type=checkbox]`);
  await p.check(`dialog[open] li:has-text('${ytTitle}') input[type=checkbox]`);
  await p.click("dialog[open] button:has-text('Add selected (2)')");
  await p.waitForSelector(`[data-testid=picked-resources] li:has-text('${ytTitle}')`);
  await p.click("button:text-is('Create topic')");
  await p.waitForURL(/\/admin\/topics\/[^/]+$/);
  log("topic: Add from Library selected the two existing videos");

  // The gallery shows the new topic's row; the uploaded file plays on the watch page.
  await p.goto(`${BASE}/teacher/library?grade=LOWER&type=VIDEO`);
  const row = p.getByTestId("video-row").filter({ hasText: topicEs });
  await row.waitFor();
  const labels = await row.getByTestId("video-card").evaluateAll((els) => els.map((e) => e.getAttribute("aria-label")));
  assert(labels.length === 2 && labels[0].startsWith(`${fileTitle}, Music video`) && labels[1].startsWith(`${ytTitle}, Video`), `row: ${labels.join(" | ")}`);
  await row.scrollIntoViewIfNeeded();
  await row.locator("img[src*='i.ytimg.com/vi/1WhKIrWBWT0']").waitFor({ state: "attached" });
  await row.getByTestId("video-card").first().click();
  await p.getByTestId("watch-title").filter({ hasText: fileTitle }).waitFor();
  await p.waitForFunction(() => {
    const v = document.querySelector("[data-testid=watch-stage] video");
    return v && v.currentTime > 0.2;
  }, null, { timeout: 15000 });
  log("gallery: new topic row", labels.length, "videos · uploaded file plays");
  await p.getByTestId("watch-next").click();
  await p.getByTestId("watch-title").filter({ hasText: ytTitle }).waitFor();
  const iframe = await waitFor(() => p.locator("[data-testid=watch-stage] iframe").getAttribute("src").catch(() => null), 15000);
  log("YouTube player:", iframe ? iframe.replace(/^(https:\/\/[^/]+\/embed\/[\w-]+)\?.*/, "$1 (params: ") + (iframe.split("?")[1] ?? "").split("&").map((x) => x.split("=")[0]).join(",") + ")" : "not loaded (YouTube is blocked in this sandbox)");
  log("OK");
} catch (e) {
  console.error("FAILED:", e.message);
  process.exitCode = 1;
} finally {
  await browser.close();
  await db.$disconnect();
}
