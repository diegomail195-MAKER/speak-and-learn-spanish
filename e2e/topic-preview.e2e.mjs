// Topic Preview (Platform Admin and teachers) and the student's journey through a Topic:
//  - Preview: free navigation (Previous / Next at the sides, below on phones, the resource list,
//    ?step= on the URL), real players, restart, a resource that fails to load (error + Retry)
//    and nothing recorded; server checks (students, teachers on the admin scope, drafts).
//  - Student View keeps the student's locks.
//  - Student: starts at step 1 with the next ones locked, resumes after a reload, direct links to
//    later steps stay locked (lesson URL, activity URL), completion only on the real criterion,
//    final screen (Repeat an activity, Repeat this Topic, Continue with my assignments), new
//    attempts recorded without losing the completion, an assignment created "before" with partial
//    progress, a single-resource topic and the "all done" state.
// Server: npm run build && EMAIL_DRIVER=console npx next start -p 3100
// Run:    BASE_URL=http://localhost:3100 SCREENSHOTS=/tmp/shots node e2e/topic-preview.e2e.mjs
import { chromium, devices } from "playwright";
import path from "node:path";
import bcrypt from "bcryptjs";
import prismaPkg from "@prisma/client";

const { PrismaClient } = prismaPkg;
const db = new PrismaClient();
const BASE = process.env.BASE_URL ?? "http://localhost:3100";
const SHOTS = process.env.SCREENSHOTS;
const stamp = Date.now();
const log = (...a) => console.log("•", ...a);
const assert = (c, m) => {
  if (!c) throw new Error(m);
};
const shot = async (p, name, full = false) => {
  if (!SHOTS) return;
  await p.waitForTimeout(300);
  await p.screenshot({ path: path.join(SHOTS, `${name}.png`), fullPage: full });
};
const errors = [];
const watch = (p) => (p.on("pageerror", (e) => errors.push(`${p.url()}: ${e.message.slice(0, 160)}`)), p);
const PASSWORD = "correct-horse-42";

// ── Data ──
const hash = await bcrypt.hash(PASSWORD, 10);
const pinHash = await bcrypt.hash("1234", 10);
const school = await db.school.create({ data: { name: `Preview School ${stamp % 10000}` } });
async function teacherUser(name, email, role) {
  const u = await db.user.create({ data: { schoolId: school.id, role, email, passwordHash: hash, displayName: name, emailVerifiedAt: new Date(), welcomeSentAt: new Date() } });
  const t = await db.teacher.create({ data: { userId: u.id, schoolId: school.id } });
  return { user: u, teacher: t, email };
}
const admin = await teacherUser("Diego Admin", `pv-admin-${stamp}@lextro.test`, "ADMIN");
const teacher = await teacherUser("Bea Teacher", `pv-teacher-${stamp}@lextro.test`, "TEACHER");
const classroom = await db.classroom.create({ data: { schoolId: school.id, teacherId: teacher.teacher.id, name: "LE1", code: `P${(stamp % 1e6).toString(36).toUpperCase()}`.slice(0, 6).padEnd(6, "Z") } });
async function student(first) {
  const u = await db.user.create({ data: { schoolId: school.id, role: "STUDENT", displayName: first } });
  return db.student.create({ data: { userId: u.id, schoolId: school.id, classroomId: classroom.id, firstName: first, username: first.toLowerCase(), pinHash } });
}
const ana = await student("Ana");
const beto = await student("Beto");

const greetings = await db.topic.findUniqueOrThrow({ where: { slug: "greetings" }, include: { resources: { orderBy: { position: "asc" }, include: { resource: true } } } });
const byTitle = (t) => greetings.resources.find((r) => r.resource.title === t).resource;
const STEPS = ["Greetings Flashcards", "Picture Match", "Picture Dictionary"];
// A single-resource topic (Worksheet only), published.
const solo = await db.topic.create({ data: { slug: `solo-${stamp}`, titleEs: "Solo una hoja", titleEn: "Just one sheet", color: "#7FD1AE", art: greetings.art, status: "PUBLISHED" } });
await db.topicResource.create({ data: { topicId: solo.id, resourceId: byTitle("Write the Word").id, position: 0 } });
// A draft topic: teachers can't preview it.
const draft = await db.topic.create({ data: { slug: `draft-${stamp}`, titleEs: "Borrador", titleEn: "Draft", status: "DRAFT" } });

async function assign(topic, titles, who, createdAt = new Date()) {
  const steps = titles.map((t, i) => {
    const r = (topic.resources ?? greetings.resources).find((x) => x.resource.title === t)?.resource ?? byTitle(t);
    return { resourceId: r.id, versionId: r.currentVersionId, position: i };
  });
  return db.assignment.create({
    data: {
      schoolId: school.id,
      teacherId: teacher.teacher.id,
      topicId: topic.id,
      title: `${topic.titleEs} · ${topic.titleEn}`,
      createdAt,
      recipients: { create: who.map((s) => ({ type: "STUDENT", studentId: s.id })) },
      activities: { create: steps },
    },
    include: { activities: { orderBy: { position: "asc" } } },
  });
}
// Ana: the whole sequence, then the single-resource topic (due later, so it comes next).
const taskA = await assign(greetings, STEPS, [ana]);
await db.assignment.update({ where: { id: taskA.id }, data: { dueAt: new Date(Date.now() + 86400000) } });
const taskSolo = await assign(solo, ["Write the Word"], [ana]);
await db.assignment.update({ where: { id: taskSolo.id }, data: { dueAt: new Date(Date.now() + 2 * 86400000) } });
// Beto: an assignment from "before this change" with the first step already finished.
const taskB = await assign(greetings, STEPS, [beto], new Date(Date.now() - 7 * 86400000));
await db.activityProgress.create({ data: { activityId: taskB.activities[0].id, studentId: beto.id, completedAt: new Date(Date.now() - 6 * 86400000), score: 8, total: 8 } });

const counts = async () => ({ progress: await db.activityProgress.count(), attempts: await db.studentAttempt.count(), responses: await db.studentResponse.count() });
const completed = (assignmentId, studentId) => db.activityProgress.findMany({ where: { activity: { assignmentId }, studentId, completedAt: { not: null } } });

const browser = await chromium.launch({ args: ["--autoplay-policy=no-user-gesture-required"] });
async function signedIn(email, opts = { viewport: { width: 1440, height: 1000 } }) {
  const ctx = await browser.newContext({ locale: "en-US", ...opts });
  const p = watch(await ctx.newPage());
  await p.goto(`${BASE}/login`);
  await p.fill("#email", email);
  await p.fill("#password", PASSWORD);
  await p.click("button[type=submit]");
  await p.waitForURL(`${BASE}/teacher`);
  return { ctx, p };
}
async function studentIn(name, opts = { viewport: { width: 1280, height: 900 } }) {
  const ctx = await browser.newContext({ locale: "en-US", ...opts });
  const s = watch(await ctx.newPage());
  await s.addInitScript(() => localStorage.setItem("lextro-lesson-voice", "off"));
  await s.goto(`${BASE}/student/${classroom.code}`);
  await s.click(`button:has-text('${name}')`);
  for (const d of "1234") await s.click(`button:text-is('${d}')`);
  await s.click("text=Go!");
  await s.waitForURL(`${BASE}/learn`);
  return { ctx, s };
}
const stepCount = async (p, id = "preview-step-count") => (await p.getByTestId(id).first().textContent()).replace(/\s+/g, " ").trim();
const states = (p) => p.getByTestId("lesson-step-icon").evaluateAll((els) => els.map((e) => e.getAttribute("data-state")));

async function playFlashcards(p) {
  await p.getByTestId("flashcard").first().waitFor();
  const n = Number((await p.locator("text=/^1 \\/ \\d+$/").first().textContent()).split("/")[1]);
  for (let i = 1; i < n; i++) await p.getByRole("button", { name: "Next card" }).first().click();
}
async function playMatch(p) {
  await p.getByTestId("match-picture").first().waitFor();
  for (let round = 0; round < 10 && (await p.locator("[data-testid=match-picture]:not([disabled])").count()); round++) {
    const pairs = await p.locator("[data-testid=match-picture]:not([disabled])").evaluateAll((els) => els.map((e) => e.getAttribute("data-pair")));
    for (const pair of pairs) {
      await p.locator(`[data-testid=match-picture][data-pair='${pair}']`).click();
      await p.locator(`[data-testid=match-word][data-pair='${pair}']`).click();
    }
    await p.waitForTimeout(900);
  }
}
const nextEnabled = (p) => p.waitForFunction(() => !document.querySelector("[data-testid=lesson-next]")?.disabled, null, { timeout: 20000 });

try {
  const total = greetings.resources.filter((r) => r.resource.status !== "ARCHIVED").length;
  const before = await counts();

  // ── Administrator: Preview from Platform Admin › Topics ──
  const { p: a } = await signedIn(admin.email);
  await a.goto(`${BASE}/admin/topics`);
  await a.getByTestId("topic-preview").first().waitFor();
  await a.goto(`${BASE}/admin/topics/${greetings.id}/preview`);
  await a.getByTestId("preview-view").waitFor();
  assert((await a.getByTestId("preview-badge").textContent()).includes("Preview · Admin / Teacher"), "badge");
  await a.getByTestId("preview-exit").waitFor();
  assert((await stepCount(a)) === `Paso 1 de ${total} · Step 1 of ${total}`, `count ${await stepCount(a)}`);
  assert(await a.getByTestId("preview-prev").isDisabled(), "Previous enabled on the first resource");
  const [pb, panel, nb] = [await a.getByTestId("preview-prev").boundingBox(), await a.getByTestId("preview-intro").boundingBox(), await a.getByTestId("preview-next").boundingBox()];
  assert(pb.x + pb.width <= panel.x && nb.x >= panel.x + panel.width, "Previous/Next are not at the sides of the panel");
  await shot(a, "pv01-admin-intro");
  await a.getByTestId("preview-next").click();
  assert((await stepCount(a)).startsWith("Paso 2 de"), "Next");
  assert(new URL(a.url()).searchParams.get("step") === "2", "step on the URL");
  await a.getByTestId("preview-prev").click();
  assert((await stepCount(a)).startsWith("Paso 1 de"), "Previous");
  // Jump to the last resource from the strip: Next disabled.
  await a.getByTestId("preview-strip-item").last().click();
  assert((await stepCount(a)) === `Paso ${total} de ${total} · Step ${total} of ${total}`, "last");
  assert(await a.getByTestId("preview-next").isDisabled(), "Next enabled on the last resource");
  // The resource list → Flashcards; play it, completion is shown but not saved, restart.
  await a.getByTestId("preview-list-button").click();
  assert((await a.getByTestId("preview-list-item").count()) === total, "list shows every resource");
  await shot(a, "pv02-admin-list");
  await a.getByTestId("preview-list-item").filter({ hasText: "Greetings Flashcards" }).click();
  await a.getByTestId("preview-start").click();
  await playFlashcards(a);
  await a.getByTestId("preview-reached").waitFor();
  await shot(a, "pv03-admin-flashcards");
  await a.getByTestId("preview-restart").click();
  await a.waitForTimeout(400);
  assert((await a.getByTestId("preview-reached").count()) === 0, "restart keeps the completion");
  await a.locator("text=/^1 \\/ \\d+$/").first().waitFor();
  // Every type opens with its real player: game, worksheet (I finished), song.
  for (const t of ["Picture Match", "Picture Dictionary", "Greetings Chant", "Memory Game", "Listen & Find"]) {
    await a.getByTestId("preview-list-button").click();
    await a.getByTestId("preview-list-item").filter({ hasText: t }).click();
    await a.getByTestId("preview-start").click();
    await a.locator("[data-testid=preview-activity] [data-testid=preview-loading]").waitFor({ state: "detached" });
    assert((await a.getByTestId("preview-error").count()) === 0, `${t} failed to load`);
  }
  await a.getByTestId("preview-list-button").click();
  await a.getByTestId("preview-list-item").filter({ hasText: "Picture Dictionary" }).click();
  await a.getByTestId("preview-start").click();
  await a.getByTestId("activity-finished").click();
  await a.getByTestId("preview-reached").waitFor();
  // A resource that fails to load: error + Retry; the others keep working.
  let fail = true;
  await a.route("**/api/topics/*/preview?*", (r) => (fail && r.request().url().includes(encodeURIComponent(`r:${byTitle("Write the Word").id}`)) ? r.fulfill({ status: 500, body: JSON.stringify({ error: "Simulated failure." }) }) : r.continue()));
  const wIndex = greetings.resources.filter((r) => r.resource.status !== "ARCHIVED").findIndex((r) => r.resource.title === "Write the Word") + 1;
  await a.goto(`${BASE}/admin/topics/${greetings.id}/preview?step=${wIndex}`);
  await a.getByTestId("preview-error").waitFor();
  await shot(a, "pv04-admin-error");
  await a.getByTestId("preview-prev").click();
  assert((await a.getByTestId("preview-error").count()) === 0, "the error stays on the failing resource only");
  await a.getByTestId("preview-next").click();
  fail = false;
  await a.getByTestId("preview-retry").click();
  await a.getByTestId("preview-start").waitFor();
  await a.waitForFunction(() => !document.querySelector("[data-testid=preview-error]"));
  log(`admin: Preview of «Los saludos», ${total} resources, Previous/Next at the sides (disabled at the ends), list, strip, real players, restart, error + Retry`);
  const after = await counts();
  assert(JSON.stringify(before) === JSON.stringify(after), `Preview recorded something: ${JSON.stringify(before)} → ${JSON.stringify(after)}`);
  log("Preview recorded nothing (progress, attempts, answers unchanged)");

  // ── Teacher: Preview from the Library; drafts and the admin scope are refused on the server ──
  const { p: t } = await signedIn(teacher.email);
  await t.goto(`${BASE}/teacher/library`);
  await t.locator("li:has(a[href*='/topics/greetings'])").first().getByTestId("topic-preview").click();
  await t.waitForURL(/\/topics\/greetings\/preview/);
  await t.getByTestId("preview-view").waitFor();
  const tTotal = await t.getByTestId("preview-strip-item").count();
  assert((await stepCount(t)) === `Paso 1 de ${tTotal} · Step 1 of ${tTotal}`, "teacher count");
  await t.goto(`${BASE}/teacher/library/topics/greetings/preview?step=3`);
  assert((await stepCount(t)).startsWith(`Paso 3 de ${tTotal}`), "?step=3 opens the third resource");
  await t.getByTestId("preview-next").click();
  await t.getByTestId("preview-start").click();
  await t.locator("[data-testid=preview-activity] [data-testid=preview-loading]").waitFor({ state: "detached" });
  await shot(t, "pv05-teacher-activity");
  const api = (u) => t.evaluate((url) => fetch(url).then((r) => r.status), u);
  const key = encodeURIComponent(`r:${byTitle("Picture Match").id}`);
  assert((await api(`/api/topics/${greetings.id}/preview?key=${key}`)) === 200, "teacher reads a published topic");
  assert((await api(`/api/topics/${greetings.id}/preview?key=${key}&scope=admin`)) === 403, "teacher on the admin scope");
  assert((await api(`/api/topics/${draft.id}/preview?key=${key}`)) === 404, "teacher on a draft topic");
  assert((await api(`/api/topics/${solo.id}/preview?key=${key}`)) === 404, "a resource of another topic");
  await t.goto(`${BASE}/admin/topics/${greetings.id}/preview`);
  assert(!t.url().includes("/admin/"), "teacher opened the admin preview");
  log("teacher: Preview from the Library row, ?step=, server refuses the admin scope (403), drafts and other topics' resources (404)");

  // Single-resource topic: both buttons disabled.
  await t.goto(`${BASE}/teacher/library/topics/${solo.slug}/preview`);
  assert((await stepCount(t)) === "Paso 1 de 1 · Step 1 of 1", "solo count");
  assert((await t.getByTestId("preview-prev").isDisabled()) && (await t.getByTestId("preview-next").isDisabled()), "single resource: both disabled");
  log("single-resource topic: 1 of 1, Previous and Next disabled");

  // Student View keeps the student's locks.
  await t.goto(`${BASE}/teacher/library/topics/greetings/student-view`);
  await t.getByTestId("student-view-banner").waitFor();
  const svStates = await states(t);
  assert(svStates[0] === "current" && svStates.slice(1).every((x) => x === "locked"), `Student View locks: ${svStates}`);
  await t.getByTestId("lesson-start").click();
  assert(await t.getByTestId("lesson-next").isDisabled(), "Student View: Next before finishing");
  await shot(t, "pv06-student-view-locked");
  log("Student View: future steps locked, Next only after finishing (different from Preview)");

  // Phone: Previous / Next below the panel.
  const { p: m } = await signedIn(teacher.email, { ...devices["iPhone 13"] });
  await m.goto(`${BASE}/teacher/library/topics/greetings/preview?step=2`);
  await m.getByTestId("preview-nav-mobile").waitFor();
  const [mp, mn] = [await m.getByTestId("preview-intro").boundingBox(), await m.getByTestId("preview-nav-mobile").boundingBox()];
  assert(mn.y >= mp.y + mp.height, "phone: buttons below the panel");
  assert(await m.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), "phone: sideways scroll");
  await shot(m, "pv07-phone-preview", true);
  log("phone: Previous / Next below the panel, no sideways scroll");

  // ── Student who starts ──
  const { s } = await studentIn("Ana");
  await s.getByTestId("student-task").first().waitFor();
  await s.goto(`${BASE}/learn/tasks/${taskA.id}`);
  await s.locator("[data-testid=topic-lesson][data-phase=intro][data-step='0']").waitFor();
  let st = await states(s);
  assert(st[0] === "current" && st.slice(1).every((x) => x === "locked"), `start locks ${st}`);
  await shot(s, "pv08-student-start");
  // Direct links to a later step: the lesson URL and the activity URL.
  await s.goto(`${BASE}/learn/tasks/${taskA.id}?step=3`);
  await s.getByTestId("lesson-notice").waitFor();
  await s.locator("[data-testid=topic-lesson][data-phase=intro][data-step='0']").waitFor();
  await s.goto(`${BASE}/learn/tasks/${taskA.id}/${taskA.activities[2].id}`);
  await s.waitForURL(`${BASE}/learn/tasks/${taskA.id}`);
  log("student starts: step 1 open, the rest locked; ?step=3 and the activity URL of step 3 stay locked");
  await s.getByTestId("lesson-start").click();
  assert(await s.getByTestId("lesson-next").isDisabled(), "Next before finishing");
  await playFlashcards(s);
  await nextEnabled(s);
  await s.waitForTimeout(800);
  await s.reload();
  await s.locator("[data-testid=topic-lesson][data-phase=intro][data-step='1']").waitFor();
  st = await states(s);
  assert(st[0] === "done" && st[1] === "current" && st[2] === "locked", `after reload ${st}`);
  log("resume: after finishing step 1 and reloading, the lesson opens step 2");
  await s.getByTestId("lesson-start").click();
  await playMatch(s);
  await nextEnabled(s);
  await s.getByTestId("lesson-next").click();
  await s.getByTestId("lesson-start").click();
  await s.waitForTimeout(500);
  assert(await s.getByTestId("lesson-next").isDisabled(), "opening the worksheet counted as finishing it");
  await shot(s, "pv09-student-worksheet");
  await s.getByTestId("activity-finished").click();
  await nextEnabled(s);
  await s.getByTestId("lesson-next").click();
  await s.getByTestId("lesson-final").waitFor();
  for (const id of ["lesson-practice", "lesson-repeat-topic", "lesson-next-assignment"]) await s.getByTestId(id).waitFor();
  await shot(s, "pv10-student-final");
  const doneA = await completed(taskA.id, ana.id);
  assert(new Set(doneA.map((x) => x.activityId)).size === 3, `${doneA.length} steps recorded`);
  log("student finishes: worksheet needs «I finished», final screen with the three options, 3 of 3 recorded");

  // Repeat an activity: a new attempt, the completion stays.
  await s.getByTestId("lesson-practice").click();
  assert((await s.getByTestId("practice-item").count()) === 3, "repeat menu");
  await s.getByTestId("practice-item").filter({ hasText: "Greetings Flashcards" }).click();
  await playFlashcards(s);
  await s.waitForTimeout(1000);
  assert((await completed(taskA.id, ana.id)).length === 4, "repeat recorded as a new attempt");
  await s.getByTestId("lesson-back-menu").click();
  await s.getByRole("button", { name: /Volver · Back/ }).click();
  // Repeat this Topic: from the first step, locks again, attempts recorded.
  await s.getByTestId("lesson-repeat-topic").click();
  await s.locator("[data-testid=topic-lesson][data-phase=intro][data-step='0']").waitFor();
  st = await states(s);
  assert(st[0] === "current" && st.slice(1).every((x) => x === "locked"), `repeat topic locks ${st}`);
  await shot(s, "pv11-student-repeat-topic");
  await s.getByTestId("lesson-start").click();
  await playFlashcards(s);
  await nextEnabled(s);
  await s.waitForTimeout(1000);
  assert((await completed(taskA.id, ana.id)).length === 5, "repeat topic attempt recorded");
  // Coming back later: completed, final screen, ?step=2 opens as a repeat.
  await s.goto(`${BASE}/learn/tasks/${taskA.id}`);
  await s.getByTestId("lesson-final").waitFor();
  await s.goto(`${BASE}/learn/tasks/${taskA.id}?step=2`);
  await s.locator("[data-testid=topic-lesson][data-phase=play][data-step='1']").waitFor();
  log("repeat an activity and repeat the topic: new attempts recorded (history kept), the topic stays completed; ?step=2 opens a repeat afterwards");

  // Continue with my assignments → the single-resource topic → all done.
  await s.goto(`${BASE}/learn/tasks/${taskA.id}`);
  await s.getByTestId("lesson-next-assignment").click();
  await s.waitForURL(`${BASE}/learn/tasks/${taskSolo.id}`);
  await s.getByTestId("lesson-start").click();
  await s.getByTestId("activity-finished").click();
  await nextEnabled(s);
  await s.getByTestId("lesson-next").click();
  await s.getByTestId("lesson-final").waitFor();
  await s.getByTestId("lesson-continue").click();
  await s.getByTestId("lesson-all-done").waitFor();
  await shot(s, "pv12-student-all-done");
  await s.goto(`${BASE}/learn`);
  const rows = await s.getByTestId("task-progress").allTextContents();
  assert(rows.filter((x) => x.includes("Repeat")).length === 2, `My Assignments rows: ${rows}`);
  await shot(s, "pv13-student-assignments");
  log("Continue with my assignments: next topic, then «All done»; My Assignments offers Repeat on both completed topics");

  // ── Student with partial progress from before this change ──
  const { s: b } = await studentIn("Beto");
  await b.goto(`${BASE}/learn/tasks/${taskB.id}`);
  await b.locator("[data-testid=topic-lesson][data-phase=intro][data-step='1']").waitFor();
  st = await states(b);
  assert(st[0] === "done" && st[1] === "current" && st[2] === "locked", `partial ${st}`);
  await b.goto(`${BASE}/learn/tasks/${taskB.id}?step=3`);
  await b.getByTestId("lesson-notice").waitFor();
  await b.locator("[data-testid=topic-lesson][data-phase=intro][data-step='1']").waitFor();
  await b.goto(`${BASE}/learn/tasks/${taskB.id}/${taskB.activities[2].id}`);
  await b.waitForURL(`${BASE}/learn/tasks/${taskB.id}`);
  await shot(b, "pv14-student-partial");
  log("older assignment with partial progress: resumes at step 2; links to step 3 stay locked");

  assert(errors.length === 0, `page errors: ${errors.join(" | ")}`);
  console.log("\nALL TOPIC PREVIEW / JOURNEY CHECKS PASSED");
} catch (e) {
  console.error("FAILED:", e.message);
  if (errors.length) console.error("page errors:", errors);
  process.exitCode = 1;
} finally {
  await browser.close();
  await db.$disconnect();
}
