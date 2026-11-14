// Grades, reusable Library and "Add from Library" (topics and activities), end to end.
//
// Server: same as e2e/lextro.e2e.mjs, with E2E_LIB_ADMIN_EMAIL in ADMIN_EMAILS and EMAIL_DRIVER=console.
// Run:    BASE_URL=http://localhost:3100 SERVER_LOG=… E2E_LIB_ADMIN_EMAIL=lib-e2e@lextro.test node e2e/library.e2e.mjs
// Uses the local database (DATABASE_URL) only to read ids back and to rename an earlier test account.
import { chromium } from "playwright";
import { readFileSync } from "node:fs";
import path from "node:path";
import prismaPkg from "@prisma/client";

const { PrismaClient } = prismaPkg;
const db = new PrismaClient();
const BASE = process.env.BASE_URL ?? "http://localhost:3100";
const LOG = process.env.SERVER_LOG;
const ADMIN_EMAIL = (process.env.E2E_LIB_ADMIN_EMAIL ?? "lib-e2e@lextro.test").toLowerCase();
const SHOTS = process.env.SCREENSHOTS;
const stamp = Date.now();
const fx = (f) => path.resolve("e2e/fixtures", f);
const log = (...a) => console.log("•", ...a);
const results = [];
const assert = (ok, msg) => { if (!ok) throw new Error(msg); };
async function check(name, fn) { await fn(); results.push(name); log("✓", name); }
const shot = async (p, name) => SHOTS && p.screenshot({ path: path.join(SHOTS, `${name}.png`), fullPage: true });
const consoleErrors = [];
function watch(p, who) {
  p.on("pageerror", (e) => consoleErrors.push(`${who} pageerror ${e.message}`));
  // Embedded third-party players can log their own errors (blocked trackers etc.): only ours count.
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

const browser = await chromium.launch();
let exit = 0;
try {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const p = watch(await ctx.newPage(), "admin");

  // Admin account (ADMIN_EMAILS + verified email)
  await db.user.updateMany({ where: { email: ADMIN_EMAIL }, data: { email: `old${stamp}-${ADMIN_EMAIL}` } });
  await p.goto(`${BASE}/signup`);
  await p.fill("#displayName", "Library Admin");
  await p.fill("#schoolName", "LextroSpeak HQ");
  await p.fill("#email", ADMIN_EMAIL);
  await p.fill("#password", "correct-horse-42");
  await p.click("button[type=submit]");
  await p.waitForURL(`${BASE}/teacher`);
  const link = await waitFor(() => emails(ADMIN_EMAIL).map((e) => e.body.match(/https?:\/\/\S+\/verify-email\/\S+/)?.[0]).filter(Boolean).at(-1));
  assert(link, "no verification email");
  await p.goto(link.replace(/^https?:\/\/[^/]+/, BASE));
  await p.click("button:text-is('Confirm my email')");
  await p.waitForSelector("text=Your email is confirmed");

  // ── 1. Grades ──
  const grade = `Grade 2 E2E ${stamp % 100000}`;
  await check("1 · Add Grade → Save Grade adds the grade (and it persists after reload)", async () => {
    await p.goto(`${BASE}/admin/grades`);
    await p.click("button:text-is('Add Grade')");
    await p.fill("#grade-name", "   ");
    assert(await p.locator("button:text-is('Save Grade')").isDisabled(), "Save Grade enabled for an empty name");
    await p.fill("#grade-name", grade);
    await p.click("button:text-is('Save Grade')");
    await p.waitForSelector(`[role=status]:has-text('${grade}')`);
    await p.reload();
    await p.waitForSelector(`[data-testid=grade-list] li:has-text('${grade}')`);
  });
  await check("1 · a grade with the same name (other case and spaces) is refused", async () => {
    await p.click("button:text-is('Add Grade')");
    await p.fill("#grade-name", `  ${grade.toUpperCase()} `);
    await p.click("button:text-is('Save Grade')");
    await p.waitForSelector("[role=alert]:has-text('already exists')");
    assert((await db.grade.count({ where: { nameKey: grade.toLowerCase() } })) === 1, "duplicate grade in the DB");
  });
  await shot(p, "lib01-grades");

  // ── 2. Library: Add Content ──
  const ytTitle = `YouTube: los animales ${stamp % 100000}`;
  const pdfTitle = `PDF: worksheet ${stamp % 100000}`;
  const webTitle = `Web song ${stamp % 100000}`;
  const docxTitle = `DOCX: worksheet ${stamp % 100000}`;
  await check("2 · Add Link (YouTube) shows an embedded preview and Save puts it in Library", async () => {
    await p.goto(`${BASE}/admin/content/new`);
    await p.fill("#title", ytTitle);
    await p.check("input[name=kind][value=VIDEO]");
    await p.check("input[name=method][value=link]");
    await p.fill("#url", "ftp://example.org/x");
    await p.waitForSelector("[role=alert]:has-text('https:// or http://')");
    await p.fill("#url", "https://www.youtube.com/watch?v=dQw4w9WgXcQ");
    await p.waitForSelector("[data-testid=link-preview] iframe[src*='youtube-nocookie.com/embed/dQw4w9WgXcQ']");
    await shot(p, "lib02-add-link");
    await p.click("button:text-is('Save')");
    await p.waitForURL(/\/admin\/content\?saved=/);
    await p.waitForSelector(`[data-testid=library-row]:has-text('${ytTitle}'):has-text('Video')`);
    assert(await p.locator(`[data-testid=library-row]:has-text('${ytTitle}') a:text-is('Preview')`).count() === 1, "no Preview action");
  });
  await check("2 · a link that can't be embedded shows Open Link (in the form and the preview)", async () => {
    await p.goto(`${BASE}/admin/content/new`);
    await p.fill("#title", webTitle);
    await p.check("input[name=kind][value=SONG]");
    await p.fill("#url", "https://example.org/songs/animales");
    await p.waitForSelector("[data-testid=open-link][href='https://example.org/songs/animales']");
    await p.click("button:text-is('Save')");
    await p.waitForURL(/\/admin\/content\?saved=/);
    await p.click(`[data-testid=library-row]:has-text('${webTitle}') a:text-is('Preview')`);
    await p.waitForSelector("[data-testid=open-link][href='https://example.org/songs/animales']");
  });
  await check("2 · Upload File (PDF) for a Printable is saved, published and listed", async () => {
    await p.goto(`${BASE}/admin/content/new`);
    await p.fill("#title", pdfTitle);
    await p.check("input[name=kind][value=PRINTABLE]");
    await p.check("input[name=method][value=upload]");
    await p.locator("[data-testid=add-content-upload]").setInputFiles(fx("worksheet.pdf"));
    await p.waitForSelector("[data-testid=uploaded-file]:has-text('worksheet.pdf')", { timeout: 20000 });
    await p.click("button:text-is('Save')");
    await p.waitForURL(/\/admin\/content\?saved=/);
    await p.waitForSelector(`[data-testid=library-row]:has-text('${pdfTitle}'):has-text('Printable')`);
    const r = await db.libraryResource.findFirst({ where: { title: pdfTitle }, include: { currentVersion: true } });
    assert(r?.status === "PUBLISHED" && r.currentVersion?.fileIds.length === 1, "PDF resource not published with its file");
  });
  await check("2 · Upload File (DOCX) for a Worksheet is accepted; a wrong file type is refused", async () => {
    await p.goto(`${BASE}/admin/content/new`);
    await p.fill("#title", docxTitle);
    await p.check("input[name=kind][value=WORKSHEET]");
    await p.check("input[name=method][value=upload]");
    await p.locator("[data-testid=add-content-upload]").setInputFiles(fx("red-circle.png").replace("red-circle.png", "answer.wav"));
    await p.waitForSelector("[role=alert]:has-text(\"doesn't fit\")", { timeout: 20000 });
    await p.locator("[data-testid=add-content-upload]").setInputFiles(fx("worksheet.docx"));
    await p.waitForSelector("[data-testid=uploaded-file]:has-text('worksheet.docx')", { timeout: 20000 });
    await p.click("button:text-is('Save')");
    await p.waitForURL(/\/admin\/content\?saved=/);
    await p.waitForSelector(`[data-testid=library-row]:has-text('${docxTitle}'):has-text('Worksheet')`);
  });
  await check("2 · Flashcards and Game offer the editor and Add Link", async () => {
    await p.goto(`${BASE}/admin/content/new`);
    await p.check("input[name=kind][value=FLASHCARDS]");
    assert(await p.locator("input[name=method][value=build]").isChecked(), "editor is not the default for Flashcards");
    assert(await p.locator("input[name=method][value=upload]").count() === 0, "Upload File offered for Flashcards");
    await p.check("input[name=kind][value=GAME]");
    assert(await p.locator("input[name=method][value=link]").count() === 1, "Add Link missing for Game");
  });
  await check("2 · Library search by title and filter by type", async () => {
    await p.goto(`${BASE}/admin/content?q=${encodeURIComponent(`worksheet ${stamp % 100000}`)}`);
    assert(await p.locator("[data-testid=library-row]").count() === 2, "search should find the PDF and the DOCX");
    await p.goto(`${BASE}/admin/content?q=${encodeURIComponent(`worksheet ${stamp % 100000}`)}&kind=PRINTABLE`);
    assert(await p.locator("[data-testid=library-row]").count() === 1, "type filter didn't narrow to the Printable");
  });
  await shot(p, "lib03-library");

  // ── 3. Topic with the new grade + Add from Library ──
  const topicEs = `Los animales lib ${stamp % 100000}`;
  let topicId;
  await check("3 · new topic: the new grade is in the selector and Add from Library adds the link and the PDF", async () => {
    await p.goto(`${BASE}/admin/topics`);
    await p.fill("#titleEs", topicEs);
    await p.fill("#titleEn", `Animals lib ${stamp % 100000}`);
    await p.selectOption("#grade", { label: grade });
    await p.click("[data-testid=add-from-library]");
    await p.fill("dialog[open] input[aria-label='Search the library']", `${stamp % 100000}`);
    await p.selectOption("dialog[open] select[aria-label='Type of content']", "VIDEO");
    assert(await p.locator("dialog[open] [data-testid=library-picker-list] li").count() === 1, "type filter in the picker");
    await p.check(`dialog[open] li:has-text('${ytTitle}') input[type=checkbox]`);
    await p.selectOption("dialog[open] select[aria-label='Type of content']", "");
    await p.check(`dialog[open] li:has-text('${pdfTitle}') input[type=checkbox]`);
    assert(await p.locator(`dialog[open] li:has-text('${pdfTitle}') a:text-is('Preview ↗')`).count() === 1, "no preview in the picker");
    await shot(p, "lib04-picker");
    await p.click("dialog[open] button:has-text('Add selected (2)')");
    await p.waitForSelector(`[data-testid=picked-resources] li:has-text('${ytTitle}')`);
    await p.click("button:text-is('Create topic')");
    await p.waitForURL(/\/admin\/topics\/[^/]+$/);
    topicId = p.url().split("/").at(-1);
    await p.reload();
    const rows = p.locator("[data-testid=topic-activity]");
    assert((await rows.count()) === 2, `topic has ${await rows.count()} resources`);
    assert((await p.locator("#grade option:checked").textContent()) === grade, "topic grade not saved");
    await p.waitForSelector(`text=${grade}`);
  });
  await shot(p, "lib05-topic");

  // ── 3. Activity (Game) + Add from Library, reusing the PDF ──
  let gameId;
  await check("3 · activity: Add from Library reuses the PDF (same resource, one upload)", async () => {
    await p.goto(`${BASE}/teacher/games/new`);
    await p.click("button[value=FLASHCARDS]");
    await p.waitForURL(/\/edit$/);
    gameId = p.url().split("/").at(-2);
    await p.click("[data-testid=add-from-library]");
    await p.fill("dialog[open] input[aria-label='Search the library']", pdfTitle);
    await p.check(`dialog[open] li:has-text('${pdfTitle}') input[type=checkbox]`);
    await p.click("dialog[open] button:has-text('Add selected (1)')");
    await p.waitForSelector(`[data-testid=activity-resource]:has-text('${pdfTitle}')`);
    await p.reload();
    await p.waitForSelector(`[data-testid=activity-resource]:has-text('${pdfTitle}')`);
    const pdf = await db.libraryResource.findFirst({ where: { title: pdfTitle }, include: { topics: true, games: true } });
    assert(pdf.topics.length === 1 && pdf.games.length === 1 && (await db.libraryResource.count({ where: { title: pdfTitle } })) === 1, "the PDF was copied instead of reused");
  });
  await shot(p, "lib06-activity");

  // ── 4. Remove from the topic: still in the activity and in Library ──
  await check("4 · Remove from Topic keeps the PDF in the activity and in Library (after reload)", async () => {
    await p.goto(`${BASE}/admin/topics/${topicId}`);
    const row = p.locator(`[data-testid=topic-activity]:has-text('${pdfTitle}')`);
    await row.locator("summary:text-is('More')").click();
    await row.locator("button:text-is('Remove from Topic')").click();
    await p.waitForFunction(() => document.querySelectorAll("[data-testid=topic-activity]").length === 1);
    await p.reload();
    assert((await p.locator("[data-testid=topic-activity]").count()) === 1, "topic still has the PDF after reload");
    await p.goto(`${BASE}/teacher/games/${gameId}/edit`);
    await p.waitForSelector(`[data-testid=activity-resource]:has-text('${pdfTitle}')`);
    await p.goto(`${BASE}/admin/content?q=${encodeURIComponent(pdfTitle)}`);
    await p.waitForSelector(`[data-testid=library-row]:has-text('${pdfTitle}')`);
  });
  await check("4 · Remove from Activity keeps it in Library", async () => {
    await p.goto(`${BASE}/teacher/games/${gameId}/edit`);
    await p.click(`[data-testid=activity-resource]:has-text('${pdfTitle}') button:text-is('Remove from Activity')`);
    await p.waitForSelector("[data-testid=activity-resources] li:has-text('No library resources yet.')");
    assert((await db.libraryResource.count({ where: { title: pdfTitle } })) === 1, "resource deleted from the library");
  });

  // ── Permissions on the server ──
  await check("security · a teacher can't open the admin Library, Grades or call the admin upload API", async () => {
    const t = await (await browser.newContext()).newPage();
    await t.goto(`${BASE}/signup`);
    await t.fill("#displayName", "Plain Teacher");
    await t.fill("#schoolName", "Lincoln Elementary");
    await t.fill("#email", `plain${stamp}@school.test`);
    await t.fill("#password", "correct-horse-42");
    await t.click("button[type=submit]");
    await t.waitForURL(`${BASE}/teacher`);
    for (const path of ["/admin/content", "/admin/content/new", "/admin/grades", "/admin/library"]) {
      await t.goto(`${BASE}${path}`);
      assert(!t.url().includes("/admin"), `teacher reached ${path}`);
    }
    const res = await t.request.post(`${BASE}/api/library/files`, { headers: { Origin: BASE, "Content-Type": "application/json" }, data: { name: "x.pdf", size: 10 } });
    assert(res.status() === 403, `upload API answered ${res.status()} to a teacher`);
    await t.goto(`${BASE}/teacher/games/new`);
    await t.click("button[value=FLASHCARDS]");
    await t.waitForURL(/\/edit$/);
    assert((await t.locator("[data-testid=add-from-library]").count()) === 0, "teacher sees Add from Library");
    await t.context().close();
  });

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
