// LextroSpeak end-to-end test (requirement 7): admin library, classes, Assign Task, versions,
// automatic emails, Stripe webhooks (test mode, signed locally), permissions, desktop + iPad.
//
// Server: npm run build && EMAIL_DRIVER=console APP_URL=$BASE_URL STRIPE_WEBHOOK_SECRET=whsec_e2e_test_secret \
//         STRIPE_SECRET_KEY=sk_test_dummy ADMIN_EMAILS=$E2E_ADMIN_EMAIL npx next start -p 3100 > $SERVER_LOG 2>&1
// Run:    BASE_URL=http://localhost:3100 SERVER_LOG=… E2E_ADMIN_EMAIL=admin-e2e@lextro.test \
//         STRIPE_WEBHOOK_SECRET=whsec_e2e_test_secret node e2e/lextro.e2e.mjs
// Uses the local database (DATABASE_URL) to look up ids and rename an earlier admin test account.
import { chromium, devices } from "playwright";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import Stripe from "stripe";
import prismaPkg from "@prisma/client";
import { addStudent } from "./class-helpers.mjs";

const { PrismaClient } = prismaPkg;
const db = new PrismaClient();
const BASE = process.env.BASE_URL ?? "http://localhost:3100";
const LOG = process.env.SERVER_LOG;
const ADMIN_EMAIL = (process.env.E2E_ADMIN_EMAIL ?? "admin-e2e@lextro.test").toLowerCase();
const WHSEC = process.env.STRIPE_WEBHOOK_SECRET ?? "whsec_e2e_test_secret";
const SHOTS = process.env.SCREENSHOTS;
const stamp = Date.now();
const fx = (f) => path.resolve("e2e/fixtures", f);
const log = (...a) => console.log("•", ...a);
const results = [];
const assert = (ok, msg) => { if (!ok) throw new Error(msg); };
async function check(name, fn) {
  await fn();
  results.push(name);
  log("✓", name);
}
const shot = async (p, name) => SHOTS && p.screenshot({ path: path.join(SHOTS, `${name}.png`), fullPage: true });

// ── Console errors on every page (except while a test expects a 404/403 on purpose) ──────────
const consoleErrors = [];
let expectErrors = false;
function watch(p, who) {
  p.on("pageerror", (e) => consoleErrors.push(`${who} pageerror ${e.message}`));
  p.on("console", (m) => { if (m.type() === "error" && !expectErrors) consoleErrors.push(`${who} ${p.url()} ${m.text()}`); });
  return p;
}
async function denied(fn) { expectErrors = true; try { return await fn(); } finally { expectErrors = false; } }

// ── Emails printed by EMAIL_DRIVER=console ───────────────────────────────────────────────────
function emails(to) {
  const text = readFileSync(LOG, "utf8");
  const out = [];
  const re = /\[email:dev\] to=(\S+) subject=(.*)\n([\s\S]*?)(?=\n\[email:dev\]|\n\s*$|$)/g;
  for (let m; (m = re.exec(text)); ) if (m[1].toLowerCase() === to.toLowerCase()) out.push({ subject: m[2].trim(), body: m[3] });
  return out;
}
const waitFor = async (fn, ms = 10000) => { const end = Date.now() + ms; for (;;) { const v = await fn(); if (v) return v; if (Date.now() > end) return v; await new Promise((r) => setTimeout(r, 250)); } };
const verifyLinkFor = (to) => waitFor(() => emails(to).filter((e) => e.subject.startsWith("Confirm your email")).map((e) => e.body.match(/https?:\/\/\S+\/verify-email\/\S+/)?.[0]).filter(Boolean).at(-1));

const browser = await chromium.launch();
const desktop = { viewport: { width: 1280, height: 800 } };

async function signUp(p, { name, school, email, password = "correct-horse-42" }) {
  await p.goto(`${BASE}/signup`);
  await p.fill("#displayName", name);
  await p.fill("#schoolName", school);
  await p.fill("#email", email);
  await p.fill("#password", password);
  await p.click("button[type=submit]");
  await p.waitForURL(`${BASE}/teacher`);
}
async function signIn(p, email, password = "correct-horse-42") {
  await p.goto(`${BASE}/login`);
  await p.fill("#email", email);
  await p.fill("#password", password);
  await p.click("button[type=submit]");
  await p.waitForURL(`${BASE}/teacher`);
}
async function confirmEmail(p, email) {
  const link = await verifyLinkFor(email);
  assert(link, `no verification email for ${email}`);
  await p.goto(link.replace(/^https?:\/\/[^/]+/, BASE));
  await p.click("button:text-is('Confirm my email')");
  await p.waitForSelector("text=Your email is confirmed");
}
async function studentSignIn(ctx, code, name, secret) {
  const p = watch(await ctx.newPage(), `student ${name}`);
  await p.goto(`${BASE}/student/${code}`);
  await p.click(`button:has-text('${name}')`);
  if (/^\d{4}$/.test(secret)) for (const d of secret) await p.click(`button:text-is('${d}')`);
  else await p.fill("#student-password", secret);
  await p.click("text=Go!");
  await p.waitForURL(`${BASE}/learn`);
  return p;
}

// Admin editor helpers
async function newResource(p, topicId, kind, title, { grades = ["LOWER"], gameType } = {}) {
  await p.goto(`${BASE}/admin/content/new?topicId=${topicId}`);
  await p.check(`input[name=kind][value=${kind}]`);
  await p.check("input[name=method][value=build]"); // open the editor (upload / build there)
  if (gameType) await p.selectOption("#gameType", gameType);
  await p.fill("#title", title);
  for (const g of grades) await p.check(`input[name=grades][value=${g}]`);
  await p.click("button:text-is('Save')");
  await p.waitForURL(/\/admin\/content\/(?!new)[^/]+$/);
  return p.url().split("/").at(-1);
}
async function saveDraft(p) {
  await p.click("button:text-is('Save draft')");
  await p.waitForSelector("[role=status]:text-is('Draft saved.')");
}
async function publish(p, n = 1) {
  await p.click(`button:text-is('${n === 1 ? "Publish" : "Publish new version"}')`);
  await p.waitForSelector(`[role=status]:text-is('Published version ${n}.')`);
}
async function upload(p, testId, file) {
  await p.locator(`[data-testid=${testId}]`).setInputFiles(fx(file));
  await p.waitForSelector(`a:text-is('${file}')`, { timeout: 20000 });
}
async function fillPairs(p, pairs) {
  for (let i = 0; i < pairs.length; i++) {
    await p.click("button:text-is('+ Add pair')");
    await p.fill(`input[aria-label='Spanish ${i + 1}']`, pairs[i][0]);
    await p.fill(`input[aria-label='English ${i + 1}']`, pairs[i][1]);
    if (pairs[i][2]) await p.selectOption(`select[aria-label='Picture ${i + 1}: built-in']`, pairs[i][2]);
  }
}

let exit = 0;
try {
  // ════════════════ 7.1 Admin: song, video, Memory Game, flashcards → one topic, one grade ════
  const actx = await browser.newContext(desktop);
  const admin = watch(await actx.newPage(), "admin");
  await db.user.updateMany({ where: { email: ADMIN_EMAIL }, data: { email: `old${stamp}-${ADMIN_EMAIL}` } }); // earlier runs
  await signUp(admin, { name: "Lextro Admin", school: "LextroSpeak HQ", email: ADMIN_EMAIL });
  await check("5 · unverified ADMIN_EMAILS account is not an admin yet (server redirect)", async () => {
    await admin.goto(`${BASE}/admin`);
    assert(admin.url().startsWith(`${BASE}/teacher`), `unverified admin reached ${admin.url()}`);
  });
  await confirmEmail(admin, ADMIN_EMAIL);
  await check("5 · verified ADMIN_EMAILS account gets the admin role from the server", async () => {
    await admin.goto(`${BASE}/admin`);
    assert(admin.url() === `${BASE}/admin`, `admin landed on ${admin.url()}`);
    await admin.waitForSelector("a:text-is('Admin')");
  });

  const topicEs = `Los animales ${stamp % 100000}`;
  await admin.goto(`${BASE}/admin/topics`);
  await admin.fill("#titleEs", topicEs);
  await admin.fill("#titleEn", `Animals E2E ${stamp % 100000}`);
  await admin.fill("#category", "Science");
  await admin.click("button:text-is('Create topic')");
  await admin.waitForURL(/\/admin\/topics\/[^/]+$/);
  const topicId = admin.url().split("/").at(-1);

  const songId = await newResource(admin, topicId, "SONG", "Canción de los animales");
  await upload(admin, "song-upload", "answer.wav");
  await saveDraft(admin);
  await publish(admin);
  const videoId = await newResource(admin, topicId, "VIDEO", "Video: el perro y el gato");
  await upload(admin, "video-upload", "clip.webm");
  await saveDraft(admin);
  await publish(admin);
  const memoryId = await newResource(admin, topicId, "GAME", "Memory: animales", { gameType: "MEMORY" });
  await fillPairs(admin, [["el perro", "the dog", "animals:perro"], ["el conejo", "the rabbit", "animals:conejo"]]);
  await admin.fill("#gins", "Find the pairs.");
  await saveDraft(admin);
  await publish(admin);
  const cardsId = await newResource(admin, topicId, "FLASHCARDS", "Flashcards: animales");
  for (const [i, [f, b]] of [["el perro", "the dog"], ["el pájaro", "the bird"]].entries()) {
    await admin.click("button:text-is('+ Add card')");
    await admin.fill(`input[aria-label='Front (Spanish) ${i + 1}']`, f);
    await admin.fill(`input[aria-label='Back (English) ${i + 1}']`, b);
  }
  await saveDraft(admin);
  // Preview before publishing: the draft renders for the admin
  const prev = watch(await actx.newPage(), "admin preview");
  await prev.goto(`${BASE}/admin/content/${cardsId}/preview`);
  await prev.waitForSelector("[data-testid=flashcard]:has-text('el perro')");
  await prev.close();
  await publish(admin);
  await check("7.1 · admin uploaded a song and a video, built a Memory Game and flashcards, previewed and published all four in one topic (Lower Elementary)", async () => {
    await admin.goto(`${BASE}/admin/topics/${topicId}`);
    const rows = admin.locator("[data-testid=topic-activity]");
    assert((await rows.count()) === 4, `topic has ${await rows.count()} activities`);
    assert((await admin.locator("[data-testid=topic-activity]:has-text('published v1')").count()) === 4, "not all four are published v1");
    const res = await db.libraryResource.findMany({ where: { id: { in: [songId, videoId, memoryId, cardsId] } }, include: { currentVersion: true } });
    assert(res.every((r) => r.status === "PUBLISHED" && r.grades.join() === "LOWER" && r.currentVersion?.number === 1), "DB status/grades/version wrong");
    const files = await db.libraryFile.findMany({ where: { id: { in: res.flatMap((r) => r.currentVersion.fileIds) } } });
    assert(files.length === 2 && files.every((f) => f.ready), "uploaded files missing or not ready");
    log("files:", files.map((f) => f.mime ?? f.mimeType ?? f.contentType).join(", "));
  });
  await check("3 · reorder activities in the topic (Manage Activities)", async () => {
    await admin.click(`button[aria-label='Move Flashcards: animales up']`);
    await admin.waitForFunction(() => document.querySelectorAll("[data-testid=topic-activity]")[2]?.textContent.includes("Flashcards"));
  });
  await shot(admin, "l01-manage-activities");

  // ════════════════ 7.2 Teacher: student, list, group, roster, topic preview ════════════════
  const tctx = await browser.newContext(desktop);
  const teacher = watch(await tctx.newPage(), "teacher");
  const temail = `teacher${stamp}@school.test`;
  await signUp(teacher, { name: "Ana Rivera", school: "Lincoln Elementary", email: temail });
  await check("6 · no welcome email before the email is verified", async () => {
    assert(emails(temail).filter((e) => e.subject === "Welcome to LextroSpeak!").length === 0, "welcome sent before verification");
  });
  await confirmEmail(teacher, temail);
  await check("6 · welcome email once on first verified access, teacher version with My Classes + dashboard link", async () => {
    const w = await waitFor(() => emails(temail).filter((e) => e.subject === "Welcome to LextroSpeak!"));
    assert(w.length === 1, `${w.length} welcome emails`);
    assert(w[0].body.includes("Hi Ana,") && w[0].body.includes("My Classes") && w[0].body.includes(`${BASE}/teacher`), "welcome body wrong");
  });
  await teacher.goto(`${BASE}/teacher`);
  await teacher.click("button:text-is('Sign out')");
  await teacher.waitForURL((u) => !u.pathname.startsWith("/teacher"));
  await signIn(teacher, temail);
  await check("6 · signing in again does not resend the welcome", async () => {
    await new Promise((r) => setTimeout(r, 800));
    assert(emails(temail).filter((e) => e.subject === "Welcome to LextroSpeak!").length === 1, "welcome resent");
  });

  await teacher.goto(`${BASE}/teacher/classes`);
  await teacher.fill("#name", "Spanish K-2");
  await teacher.click("text=Create class");
  await teacher.click("text=Spanish K-2");
  await teacher.waitForURL(/\/teacher\/classes\/[^/]+$/);
  const classUrl = teacher.url();
  const classId = classUrl.split("/").at(-1);
  const code = (await teacher.locator("span.font-mono").first().textContent()).trim();

  let diegoPin;
  await check("7.2 · Add Students menu offers Add Student, Add List and Create Group", async () => {
    await teacher.click("button:has-text('Add Students')");
    for (const t of ["Add Student", "Add List", "Create Group"]) await teacher.waitForSelector(`[role=menu] >> text=${t}`);
    await teacher.click("[role=menuitem]:has-text('Add Student')");
    await teacher.waitForURL(`${classUrl}/students/new`);
    diegoPin = await addStudent(teacher, classUrl, "Diego", { initial: "P" });
    assert(/^\d{4}$/.test(diegoPin), `PIN ${diegoPin}`);
  });

  let listSecrets = {};
  await check("7.2 · Add List: paste, preview, duplicate detected and fixed before saving", async () => {
    await teacher.goto(`${classUrl}/students/list`);
    await teacher.fill("#list", "Ana López\nLópez, Carlos\nAna López\nEva Martínez");
    await teacher.click("button:text-is('Preview')");
    await teacher.waitForSelector("[data-testid=list-row] >> nth=3");
    assert((await teacher.locator("button:has-text('Save 4 students')").isDisabled()), "save allowed with a duplicate");
    const dupText = await teacher.locator("[data-testid=list-row]").nth(2).textContent();
    assert(/repeated|duplicate|already/i.test(dupText), `duplicate not flagged: ${dupText}`);
    await teacher.click("button[aria-label='Remove row 3']");
    await teacher.click("button:text-is('Save 3 students')");
    await teacher.waitForSelector("h2:text-is('3 students added')");
    for (const tr of await teacher.locator("tbody tr").all()) {
      const tds = await tr.locator("td").allTextContents();
      listSecrets[tds[0].split(" ")[0]] = { username: tds[1], secret: tds[2] };
    }
    assert(Object.keys(listSecrets).sort().join() === "Ana,Carlos,Eva", `created ${Object.keys(listSecrets)}`);
  });

  await check("7.2 · Create Group with its own name, members picked from the roster, then edited", async () => {
    await teacher.goto(`${classUrl}/groups/new`);
    await teacher.fill("#group-name", "Los delfines");
    await teacher.check("label:has-text('Ana L.') input");
    await teacher.check("label:has-text('Eva M.') input");
    await teacher.click("button:text-is('Create group')");
    await teacher.waitForURL(classUrl);
    await teacher.click("a:has-text('Los delfines')");
    await teacher.waitForURL(/groups\/[^/]+$/);
    await teacher.fill("#group-name", "Los Delfines");
    await teacher.check("label:has-text('Carlos L.') input");
    await teacher.uncheck("label:has-text('Eva M.') input");
    await teacher.click("button:text-is('Save group')");
    await teacher.waitForURL(classUrl);
    await teacher.waitForSelector("a:has-text('Los Delfines') >> text=(2)");
  });

  let carlosPassword;
  await check("7.2 · Roster: edit name, username and Login Type; new password shown once; Reset PIN", async () => {
    await teacher.goto(`${classUrl}/roster`);
    const row = teacher.locator("[data-testid=roster-row]:has-text('Carlos')");
    await row.locator("button:text-is('Edit')").click();
    await teacher.fill("input[name=firstName]", "Carlitos");
    await teacher.fill("input[name=username]", `carlitos${stamp % 1000}`);
    await teacher.selectOption("select[name=loginType]", "PASSWORD");
    await teacher.click("button:text-is('Save')");
    carlosPassword = (await teacher.locator("[role=status]:has-text('Carlitos') [data-testid=new-secret]").textContent()).trim();
    assert(/^[a-z]+-[a-z]+-\d+$/.test(carlosPassword), `password ${carlosPassword}`);
    await teacher.waitForSelector(`[data-testid=roster-row]:has-text('carlitos${stamp % 1000}') >> text=password`);
    // No current password/PIN is ever shown in the roster
    const html = await teacher.content();
    assert(!html.includes(diegoPin) || !html.match(new RegExp(`>${diegoPin}<`)), "roster shows a PIN");
    const eva = teacher.locator("[data-testid=roster-row]:has-text('Eva')");
    await eva.locator("button:text-is('Reset PIN')").click();
    const evaPin = (await teacher.locator("[role=status]:has-text('Eva') [data-testid=new-secret]").textContent()).trim();
    assert(/^\d{4}$/.test(evaPin), "reset PIN");
    listSecrets.Eva.secret = evaPin;
  });
  await shot(teacher, "l02-roster");

  const topic = await db.topic.findUnique({ where: { id: topicId } });
  await check("7.2 · teacher Library shows the published topic for Lower Elementary and previews every activity", async () => {
    await teacher.goto(`${BASE}/teacher/library?grade=LOWER`);
    await teacher.waitForSelector(`text=${topicEs}`);
    await teacher.goto(`${BASE}/teacher/library/topics/${topic.slug}?grade=LOWER`);
    for (const t of ["Canción de los animales", "Video: el perro y el gato", "Memory: animales", "Flashcards: animales"]) await teacher.waitForSelector(`text=${t}`);
    await teacher.goto(`${BASE}/teacher/library/resources/${memoryId}`);
    // The teacher can try the game: play it to the end
    for (const pair of ["0", "1"]) {
      const tiles = teacher.locator(`[data-testid=memory-tile][data-pair='${pair}']`);
      await tiles.nth(0).click();
      await tiles.nth(1).click();
      await teacher.waitForTimeout(700);
    }
    await teacher.waitForSelector("text=¡Muy bien!");
    await teacher.goto(`${BASE}/teacher/library/resources/${songId}`);
    await teacher.waitForSelector("[data-testid=song-audio]");
    await teacher.goto(`${BASE}/teacher/library/resources/${videoId}`);
    await teacher.waitForSelector("[data-testid=video-file]");
  });
  await check("4 · draft content is not visible to teachers", async () => {
    const draftId = await newResource(admin, topicId, "PRINTABLE", "Draft worksheet (unpublished)");
    await teacher.goto(`${BASE}/teacher/library/topics/${topic.slug}`);
    assert(!(await teacher.locator("text=Draft worksheet").count()), "draft listed for teacher");
    const r = await denied(() => teacher.goto(`${BASE}/teacher/library/resources/${draftId}`));
    assert(r.status() === 404, `draft preview status ${r.status()}`);
    await db.topicResource.deleteMany({ where: { resourceId: draftId } });
  });

  // ════════════════ 7.3 Assign to a group and an individual ════════════════════════════════
  let taskId;
  await check("7.3 · Assign Task from the class: class preselected, group + individual, overlap counted once, Preview Task lists the real activities", async () => {
    await teacher.goto(classUrl);
    await teacher.click("main a:text-is('Assign Task')");
    await teacher.waitForURL(/\/teacher\/tasks\/assign\?classroomId=/);
    assert((await teacher.locator("#cls").inputValue()) === classId, "class not preselected");
    await teacher.check("label:has-text('Los Delfines') input");
    await teacher.check("fieldset:has(legend:text-is('Individual students')) label:has-text('Diego') input");
    await teacher.check("fieldset:has(legend:text-is('Individual students')) label:has-text('Ana') input"); // already in the group
    await teacher.waitForSelector("text=3 students will get this task.");
    await teacher.waitForSelector("text=1 selected student is already in a chosen group and will get it once.");
    await teacher.click("button:text-is('Next: choose a topic')");
    await teacher.click("button:text-is('Lower Elementary')");
    await teacher.selectOption("#cat", "Science");
    await teacher.fill("#tq", topicEs);
    const opts = teacher.locator("[data-testid=topic-option]");
    assert((await opts.count()) === 1, `${await opts.count()} topics match`);
    await opts.first().click();
    await teacher.waitForSelector(`h2:has-text('Preview Task · ${topicEs}')`);
    const acts = teacher.locator("input[aria-label^='Assign ']");
    assert((await acts.count()) === 4, `${await acts.count()} activities in preview`);
    // Open an activity from the preview in a new tab
    const [tab] = await Promise.all([tctx.waitForEvent("page"), teacher.click("a[href$='/teacher/library/resources/" + cardsId + "']")]);
    watch(tab, "teacher preview tab");
    await tab.waitForSelector("[data-testid=flashcard]");
    await tab.close();
    await teacher.uncheck("input[aria-label='Assign Video: el perro y el gato']");
    await teacher.click("button:text-is('Next: confirm')");
    await teacher.waitForSelector("text=Activities (3):");
    await shot(teacher, "l03-assign-confirm");
    await teacher.click("button:text-is('Assign Task')");
    await teacher.waitForURL(/\/teacher\/tasks\/[^/?]+\?new=1/);
    taskId = new URL(teacher.url()).pathname.split("/").at(-1);
    const who = await teacher.locator("[data-testid=task-students]").textContent();
    for (const n of ["Ana", "Carlitos", "Diego"]) assert(who.includes(n), `${n} missing from task summary`);
    assert(!who.includes("Eva"), "Eva should not have the task");
    const task = await db.assignment.findUnique({ where: { id: taskId }, include: { recipients: true, activities: true } });
    assert(task.activities.length === 3 && task.activities.every((a) => a.versionId), "activities not pinned");
    assert(task.recipients.filter((r) => r.studentId).length === 1, "Ana should be dropped as an individual recipient");
  });

  const progressBefore = {};
  await check("7.3 · each assigned student sees the task and opens its resources (PIN and password logins)", async () => {
    for (const [name, secret] of [["Diego", diegoPin], ["Carlitos", carlosPassword], ["Ana", listSecrets.Ana.secret]]) {
      const sctx = await browser.newContext(desktop);
      const s = await studentSignIn(sctx, code, name, secret);
      await s.click("[data-testid=student-task]");
      await s.waitForURL(/\/learn\/tasks\//);
      const links = await s.locator("[data-testid=student-activity]").evaluateAll((as) => as.map((a) => a.getAttribute("href")));
      assert(links.length === 3, `${name} sees ${links.length} activities`);
      for (const href of links) {
        await s.goto(`${BASE}${href}`);
        await s.waitForSelector("[data-testid=song-audio], [data-testid=memory-tile], [data-testid=flashcard]");
        if (await s.locator("[data-testid=memory-tile]").count()) {
          for (const pair of ["0", "1"]) {
            const tiles = s.locator(`[data-testid=memory-tile][data-pair='${pair}']`);
            await tiles.nth(0).click();
            await tiles.nth(1).click();
            await s.waitForTimeout(700);
          }
          await s.waitForSelector("text=¡Muy bien!");
        }
        if (await s.locator("[data-testid=song-audio]").count()) {
          const src = await s.locator("[data-testid=song-audio]").getAttribute("src");
          const r = await s.request.get(`${BASE}${src}`, { headers: { Range: "bytes=0-9" } });
          assert(r.status() === 206, `${name} song file ${r.status()}`);
        }
      }
      if (name === "Diego") progressBefore.links = links;
      await sctx.close();
    }
    const done = await db.activityProgress.count({ where: { activity: { assignmentId: taskId }, completedAt: { not: null } } });
    assert(done >= 3, `only ${done} completed activity records`);
  });

  await check("7.3 · a student without the task can't see it or open it, even with the direct links", async () => {
    const ectx = await browser.newContext(desktop);
    const e = await studentSignIn(ectx, code, "Eva", listSecrets.Eva.secret);
    assert((await e.locator("[data-testid=student-task]").count()) === 0, "Eva sees a task");
    await denied(async () => {
      const r1 = await e.goto(`${BASE}/learn/tasks/${taskId}`);
      assert(r1.status() === 404, `task page ${r1.status()}`);
      const r2 = await e.goto(`${BASE}${progressBefore.links[0]}`);
      assert(r2.status() === 404, `activity page ${r2.status()}`);
      const file = (await db.resourceVersion.findFirst({ where: { resourceId: songId } })).fileIds[0];
      const r3 = await e.request.get(`${BASE}/api/library/files/${file}`);
      assert([403, 404].includes(r3.status()), `file ${r3.status()}`);
    });
    await ectx.close();
  });

  // ════════════════ 7.4 Edit a flashcard, replace a game; old attempts stay ═════════════════
  await check("7.4 · admin edits a flashcard (v2) and replaces the Memory Game with a new Match game in the topic", async () => {
    await admin.goto(`${BASE}/admin/content/${cardsId}`);
    await admin.fill("input[aria-label='Back (English) 1']", "the puppy");
    await saveDraft(admin);
    await publish(admin, 2);
    const matchId = await newResource(admin, topicId, "GAME", "Match: animales", { gameType: "MATCH" });
    await fillPairs(admin, [["el perro", "the dog"], ["el gato", "the cat"], ["el pájaro", "the bird"]]);
    await saveDraft(admin);
    await publish(admin);
    await db.topicResource.deleteMany({ where: { topicId, resourceId: matchId } }); // so it can replace, not sit beside
    await admin.goto(`${BASE}/admin/topics/${topicId}`);
    const row = admin.locator("[data-testid=topic-activity]:has(a:text-is('Memory: animales'))");
    await row.locator("summary:text-is('More')").click();
    await row.locator("select[aria-label='Replace Memory: animales with']").selectOption({ label: "Game: Match: animales" });
    await row.locator("button:text-is('Replace')").click();
    await admin.waitForSelector("[data-testid=topic-activity]:has(a:text-is('Match: animales'))");
    assert(!(await admin.locator("[data-testid=topic-activity]:has(a:text-is('Memory: animales'))").count()), "memory still in topic");
    // Delete is refused while assigned; archive keeps access
    await admin.goto(`${BASE}/admin/content/${memoryId}`);
    await admin.click("button:text-is('Delete from Library')");
    await admin.click("button:text-is('Yes, delete')");
    await admin.waitForSelector("text=/archive/i");
    assert(await db.libraryResource.findUnique({ where: { id: memoryId } }), "assigned resource was deleted");
    await admin.click("button:text-is('Archive')");
    await admin.waitForSelector("text=archived");
  });

  await check("7.4 · the new version is assignable; earlier students keep their pinned version and progress", async () => {
    await teacher.goto(`${BASE}/teacher/tasks/assign?classroomId=${classId}&topicId=${topicId}`);
    await teacher.check("fieldset:has(legend:text-is('Individual students')) label:has-text('Eva') input");
    await teacher.click("button:text-is('Next: choose a topic')");
    await teacher.waitForSelector(`h2:has-text('Preview Task · ${topicEs}')`);
    assert(await teacher.locator("input[aria-label='Assign Match: animales']").count(), "new game not offered");
    assert(!(await teacher.locator("input[aria-label='Assign Memory: animales']").count()), "replaced game still offered");
    await teacher.click("button:text-is('Next: confirm')");
    await teacher.click("button:text-is('Assign Task')");
    await teacher.waitForURL(/\/teacher\/tasks\/[^/?]+\?new=1/);

    const ectx = await browser.newContext(desktop);
    const e = await studentSignIn(ectx, code, "Eva", listSecrets.Eva.secret);
    await e.click("[data-testid=student-task]");
    await e.click("[data-testid=student-activity]:has-text('Flashcards')");
    await e.click("[data-testid=flashcard]");
    await e.waitForSelector("[data-testid=flashcard]:has-text('the puppy')");
    await ectx.close();

    const dctx = await browser.newContext(desktop);
    const d = await studentSignIn(dctx, code, "Diego", diegoPin);
    await d.goto(`${BASE}/learn/tasks/${taskId}`);
    await d.waitForSelector("[data-testid=student-activity]:has-text('Memory: animales') [aria-label=Done]");
    await d.click("[data-testid=student-activity]:has-text('Memory: animales')");
    await d.waitForSelector("[data-testid=memory-tile]");
    await d.goto(`${BASE}/learn/tasks/${taskId}`);
    await d.click("[data-testid=student-activity]:has-text('Flashcards')");
    await d.click("[data-testid=flashcard]");
    await d.waitForSelector("[data-testid=flashcard]:has-text('the dog')"); // pinned v1
    await dctx.close();
    await teacher.goto(`${BASE}/teacher/tasks/${taskId}`);
    await teacher.waitForSelector("text=Memory: animales");
  });

  // ════════════════ 7.5 Billing emails through signed Stripe webhooks (test mode) ════════════
  const tuser = await db.user.findUnique({ where: { email: temail } });
  const sub = `sub_e2e_${stamp}`, cus = `cus_e2e_${stamp}`, inv = `in_e2e_${stamp}`;
  const now = Math.floor(Date.now() / 1000);
  async function webhook(event) {
    const payload = JSON.stringify(event);
    const header = Stripe.webhooks.generateTestHeaderString({ payload, secret: WHSEC });
    const r = await fetch(`${BASE}/api/billing/webhook`, { method: "POST", headers: { "content-type": "application/json", "stripe-signature": header }, body: payload });
    return r.status;
  }
  const evt = (id, type, object, previous) => ({ id, object: "event", type, created: now, livemode: false, api_version: "2025-02-24.acacia", data: { object, ...(previous ? { previous_attributes: previous } : {}) } });
  const billing = () => emails(temail).filter((e) => /subscription|Payment received/.test(e.subject));

  await check("7.5 · bad webhook signature is refused", async () => {
    const r = await fetch(`${BASE}/api/billing/webhook`, { method: "POST", headers: { "content-type": "application/json", "stripe-signature": "t=1,v1=bad" }, body: "{}" });
    assert(r.status === 400, `bad signature got ${r.status}`);
  });
  await check("7.5 · activation + first payment of the same purchase → ONE email with Manage Subscription and receipt link; retries don't duplicate", async () => {
    const subObj = { id: sub, object: "subscription", customer: cus, status: "active", metadata: { userId: tuser.id }, items: { data: [{ price: { id: "price_test" }, current_period_start: now, current_period_end: now + 2592000 }] } };
    assert((await webhook(evt(`evt_a_${stamp}`, "checkout.session.completed", { id: `cs_${stamp}`, object: "checkout.session", mode: "subscription", payment_status: "paid", customer: cus, subscription: sub, client_reference_id: tuser.id }))) === 200, "checkout");
    assert((await webhook(evt(`evt_b_${stamp}`, "customer.subscription.created", subObj))) === 200, "sub created");
    const invoice = { id: inv, object: "invoice", customer: cus, subscription: sub, billing_reason: "subscription_create", amount_paid: 900, currency: "usd", hosted_invoice_url: "https://invoice.stripe.com/i/test_receipt", status_transitions: { paid_at: now } };
    assert((await webhook(evt(`evt_c_${stamp}`, "invoice.paid", invoice))) === 200, "invoice.paid");
    assert((await webhook(evt(`evt_c_${stamp}`, "invoice.paid", invoice))) === 200, "retry same event");
    assert((await webhook(evt(`evt_d_${stamp}`, "invoice.payment_succeeded", invoice))) === 200, "sibling event");
    const got = await waitFor(() => billing().length >= 1 && billing(), 5000);
    await new Promise((r) => setTimeout(r, 800));
    assert(billing().length === 1, `${billing().length} billing emails`);
    assert(got[0].subject === "Your LextroSpeak subscription is active — payment received", got[0].subject);
    assert(got[0].body.includes("Manage Subscription") && got[0].body.includes("/teacher/billing") && got[0].body.includes("https://invoice.stripe.com/i/test_receipt") && got[0].body.includes("$9.00"), "combined email body");
    const s = await db.subscription.findUnique({ where: { id: sub } });
    assert(s?.status === "active", "subscription not active");
  });
  await check("7.5 · renewal payment → payment email (once); reactivation → activation email (once)", async () => {
    const renewal = { id: `${inv}_2`, object: "invoice", customer: cus, subscription: sub, billing_reason: "subscription_cycle", amount_paid: 900, currency: "usd", hosted_invoice_url: "https://invoice.stripe.com/i/test_receipt_2" };
    await webhook(evt(`evt_e_${stamp}`, "invoice.paid", renewal));
    await webhook(evt(`evt_e2_${stamp}`, "invoice.paid", renewal));
    const back = { id: sub, object: "subscription", customer: cus, status: "active", current_period_start: now + 10, metadata: { userId: tuser.id } };
    await webhook(evt(`evt_f_${stamp}`, "customer.subscription.updated", back, { status: "past_due" }));
    await webhook(evt(`evt_f2_${stamp}`, "customer.subscription.updated", back, { status: "past_due" }));
    await new Promise((r) => setTimeout(r, 1000));
    const subj = billing().map((e) => e.subject);
    assert(subj.filter((s) => s === "Payment received — thank you!").length === 1, `payment emails: ${subj}`);
    assert(subj.filter((s) => s === "Your LextroSpeak subscription is active").length === 1, `activation emails: ${subj}`);
  });
  await check("7.5 · Billing page shows the active plan with Manage Subscription", async () => {
    await teacher.goto(`${BASE}/teacher/billing`);
    await teacher.waitForSelector("text=/active/i");
    await teacher.waitForSelector("button:has-text('Manage Subscription'), a:has-text('Manage Subscription')");
  });

  // ════════════════ 5 · admin:grant server process ═══════════════════════════════════════════
  await check("5 · admin:grant: unverified → verification sent; verified → promoted; no account → invitation", async () => {
    const env = { ...process.env, EMAIL_DRIVER: "console", APP_URL: BASE };
    const grant = (email) => execFileSync("npm", ["run", "-s", "admin:grant", "--", email], { env, encoding: "utf8" });
    const gctx = await browser.newContext(desktop);
    const g = watch(await gctx.newPage(), "grant");
    const gemail = `grant${stamp}@school.test`;
    await signUp(g, { name: "Gina Grant", school: "Grant School", email: gemail });
    const sent = grant(gemail);
    assert(sent.includes("→ verification_sent"), "unverified grant");
    const fresh = sent.match(/https?:\/\/\S+\/verify-email\/\S+/)?.[0]; // the script's own email (newest link)
    assert(fresh, "no verification link from admin:grant");
    const out = grant(`invite${stamp}@school.test`);
    assert(out.includes("→ invited") && /admin-invite\//.test(out), "invite");
    // The invitation creates a verified admin account and opens the admin panel (welcome email once)
    const inviteLink = out.match(/https?:\/\/\S+\/admin-invite\/\S+/)[0].replace(/^https?:\/\/[^/]+/, BASE);
    const ictx = await browser.newContext(desktop);
    const ip = watch(await ictx.newPage(), "invitee");
    await ip.goto(inviteLink);
    await ip.fill("#displayName", "Ivy Invite");
    await ip.fill("#password", "correct-horse-42");
    await ip.fill("#confirm", "correct-horse-42");
    await ip.click("button:text-is('Set up my admin access')");
    await ip.waitForURL(`${BASE}/admin`);
    assert((await waitFor(() => emails(`invite${stamp}@school.test`).filter((e) => e.subject === "Welcome to LextroSpeak!").length)) === 1, "invitee welcome");
    const again = await denied(() => ip.goto(inviteLink));
    assert(!(await ip.locator("button:text-is('Set up my admin access')").count()), `invite link reusable (${again.status()})`);
    await ictx.close();
    await g.goto(fresh.replace(/^https?:\/\/[^/]+/, BASE));
    await g.click("button:text-is('Confirm my email')");
    await g.waitForSelector("text=Your email is confirmed");
    await g.goto(`${BASE}/admin`);
    assert(g.url() === `${BASE}/admin`, `granted user landed on ${g.url()}`);
    assert(grant(gemail).includes("→ already"), "already admin");
    await gctx.close();
  });

  // ════════════════ Permissions ═══════════════════════════════════════════════════════════
  await check("5 · teachers and students can't reach admin pages, admin actions or uploads", async () => {
    await teacher.goto(`${BASE}/admin/content`);
    assert(teacher.url().startsWith(`${BASE}/teacher`), `teacher reached ${teacher.url()}`);
    assert(!(await teacher.locator("nav a:text-is('Admin')").count()), "teacher sees Admin nav");
    const up = await denied(() => teacher.request.post(`${BASE}/api/library/files`, { data: { name: "x.png", size: 10, mime: "image/png" }, headers: { origin: BASE } }));
    assert(up.status() === 403, `teacher upload start ${up.status()}`);
    const sctx = await browser.newContext(desktop);
    const s = await studentSignIn(sctx, code, "Diego", diegoPin);
    await s.goto(`${BASE}/admin`);
    assert(!s.url().includes("/admin"), `student reached ${s.url()}`);
    await sctx.close();
  });
  await check("1 · another teacher can't open this class, its roster or its task", async () => {
    const octx = await browser.newContext(desktop);
    const o = watch(await octx.newPage(), "other teacher");
    await signUp(o, { name: "Otto Other", school: "Other School", email: `other${stamp}@school.test` });
    await denied(async () => {
      for (const u of [classUrl, `${classUrl}/roster`, `${classUrl}/students/list`, `${BASE}/teacher/tasks/${taskId}`]) {
        const r = await o.goto(u);
        assert(r.status() === 404, `${u} → ${r.status()}`);
      }
    });
    await octx.close();
  });

  // ════════════════ 7.6 iPad (portrait + landscape): routes, buttons, forms, layout ══════════
  const ipad = devices["iPad (gen 7)"] ?? { viewport: { width: 810, height: 1080 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 };
  for (const [label, opts] of [["iPad portrait", { ...ipad }], ["iPad landscape", { ...ipad, viewport: { width: ipad.viewport.height, height: ipad.viewport.width } }]]) {
    await check(`7.6 · ${label}: teacher, admin and student routes render without horizontal scroll or console errors`, async () => {
      const state = { teacher: await tctx.storageState(), admin: await actx.storageState() };
      const routes = {
        teacher: ["/teacher", "/teacher/classes", classUrl.replace(BASE, ""), `${classUrl.replace(BASE, "")}/roster`, `${classUrl.replace(BASE, "")}/students/new`, `${classUrl.replace(BASE, "")}/students/list`, `${classUrl.replace(BASE, "")}/groups/new`, "/teacher/library", `/teacher/library/topics/${topic.slug}`, `/teacher/tasks/assign?classroomId=${classId}`, `/teacher/tasks/${taskId}`, "/teacher/billing"],
        admin: ["/admin", "/admin/content", "/admin/content/new", `/admin/content/${cardsId}`, "/admin/topics", `/admin/topics/${topicId}`],
      };
      for (const who of ["teacher", "admin"]) {
        const c = await browser.newContext({ ...opts, storageState: state[who] });
        const p = watch(await c.newPage(), `${label} ${who}`);
        for (const r of routes[who]) {
          const res = await p.goto(`${BASE}${r}`);
          assert(res.status() === 200, `${who} ${r} → ${res.status()}`);
          const over = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
          assert(over <= 1, `${who} ${r} scrolls sideways by ${over}px`);
        }
        if (who === "teacher") {
          // Buttons and forms by touch: Add Students menu, wizard step 1 → 2
          await p.goto(classUrl);
          await p.tap("button:has-text('Add Students')");
          await p.waitForSelector("[role=menu]");
          await p.goto(`${BASE}/teacher/tasks/assign?classroomId=${classId}`);
          await p.tap("fieldset:has(legend:text-is('Individual students')) label:has-text('Diego')");
          await p.tap("button:text-is('Next: choose a topic')");
          await p.waitForSelector("[data-testid=topic-option]");
          await shot(p, `l04-${label.replace(" ", "-")}-assign`);
        }
        await c.close();
      }
      const sc = await browser.newContext(opts);
      const s = await studentSignIn(sc, code, "Ana", listSecrets.Ana.secret);
      await s.tap("[data-testid=student-task]");
      await s.waitForURL(/\/learn\/tasks\//);
      await s.tap("[data-testid=student-activity]:has-text('Flashcards')");
      await s.tap("[data-testid=flashcard]");
      await s.waitForSelector("[data-testid=flashcard]:has-text('the dog')");
      const over = await s.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      assert(over <= 1, `student activity scrolls sideways by ${over}px`);
      await shot(s, `l05-${label.replace(" ", "-")}-student`);
      await sc.close();
    });
  }

  await check("7.6 · no console errors on any page during the run", async () => {
    assert(consoleErrors.length === 0, `console errors:\n${consoleErrors.join("\n")}`);
  });

  console.log(`\nLEXTROSPEAK E2E PASSED (${results.length} checks)`);
} catch (e) {
  console.error("\nLEXTROSPEAK E2E FAILED:", e.message);
  if (consoleErrors.length) console.error("console errors so far:\n" + consoleErrors.join("\n"));
  exit = 1;
} finally {
  await browser.close();
  await db.$disconnect();
  process.exit(exit);
}
