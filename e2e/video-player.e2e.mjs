// Video modes end to end: "Add YouTube Link" (YouTube Educational Video) and "Upload Video"
// (LextroSpeak Hosted Video), Add from Library on a topic, and the student's focus mode.
//
// Server: same as e2e/library.e2e.mjs, with E2E_VP_ADMIN_EMAIL in ADMIN_EMAILS and EMAIL_DRIVER=console.
// Run:    BASE_URL=http://localhost:3100 SERVER_LOG=… node e2e/video-player.e2e.mjs
// Uses the local database (DATABASE_URL) to read ids back, rename an earlier test account and
// create the task (the Assign Task screens are covered by e2e/lextro.e2e.mjs).
// YouTube itself may be unreachable from the test machine: then the player shows its own
// "could not be loaded" message, which the test accepts.
import { chromium } from "playwright";
import { readFileSync } from "node:fs";
import path from "node:path";
import prismaPkg from "@prisma/client";
import { addStudent } from "./class-helpers.mjs";

const { PrismaClient } = prismaPkg;
const db = new PrismaClient();
const BASE = process.env.BASE_URL ?? "http://localhost:3100";
const LOG = process.env.SERVER_LOG;
const ADMIN_EMAIL = (process.env.E2E_VP_ADMIN_EMAIL ?? "vp-e2e@lextro.test").toLowerCase();
const SHOTS = process.env.SCREENSHOTS;
const stamp = Date.now() % 100000;
const fx = (f) => path.resolve("e2e/fixtures", f);
const log = (...a) => console.log("•", ...a);
const results = [];
const assert = (ok, msg) => { if (!ok) throw new Error(msg); };
async function check(name, fn) { await fn(); results.push(name); log("✓", name); }
const shot = async (p, name) => SHOTS && p.screenshot({ path: path.join(SHOTS, `${name}.png`), fullPage: true });
const consoleErrors = [];
function watch(p, who) {
  p.on("pageerror", (e) => consoleErrors.push(`${who} pageerror ${e.message}`));
  p.on("console", (m) => { if (m.type() === "error" && m.location()?.url?.startsWith(BASE)) consoleErrors.push(`${who} ${p.url()} ${m.text()}`); });
  return p;
}
function emails(to) {
  const text = readFileSync(LOG, "utf8");
  const out = [];
  const re = /\[email:dev\] to=(\S+) subject=(.*)\n([\s\S]*?)(?=\n\[email:dev\]|\n\s*$|$)/g;
  for (let m; (m = re.exec(text)); ) if (m[1].toLowerCase() === to.toLowerCase()) out.push({ subject: m[2].trim(), body: m[3] });
  return out;
}
const waitFor = async (fn, ms = 10000) => { const end = Date.now() + ms; for (;;) { const v = await fn(); if (v) return v; if (Date.now() > end) return v; await new Promise((r) => setTimeout(r, 250)); } };
/** Links our own interface puts on the page that leave LextroSpeak (YouTube's player iframe is not ours). */
const externalLinks = (p) => p.locator("main a[href]").evaluateAll((as, base) => as.map((a) => a.href).filter((h) => !h.startsWith(base)), BASE);
const YT = "dQw4w9WgXcQ";

const browser = await chromium.launch();
let exit = 0;
try {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const p = watch(await ctx.newPage(), "admin");

  await db.user.updateMany({ where: { email: ADMIN_EMAIL }, data: { email: `old${Date.now()}-${ADMIN_EMAIL}` } });
  await p.goto(`${BASE}/signup`);
  await p.fill("#displayName", "Video Admin");
  await p.fill("#schoolName", "LextroSpeak Video HQ");
  await p.fill("#email", ADMIN_EMAIL);
  await p.fill("#password", "correct-horse-42");
  await p.click("button[type=submit]");
  await p.waitForURL(`${BASE}/teacher`);
  const link = await waitFor(() => emails(ADMIN_EMAIL).map((e) => e.body.match(/https?:\/\/\S+\/verify-email\/\S+/)?.[0]).filter(Boolean).at(-1));
  assert(link, "no verification email");
  await p.goto(link.replace(/^https?:\/\/[^/]+/, BASE));
  await p.click("button:text-is('Confirm my email')");
  await p.waitForSelector("text=Your email is confirmed");

  const ytTitle = `YT Shorts video ${stamp}`;
  const hostedTitle = `Hosted video ${stamp}`;

  await check("1 · Video offers Add YouTube Link and Upload Video, each with its mode explained", async () => {
    await p.goto(`${BASE}/admin/content/new`);
    await p.check("input[name=kind][value=VIDEO]");
    const labels = await p.locator("input[name=method]").evaluateAll((is) => is.map((i) => i.parentElement.textContent.trim()));
    assert(labels.includes("Add YouTube Link") && labels.includes("Upload Video"), `methods: ${labels.join(", ")}`);
    await p.waitForSelector("[data-testid=video-mode-note]:has-text('YouTube Educational Video')");
    await p.check("input[name=method][value=upload]");
    await p.waitForSelector("[data-testid=video-mode-note]:has-text('LextroSpeak Hosted Video')");
  });

  await check("2 · Add YouTube Link refuses other sites and pasted iframe code, accepts a Shorts link with preview", async () => {
    await p.goto(`${BASE}/admin/content/new`);
    await p.fill("#title", ytTitle);
    await p.check("input[name=kind][value=VIDEO]");
    await p.check("input[name=method][value=link]");
    await p.fill("#url", "https://vimeo.com/76979871");
    await p.waitForSelector("[role=alert]:has-text('Paste a YouTube link')");
    assert(await p.locator("button:text-is('Save')").isDisabled(), "Save enabled for a non-YouTube link");
    await p.fill("#url", `<iframe src="https://www.youtube.com/embed/${YT}"></iframe>`);
    await p.waitForSelector("[role=alert]");
    await p.fill("#url", `https://www.youtube.com/shorts/${YT}`);
    await p.waitForSelector(`[data-testid=link-preview] iframe[src='https://www.youtube-nocookie.com/embed/${YT}?rel=0&playsinline=1']`);
    await shot(p, "vp01-youtube-link");
    await p.click("button:text-is('Save')");
    await p.waitForURL(/\/admin\/content\?saved=/);
    const r = await db.libraryResource.findFirst({ where: { title: ytTitle }, include: { currentVersion: true } });
    assert(r?.status === "PUBLISHED" && r.currentVersion.content.youtubeId === YT, "YouTube id not saved");
    assert(r.currentVersion.content.link.url === `https://www.youtube.com/watch?v=${YT}`, "link not normalized");
  });

  await check("2 · the server also refuses a non-YouTube link for a video (form bypassed)", async () => {
    await p.goto(`${BASE}/admin/content/new`);
    await p.fill("#title", `Bypass ${stamp}`);
    await p.check("input[name=kind][value=VIDEO]");
    await p.evaluate(() => { const i = document.querySelector("#url"); i.type = "text"; });
    await p.fill("#url", "https://example.org/not-a-video");
    // Remove the client-side guard and submit directly.
    await p.evaluate(() => { const b = [...document.querySelectorAll("button")].find((x) => x.textContent === "Save"); b.disabled = false; b.closest("form").requestSubmit(b); });
    await p.waitForSelector("[role=alert]:has-text('Paste a YouTube link')");
    assert((await db.libraryResource.count({ where: { title: `Bypass ${stamp}` } })) === 0, "server saved a non-YouTube video link");
  });

  await check("3 · Upload Video needs the permission box, then saves a LextroSpeak Hosted Video", async () => {
    await p.goto(`${BASE}/admin/content/new`);
    await p.fill("#title", hostedTitle);
    await p.check("input[name=kind][value=VIDEO]");
    await p.check("input[name=method][value=upload]");
    await p.locator("[data-testid=add-content-upload]").setInputFiles(fx("clip.mp4"));
    await p.waitForSelector("[data-testid=uploaded-file]:has-text('clip.mp4')", { timeout: 20000 });
    assert(await p.locator("button:text-is('Save')").isDisabled(), "Save enabled before the permission box");
    await p.check("[data-testid=video-rights]");
    await shot(p, "vp02-upload-video");
    await p.click("button:text-is('Save')");
    await p.waitForURL(/\/admin\/content\?saved=/);
    const r = await db.libraryResource.findFirst({ where: { title: hostedTitle }, include: { currentVersion: true } });
    assert(r?.status === "PUBLISHED" && r.currentVersion.content.file?.mime?.startsWith("video/"), "hosted video not saved");
  });

  await check("3 · a wrong file type is refused for Upload Video", async () => {
    await p.goto(`${BASE}/admin/content/new`);
    await p.check("input[name=kind][value=VIDEO]");
    await p.check("input[name=method][value=upload]");
    await p.locator("[data-testid=add-content-upload]").setInputFiles(fx("worksheet.pdf"));
    await p.waitForSelector("[role=alert]", { timeout: 20000 });
    assert((await p.locator("[data-testid=uploaded-file]").count()) === 0, "PDF accepted as a video");
  });

  await check("4 · admin preview: each video shows its mode; the hosted one has no links to other sites", async () => {
    const yt = await db.libraryResource.findFirst({ where: { title: ytTitle } });
    await p.goto(`${BASE}/admin/content/${yt.id}/preview`);
    await p.waitForSelector("[data-testid=video-mode]:text-is('YouTube Educational Video')");
    const hosted = await db.libraryResource.findFirst({ where: { title: hostedTitle } });
    await p.goto(`${BASE}/admin/content/${hosted.id}/preview`);
    await p.waitForSelector("[data-testid=video-mode]:text-is('LextroSpeak Hosted Video')");
    await p.waitForSelector("[data-testid=video-hosted] video[controls]");
    const ext = await externalLinks(p);
    assert(ext.length === 0, `external links on the hosted video page: ${ext.join(", ")}`);
  });

  // Topic with both videos (Add from Library), a class with one student, and a task.
  let topicId;
  await check("5 · Add from Library puts both videos in a new topic without copying them", async () => {
    await p.goto(`${BASE}/admin/topics`);
    await p.fill("#titleEs", `Videos ${stamp}`);
    await p.fill("#titleEn", `Videos EN ${stamp}`);
    await p.click("[data-testid=add-from-library]");
    await p.fill("dialog[open] input[aria-label='Search the library']", `${stamp}`);
    await p.selectOption("dialog[open] select[aria-label='Type of content']", "VIDEO");
    await p.check(`dialog[open] li:has-text('${ytTitle}') input[type=checkbox]`);
    await p.check(`dialog[open] li:has-text('${hostedTitle}') input[type=checkbox]`);
    await p.click("dialog[open] button:has-text('Add selected (2)')");
    await p.click("button:text-is('Create topic')");
    await p.waitForURL(/\/admin\/topics\/[^/]+$/);
    topicId = p.url().split("/").at(-1);
    assert((await db.topicResource.count({ where: { topicId } })) === 2, "topic doesn't have both videos");
    assert((await db.libraryResource.count({ where: { title: { in: [ytTitle, hostedTitle] } } })) === 2, "videos were copied");
  });

  await p.goto(`${BASE}/teacher/classes`);
  await p.fill("#name", `Video class ${stamp}`);
  await p.click("text=Create class");
  await p.click(`text=Video class ${stamp}`);
  await p.waitForURL(/\/teacher\/classes\/[^/]+$/);
  const classUrl = p.url();
  const classId = classUrl.split("/").at(-1);
  const code = (await p.locator("span.font-mono").first().textContent()).trim();
  const pin = await addStudent(p, classUrl, "Lucia", { initial: "V" });

  const admin = await db.user.findUnique({ where: { email: ADMIN_EMAIL }, include: { teacher: true } });
  const student = await db.student.findFirst({ where: { classroomId: classId, firstName: "Lucia" } });
  const vids = await db.libraryResource.findMany({ where: { title: { in: [hostedTitle, ytTitle] } } });
  const byTitle = Object.fromEntries(vids.map((v) => [v.title, v]));
  const task = await db.assignment.create({
    data: {
      schoolId: admin.schoolId, teacherId: admin.teacher.id, topicId, title: `Watch ${stamp}`,
      recipients: { create: [{ type: "STUDENT", studentId: student.id }] },
      activities: { create: [hostedTitle, ytTitle].map((t, i) => ({ resourceId: byTitle[t].id, versionId: byTitle[t].currentVersionId, position: i })) },
    },
    include: { activities: { orderBy: { position: "asc" } } },
  });
  const [hostedAct, ytAct] = task.activities;

  const sctx = await browser.newContext({ viewport: { width: 1024, height: 1366 }, hasTouch: true });
  const s = watch(await sctx.newPage(), "student");
  await s.goto(`${BASE}/student/${code}`);
  await s.click("button:has-text('Lucia')");
  for (const d of pin) await s.click(`button:text-is('${d}')`);
  await s.click("text=Go!");
  await s.waitForURL(`${BASE}/learn`);

  await check("6 · student focus mode: the hosted video plays inside LextroSpeak, with no links out, and Continue goes to the next activity", async () => {
    await s.goto(`${BASE}/learn/tasks/${task.id}/${hostedAct.id}`);
    await s.waitForSelector("[data-testid=video-mode]:text-is('LextroSpeak Hosted Video')");
    const v = s.locator("[data-testid=video-hosted] video");
    await v.waitFor();
    const ext = await externalLinks(s);
    assert(ext.length === 0, `external links for the student: ${ext.join(", ")}`);
    assert((await s.locator("[data-testid=open-link]").count()) === 0, "Open Link shown to a student");
    // Play to the end (muted, so the browser allows it without a tap).
    await v.evaluate((el) => { el.muted = true; return el.play(); });
    await s.waitForSelector("[data-testid=video-continue]", { timeout: 15000 });
    await shot(s, "vp03-student-hosted-ended");
    assert((await s.locator("[data-testid=video-continue]").getAttribute("href")) === `/learn/tasks/${task.id}/${ytAct.id}`, "Continue doesn't go to the next activity");
    await waitFor(async () => (await db.activityProgress.count({ where: { activityId: hostedAct.id, completedAt: { not: null } } })) > 0, 5000);
    assert((await db.activityProgress.count({ where: { activityId: hostedAct.id, completedAt: { not: null } } })) > 0, "watching to the end wasn't recorded");
    await s.click("[data-testid=video-continue]");
    await s.waitForURL(`${BASE}/learn/tasks/${task.id}/${ytAct.id}`);
  });

  await check("6 · student focus mode: the YouTube video uses YouTube's official player (or says YouTube can't load), no links out from us", async () => {
    await s.waitForSelector("[data-testid=video-mode]:text-is('YouTube Educational Video')");
    const state = await waitFor(async () => {
      if (await s.locator(`iframe[src*='youtube-nocookie.com/embed/${YT}']`).count()) return "player";
      if (await s.locator("text=YouTube could not be loaded").count()) return "blocked";
      return null;
    }, 20000);
    assert(state, "neither the YouTube player nor a clear message appeared");
    log(`  YouTube from the test machine: ${state}`);
    if (state === "player") {
      const src = await s.locator(`iframe[src*='youtube-nocookie.com/embed/${YT}']`).getAttribute("src");
      assert(!/modestbranding|showinfo/.test(src), `deprecated parameters in ${src}`);
    }
    await shot(s, "vp04-student-youtube");
    const ext = await externalLinks(s);
    assert(ext.length === 0, `external links for the student: ${ext.join(", ")}`);
    assert((await s.locator("[data-testid=open-link]").count()) === 0, "Open Link shown to a student");
  });

  await check("7 · a student can't open the admin Library or another student's task", async () => {
    for (const u of ["/admin/content", "/admin/content/new"]) {
      await s.goto(`${BASE}${u}`);
      assert(!s.url().includes("/admin"), `student reached ${u}`);
    }
    const other = await db.assignment.create({ data: { schoolId: admin.schoolId, teacherId: admin.teacher.id, topicId, title: "Not for Lucia", activities: { create: [{ resourceId: byTitle[hostedTitle].id, versionId: byTitle[hostedTitle].currentVersionId, position: 0 }] } }, include: { activities: true } });
    const res = await s.goto(`${BASE}/learn/tasks/${other.id}/${other.activities[0].id}`);
    assert(res.status() === 404, `unassigned task answered ${res.status()}`);
    await s.waitForTimeout(300);
    for (let i = consoleErrors.length - 1; i >= 0; i--) if (consoleErrors[i].includes(other.id) && consoleErrors[i].includes("404")) consoleErrors.splice(i, 1); // expected
    const file = byTitle[hostedTitle];
    const fileId = (await db.resourceVersion.findUnique({ where: { id: file.currentVersionId } })).fileIds[0];
    const anon = await (await browser.newContext()).request.get(`${BASE}/api/library/files/${fileId}`);
    assert(anon.status() === 401 || anon.status() === 403 || anon.status() === 404, `anonymous file download answered ${anon.status()}`);
  });

  await sctx.close();
  assert(consoleErrors.length === 0, `console errors:\n${consoleErrors.join("\n")}`);
  log(`PASS ${results.length} checks`);
} catch (e) {
  console.error("FAIL", e.message);
  if (consoleErrors.length) console.error(consoleErrors.join("\n"));
  exit = 1;
} finally {
  await browser.close();
  await db.$disconnect();
}
process.exit(exit);
