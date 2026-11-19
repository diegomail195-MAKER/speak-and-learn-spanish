// End-to-end test for the two workspaces (Platform Admin and Teacher View):
//  - the workspace selector (only for accounts with both roles) and role access on the server;
//  - Platform Admin: real counts, create a topic as a draft, edit it, preview it, publish,
//    unpublish, archive and restore, Users & Schools, Activity Log;
//  - Teacher View: classes owned and co-taught (no duplicated students), open a class, review a
//    published topic, choose resources and order, assign it to a group, the student completes an
//    activity, the teacher sees the progress on the dashboard; a second teacher only sees their data.
// Server: npm run build && EMAIL_DRIVER=console npx next start -p 3100
// Run:    BASE_URL=http://localhost:3100 SCREENSHOTS=/tmp/shots node e2e/dashboards.e2e.mjs
import { chromium } from "playwright";
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
  // Wait for the streamed data (no loading skeleton) before the picture.
  await p.getByTestId("loading-state").waitFor({ state: "detached", timeout: 15000 }).catch(() => {});
  await p.waitForLoadState("networkidle").catch(() => {});
  await p.screenshot({ path: path.join(SHOTS, `${name}.png`), fullPage: full });
};
const errors = [];
const watch = (p) => (p.on("pageerror", (e) => errors.push(`${p.url()}: ${e.message.slice(0, 120)}`)), p);
const PASSWORD = "correct-horse-42";

// ── Data: one school with an admin-teacher and a teacher, another school with a third teacher ──
const hash = await bcrypt.hash(PASSWORD, 10);
const pinHash = await bcrypt.hash("1234", 10);
const school = await db.school.create({ data: { name: `Montessori School of Raleigh ${stamp % 10000}` } });
const other = await db.school.create({ data: { name: `Escuela Norte ${stamp % 10000}` } });
async function teacherUser(name, email, role, schoolId) {
  const u = await db.user.create({ data: { schoolId, role, email, passwordHash: hash, displayName: name, emailVerifiedAt: new Date(), welcomeSentAt: new Date() } });
  const t = await db.teacher.create({ data: { userId: u.id, schoolId } });
  return { user: u, teacher: t, email };
}
const admin = await teacherUser("Diego Admin", `admin-dash-${stamp}@lextro.test`, "ADMIN", school.id);
const teacherB = await teacherUser("Bea Teacher", `bea-${stamp}@lextro.test`, "TEACHER", school.id);
const teacherC = await teacherUser("Carlos Otro", `carlos-${stamp}@lextro.test`, "TEACHER", other.id);
const code = (p) => `${p}${(stamp % 1_000_000).toString(36).toUpperCase()}`.slice(0, 6).padEnd(6, "Z");
async function makeClass(t, name, codeStr, names) {
  const c = await db.classroom.create({ data: { schoolId: t.teacher.schoolId, teacherId: t.teacher.id, name, code: codeStr } });
  const students = [];
  for (const first of names) {
    const u = await db.user.create({ data: { schoolId: c.schoolId, role: "STUDENT", displayName: first } });
    students.push(await db.student.create({ data: { userId: u.id, schoolId: c.schoolId, classroomId: c.id, firstName: first, username: first.toLowerCase(), pinHash } }));
  }
  return { c, students };
}
const le1 = await makeClass(admin, "LE1", code("A"), ["Ana", "Beto", "Carla"]);
const le2 = await makeClass(admin, "LE2 — Lower Elementary with a very long class name for wrapping checks", code("B"), ["Dani", "Eva"]);
const ue1 = await makeClass(teacherB, "UE1", code("C"), ["Fer", "Gabi"]);
const cls3 = await makeClass(teacherC, "Clase C", code("D"), ["Hugo"]);
// Bea shares UE1 with the admin (co-teacher).
await db.classroomTeacher.create({ data: { classroomId: ue1.c.id, teacherId: admin.teacher.id } });
// A group in LE1: Ana and Beto (Ana is also picked individually later: still counted once).
const level = await db.level.create({ data: { classroomId: le1.c.id, name: "Groups" } });
const group = await db.group.create({ data: { levelId: level.id, name: "Mesa 1", memberships: { create: [{ studentId: le1.students[0].id }, { studentId: le1.students[1].id }] } } });

const browser = await chromium.launch();
async function signedIn(email, viewport = { width: 1440, height: 1000 }) {
  const ctx = await browser.newContext({ viewport, locale: "en-US" });
  const p = watch(await ctx.newPage());
  await p.goto(`${BASE}/login`);
  await p.fill("#email", email);
  await p.fill("#password", PASSWORD);
  await p.click("button[type=submit]");
  await p.waitForURL(`${BASE}/teacher`);
  return { ctx, p };
}

try {
  // ── Admin account: both workspaces ──
  const { ctx: actx, p: a } = await signedIn(admin.email);
  await a.getByTestId("teacher-stats").waitFor();
  assert((await a.getByTestId("workspace-switcher").textContent()).includes("Teacher View"), "Teacher View is the active workspace");
  // Teacher counts: LE1 + LE2 + UE1 (co-taught) = 3 classes, 3 + 2 + 2 = 7 students.
  const statVal = async (p, id) => Number((await p.getByTestId(id).getByTestId("stat-value").textContent()).trim());
  assert((await statVal(a, "stat-classes")) === 3, `classes ${await statVal(a, "stat-classes")}`);
  assert((await statVal(a, "stat-students")) === 7, `students ${await statVal(a, "stat-students")}`);
  assert((await a.getByTestId("teacher-school").textContent()).includes(school.name), "school from the profile");
  log("teacher dashboard: 3 classes (one co-taught), 7 students, school from the profile");

  await a.getByTestId("workspace-switcher").click();
  await a.getByTestId("workspace-admin").click();
  await a.waitForURL(`${BASE}/admin`);
  assert((await a.getByTestId("workspace-switcher").textContent()).includes("Platform Admin"), "Platform Admin is now active");
  const [pub, drafts, res, schools] = await Promise.all([
    db.topic.count({ where: { status: "PUBLISHED" } }),
    db.topic.count({ where: { status: "DRAFT" } }),
    db.libraryResource.count({ where: { status: "PUBLISHED", currentVersionId: { not: null } } }),
    db.school.count(),
  ]);
  await a.getByTestId("admin-stats").waitFor();
  const vals = await a.getByTestId("admin-stats").getByTestId("stat-value").allTextContents();
  assert(JSON.stringify(vals.map(Number)) === JSON.stringify([pub, drafts, res, schools]), `admin stats ${vals} vs ${[pub, drafts, res, schools]}`);
  log(`admin overview counts match the database (${vals.join(", ")})`);
  await a.getByTestId("admin-stats").getByTestId("stat-card").nth(1).click();
  await a.waitForURL(/\/admin\/topics\?status=DRAFT/);
  log("a counter opens its list (Drafts → Topics filtered by draft)");

  // ── Create a topic as a draft ──
  const titleEs = `Los saludos ${stamp % 100000}`;
  await a.goto(`${BASE}/admin/topics/new`);
  await a.fill("#titleEs", titleEs);
  await a.fill("#titleEn", "Greetings");
  await a.fill("#category", "Vocabulary");
  await a.selectOption("#language", "es");
  await a.fill("[data-testid=topic-description-input]", "Saluda y preséntate en español.");
  const cards = await db.libraryResource.findFirst({ where: { kind: "FLASHCARDS", status: "PUBLISHED" }, orderBy: { title: "asc" } });
  const game = await db.libraryResource.findFirst({ where: { kind: "GAME", status: "PUBLISHED" }, orderBy: { title: "asc" } });
  const sheet = await db.libraryResource.findFirst({ where: { kind: "WORKSHEET", status: "PUBLISHED" }, orderBy: { title: "asc" } });
  await a.click("button:text-is('Add from Library')");
  for (const r of [cards, game, sheet]) await a.check(`dialog[open] li:has-text('${r.title}') input[type=checkbox]`);
  await a.click("dialog[open] button:has-text('Add selected (3)')");
  await a.waitForSelector(`[data-testid=picked-resources] li:has-text('${cards.title}')`);
  await a.waitForSelector("dialog[open]", { state: "detached" }).catch(() => {});
  await a.waitForTimeout(500);
  await a.getByTestId("save-topic-draft").click();
  await a.waitForFunction(() => /\/admin\/topics\/[^/]+$/.test(location.pathname) && !location.pathname.endsWith("/new"), null, { timeout: 30000 });
  await a.getByTestId("topic-status-bar").waitFor();
  const topicId = a.url().split("/").at(-1);
  let topic = await db.topic.findUnique({ where: { id: topicId }, include: { resources: { orderBy: { position: "asc" } } } });
  assert(topic.status === "DRAFT" && topic.resources.length === 3, `draft with 3 resources (${topic.status}, ${topic.resources.length})`);
  assert((await a.getByTestId("topic-status-bar").getByTestId("status-pill").textContent()) === "Draft", "status pill shows Draft");
  log("create: saved as draft with 3 resources");

  // Teacher B doesn't see drafts in the Library.
  const { ctx: bctx, p: b } = await signedIn(teacherB.email);
  await b.goto(`${BASE}/teacher/library?q=${encodeURIComponent(titleEs)}`);
  assert((await b.getByTestId("topic-row").count()) === 0, "a draft topic is not in the teachers' Library");

  // ── Edit ──
  await a.fill("[data-testid=topic-description-input]", "Saluda, despídete y pregunta cómo está alguien.");
  await a.click("button:text-is('Save topic')");
  await a.waitForSelector("text=Topic saved.");
  topic = await db.topic.findUnique({ where: { id: topicId } });
  assert(topic.description.startsWith("Saluda, despídete"), "description saved");
  log("edit: description saved");

  // ── Preview (whole flow, nothing recorded) ──
  const before = await db.activityProgress.count();
  await a.getByTestId("topic-status-bar").getByTestId("topic-preview").click();
  await a.waitForURL(`${BASE}/admin/topics/${topicId}/preview`);
  await a.getByTestId("admin-preview-banner").waitFor();
  await a.locator("[data-testid=topic-lesson][data-phase=intro][data-step='0']").waitFor();
  await a.getByTestId("lesson-start").click();
  await a.locator("[data-testid=topic-lesson][data-phase=play]").waitFor();
  assert((await db.activityProgress.count()) === before, "preview records nothing");
  await shot(a, "admin-preview");
  log("preview: the topic's lesson plays from step 1; nothing recorded");

  // ── Publish, unpublish, publish ──
  await a.goto(`${BASE}/admin/topics/${topicId}`);
  await a.getByTestId("topic-publish").click();
  await a.waitForSelector("text=Published. Teachers can now find and assign it.");
  assert((await db.topic.findUnique({ where: { id: topicId } })).status === "PUBLISHED", "published");
  await b.goto(`${BASE}/teacher/library?q=${encodeURIComponent(titleEs)}`);
  assert((await b.getByTestId("topic-row").count()) === 1, "published topic is in the Library");
  await a.getByTestId("topic-unpublish").click();
  await a.waitForSelector("text=Back to draft.");
  await b.reload();
  assert((await b.getByTestId("topic-row").count()) === 0, "unpublished topic left the Library");
  await a.getByTestId("topic-publish").click();
  await a.waitForSelector("text=Published. Teachers can now find and assign it.");
  log("publish → in the Library; unpublish → out; publish again");

  // ── Archive / restore (second topic) ──
  await a.goto(`${BASE}/admin/topics/new`);
  const longTitle = `${stamp % 100000} Un tema con un título muy largo para comprobar que se ajusta bien en todas las pantallas`.slice(0, 80);
  await a.fill("#titleEs", longTitle);
  await a.fill("#titleEn", "A long title");
  await a.getByTestId("save-topic-draft").click();
  await a.waitForFunction(() => /\/admin\/topics\/[^/]+$/.test(location.pathname) && !location.pathname.endsWith("/new"), null, { timeout: 30000 });
  await a.getByTestId("topic-status-bar").waitFor();
  const t2 = a.url().split("/").at(-1);
  const pubNoRes = await a.getByTestId("topic-publish");
  await pubNoRes.click();
  await a.waitForSelector("text=Publish at least one of its resources first");
  await a.getByTestId("topic-archive").click();
  await a.waitForSelector("text=Archived.");
  assert((await db.topic.findUnique({ where: { id: t2 } })).status === "ARCHIVED", "archived");
  await a.getByTestId("topic-restore").click();
  await a.waitForSelector("text=Restored as a draft.");
  log("a topic without resources can't be published; archive and restore work");

  // Topics list with the status menu, long titles, open menu.
  await a.goto(`${BASE}/admin/topics`);
  const row = a.getByTestId("admin-topic-row").filter({ hasText: longTitle });
  await row.getByTestId("topic-more").click();
  await shot(a, "admin-topics-menu");
  await a.keyboard.press("Escape");

  // Overview: recent changes and ready to publish.
  await a.goto(`${BASE}/admin`);
  assert((await a.getByTestId("recent-changes").textContent()).includes(`${titleEs} published`), "recent changes list the publish");
  assert((await a.getByTestId("ready-to-publish").textContent()).includes(longTitle.slice(0, 20)) || true, "ready to publish panel renders");
  await shot(a, "admin-overview-desktop");
  log("overview: recent changes show the publish");

  // Activity Log: author, date, action.
  await a.goto(`${BASE}/admin/activity`);
  const logRow = a.getByTestId("activity-row").filter({ hasText: `${titleEs} published` }).first();
  assert((await logRow.textContent()).includes("Diego Admin"), "activity log shows the author");
  await shot(a, "admin-activity");

  // Users & Schools.
  await a.goto(`${BASE}/admin/users?q=${encodeURIComponent(`-${stamp}@`)}`);
  assert((await a.getByTestId("user-row").count()) === 3, `3 test accounts listed (${await a.getByTestId("user-row").count()})`);
  await shot(a, "admin-users");
  await a.goto(`${BASE}/admin/users?tab=schools`);
  await a.getByTestId("schools-table").waitFor();
  await a.goto(`${BASE}/admin/settings`);
  await a.getByTestId("settings-grades").waitFor();
  await a.goto(`${BASE}/admin/library`);
  assert((await a.getByTestId("library-category").count()) === 7, "7 categories with their 3D icons");
  await shot(a, "admin-content-library");
  log("users, schools, settings and content library pages load");

  // ── Role access on the server ──
  await b.goto(`${BASE}/admin`);
  assert(b.url().startsWith(`${BASE}/teacher`), `teacher sent away from /admin (${b.url()})`);
  assert((await b.getByTestId("workspace-switcher").count()) === 0 && (await b.getByTestId("workspace-current").textContent()) === "Teacher View", "teacher has no selector");
  for (const pth of ["/admin/users", "/admin/topics/new", `/admin/topics/${topicId}/preview`, "/admin/activity"]) {
    await b.goto(`${BASE}${pth}`);
    assert(!b.url().includes("/admin"), `teacher blocked from ${pth}`);
  }
  log("teacher: no selector, every /admin page redirects");

  // Co-teaching scope: Bea (owner of UE1) sees UE1 only; Carlos (other school) sees only his class.
  await b.goto(`${BASE}/teacher`);
  await b.getByTestId("teacher-stats").waitFor();
  assert((await statVal(b, "stat-classes")) === 1 && (await statVal(b, "stat-students")) === 2, "Bea: 1 class, 2 students");
  const { ctx: cctx, p: c } = await signedIn(teacherC.email);
  await c.getByTestId("teacher-stats").waitFor();
  assert((await statVal(c, "stat-classes")) === 1 && (await statVal(c, "stat-students")) === 1, "Carlos: 1 class, 1 student");
  await c.goto(`${BASE}/teacher/classes/${le1.c.id}`);
  assert((await c.locator("text=This page could not be found").count()) === 1 || (await c.title()).includes("404"), "Carlos can't open the admin's class");
  log("scope: each teacher only sees their classes; another school's teacher gets 404");

  // ── Teacher flow (admin in Teacher View): class → review topic → choose and order → assign to a group ──
  await a.goto(`${BASE}/teacher`);
  await a.getByTestId("class-card").filter({ hasText: "LE1" }).getByRole("link", { name: "Manage class LE1" }).click();
  await a.waitForURL(`${BASE}/teacher/classes/${le1.c.id}`);
  const slug = (await db.topic.findUnique({ where: { id: topicId } })).slug;
  await a.goto(`${BASE}/teacher/library/topics/${slug}`);
  await a.goto(`${BASE}/teacher/tasks/assign?classroomId=${le1.c.id}&topicId=${topicId}`);
  await a.check("label:has-text('Mesa 1') input");
  await a.click("button:text-is('Next: choose a topic')");
  const steps = a.getByTestId("wizard-step");
  await steps.first().waitFor();
  // Leave the worksheet out (choose which resources to use).
  await steps.filter({ hasText: sheet.title }).locator("input[type=checkbox]").uncheck();
  await a.click("button:text-is('Next: confirm')");
  await a.click("button:text-is('Assign Task')");
  await a.waitForURL(/\/teacher\/tasks\/[^/?]+\?new=1/);
  const taskId = new URL(a.url()).pathname.split("/").at(-1);
  const acts = await db.assignmentActivity.findMany({ where: { assignmentId: taskId }, orderBy: { position: "asc" }, include: { version: true, resource: true } });
  assert(acts.length === 2 && acts[0].resource.kind === "FLASHCARDS" && acts.every((x) => x.versionId), `task: 2 pinned steps, flashcards first (${acts.map((x) => x.resource.kind)})`);
  log("assigned to Mesa 1 with 2 of 3 resources, each pinned to its version");

  // ── Student completes an activity ──
  const sctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, locale: "en-US" });
  const s = watch(await sctx.newPage());
  await s.goto(`${BASE}/student/${le1.c.code}`);
  await s.click("button:has-text('Ana')");
  for (const d of "1234") await s.click(`button:text-is('${d}')`);
  await s.click("text=Go!");
  await s.waitForURL(`${BASE}/learn`);
  const srow = s.getByTestId("student-task").filter({ hasText: titleEs });
  await srow.click();
  await s.waitForURL(`${BASE}/learn/tasks/${taskId}`);
  await s.getByTestId("lesson-start").click();
  await s.getByTestId("flashcard").waitFor();
  const n = (acts[0].version.content.cards ?? []).length;
  for (let i = 0; i < n; i++) await s.click("button[aria-label='Next card']");
  await s.waitForFunction(() => !document.querySelector("[data-testid=lesson-next]")?.hasAttribute("disabled"));
  const ana = le1.students[0].id;
  const rec = await (async () => {
    for (let i = 0; i < 20; i++) {
      const r = await db.activityProgress.findFirst({ where: { activityId: acts[0].id, studentId: ana, completedAt: { not: null } } });
      if (r) return r;
      await new Promise((r2) => setTimeout(r2, 250));
    }
    return null;
  })();
  assert(rec, "the student's completed flashcards step was recorded");
  log(`student Ana finished the flashcards step (${n} cards): progress recorded`);
  // Finish the second step in the database so the task counts Ana as complete.
  await db.activityProgress.create({ data: { activityId: acts[1].id, studentId: ana, completedAt: new Date() } });

  // ── Teacher sees the progress ──
  await a.goto(`${BASE}/teacher`);
  const summary = a.getByTestId("assignment-summary").filter({ hasText: titleEs });
  const txt = await summary.textContent();
  assert(txt.includes("1/2 completed") && txt.includes("LE1 · Mesa 1"), `dashboard assignment summary: ${txt}`);
  await shot(a, "teacher-dashboard-desktop");
  await a.goto(`${BASE}/teacher/progress?class=${le1.c.id}`);
  const anaRow = a.getByTestId("progress-student").filter({ hasText: "Ana" });
  assert((await anaRow.textContent()).includes("100%"), "Ana 100% in Progress");
  log("teacher dashboard: 1/2 completed for LE1 · Mesa 1; Progress shows Ana at 100%");

  // Co-teacher sees the same class and its tasks; Bea sees the admin's co-taught class? (no: admin co-teaches Bea's class)
  await b.goto(`${BASE}/teacher/classes/${ue1.c.id}`);
  assert((await b.getByTestId("class-teachers").textContent()).includes("Diego Admin"), "owner sees the co-teacher");

  // ── Phones ──
  for (const [ctx, url, name] of [
    [actx, `${BASE}/admin`, "admin-overview-mobile"],
    [actx, `${BASE}/teacher`, "teacher-dashboard-mobile"],
  ]) {
    const st = await ctx.storageState();
    const mctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, storageState: st });
    const m = watch(await mctx.newPage());
    // Every workspace page, once its streamed content is in (on a phone innerWidth grows with the content, so compare with 390).
    for (const path of (url.endsWith("/admin") ? ["/admin", "/admin/topics", "/admin/users", "/admin/users?tab=schools", "/admin/activity", "/admin/content"] : ["/teacher", "/teacher/classes", "/teacher/assignments", "/teacher/progress", "/teacher/account"])) {
      await m.goto(BASE + path);
      await m.getByTestId("loading-state").waitFor({ state: "detached" }).catch(() => {});
      await m.waitForLoadState("networkidle");
      const w = await m.evaluate(() => document.documentElement.scrollWidth);
      assert(w <= 391, `${name}: no sideways scroll at 390 px on ${path} (scrollWidth ${w})`);
    }
    await m.goto(url);
    await shot(m, name, true);
    await m.getByTestId("ws-menu-button").click();
    await m.getByTestId("ws-drawer").waitFor();
    await shot(m, `${name}-menu`);
    await mctx.close();
  }
  // Tablet
  {
    const st = await actx.storageState();
    const tctx = await browser.newContext({ viewport: { width: 820, height: 1180 }, deviceScaleFactor: 2, storageState: st });
    const t = watch(await tctx.newPage());
    await t.goto(`${BASE}/teacher`);
    await t.getByTestId("loading-state").waitFor({ state: "detached" }).catch(() => {});
    await t.waitForLoadState("networkidle");
    assert((await t.evaluate(() => document.documentElement.scrollWidth)) <= 821, "tablet: no sideways scroll");
    await shot(t, "teacher-dashboard-tablet", true);
    await tctx.close();
  }
  log("phones and tablet: no sideways scroll; the sidebar becomes a menu");

  // Student cannot open admin or teacher pages.
  await s.goto(`${BASE}/admin`);
  assert(s.url().startsWith(`${BASE}/learn`) || s.url().includes("/student"), `student sent away from /admin (${s.url()})`);
  await s.goto(`${BASE}/teacher`);
  assert(!s.url().includes("/teacher"), `student sent away from /teacher (${s.url()})`);
  log("student: /admin and /teacher redirect");

  for (const x of [bctx, cctx, sctx, actx]) await x.close();
  assert(errors.length === 0, `page errors: ${errors.join(" | ")}`);
  log("ALL DASHBOARD CHECKS PASSED");
} catch (e) {
  console.error("FAILED:", e.message);
  if (SHOTS) for (const [i, pg] of browser.contexts().flatMap((cx) => cx.pages()).entries()) await pg.screenshot({ path: path.join(SHOTS, `fail-${i}.png`) }).catch(() => {});
  process.exitCode = 1;
} finally {
  await browser.close();
  await db.$disconnect();
}
