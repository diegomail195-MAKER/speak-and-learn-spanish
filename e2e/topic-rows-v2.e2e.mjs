// End-to-end test for the topic rows, second version: hover and keyboard focus that keep the
// layout still, the new Worksheet and Listening icons (old Printables shown under Worksheet), the
// teacher's previews from the icons (nothing recorded), the topic setup confirmed for one class and
// used by Assign Task, and the student's rows: the whole row opens the guided lesson (start or
// resume), the icons are not links, and a direct URL to a later step goes back to the lesson.
// Run: BASE_URL=http://localhost:3100 node e2e/topic-rows-v2.e2e.mjs
import { chromium } from "playwright";
import path from "node:path";
import prismaPkg from "@prisma/client";
import { addStudent } from "./class-helpers.mjs";

const { PrismaClient } = prismaPkg;
const db = new PrismaClient();
const BASE = process.env.BASE_URL ?? "http://localhost:3100";
const SHOTS = process.env.SCREENSHOTS;
const shot = async (p, name, full = false) => SHOTS && p.screenshot({ path: path.join(SHOTS, `${name}.png`), fullPage: full });
const log = (...a) => console.log("•", ...a);
const assert = (c, m) => {
  if (!c) throw new Error(m);
};
const stamp = Date.now();
const browser = await chromium.launch();
const errors = [];
const watch = (p) => (p.on("pageerror", (e) => errors.push(`${p.url()}: ${e.message.slice(0, 80)}`)), p);
const counts = async () => ({ progress: await db.activityProgress.count(), attempts: await db.studentAttempt.count() });

try {
  // ── Content: a topic with every kind, an old Printable (now Worksheet) and a Listening ──
  const pub = (kind, title) => db.libraryResource.findFirst({ where: { kind, status: "PUBLISHED", currentVersionId: { not: null }, ...(title ? { title } : {}) }, orderBy: { title: "asc" }, select: { id: true, title: true } });
  const [video, cards, sheet] = await Promise.all([pub("VIDEO"), pub("FLASHCARDS"), pub("WORKSHEET", "Picture Dictionary")]);
  const games = await db.libraryResource.findMany({ where: { kind: "GAME", status: "PUBLISHED", currentVersionId: { not: null } }, take: 2, orderBy: { title: "asc" }, select: { id: true, title: true } });
  assert(video && cards && sheet && games.length === 2, "seeded content (Picture Dictionary was a Printable)");
  assert((await db.libraryResource.count({ where: { kind: "PRINTABLE" } })) === 0, "no resource is left as Printable");
  const listening = await db.libraryResource.create({ data: { kind: "LISTENING", title: `Escucha ${stamp}`, status: "PUBLISHED", grades: ["LOWER", "UPPER"] } });
  const v = await db.resourceVersion.create({ data: { resourceId: listening.id, number: 1, title: listening.title, content: { file: null, transcript: "Hola, me llamo Pinita. ¿Cómo estás?", link: null }, fileIds: [] } });
  await db.libraryResource.update({ where: { id: listening.id }, data: { currentVersionId: v.id } });
  const topic = await db.topic.create({ data: { slug: `escuchar-${stamp}`, titleEn: `Listening ${stamp}`, titleEs: `Escuchar ${stamp}`, description: "Escucha, juega y practica con todos los recursos.", color: "#B57BFF", art: "topic:greetings", sortOrder: -5, status: "PUBLISHED" } });
  const order = [video.id, games[0].id, games[1].id, cards.id, sheet.id, listening.id];
  await db.topicResource.createMany({ data: order.map((resourceId, position) => ({ topicId: topic.id, resourceId, position })) });

  // ── Teacher, class, student ──
  const tctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: "en-US" });
  const t = watch(await tctx.newPage());
  await t.goto(`${BASE}/signup`);
  await t.fill("#displayName", "Marta Gil");
  await t.fill("#schoolName", "Colegio Filas 2");
  await t.fill("#email", `rows2${stamp}@school.test`);
  await t.fill("#password", "correct-horse-42");
  await t.click("button[type=submit]");
  await t.waitForURL(`${BASE}/teacher`);
  await t.goto(`${BASE}/teacher/classes`);
  await t.fill("#name", "Tercero B");
  await t.click("text=Create class");
  await t.click("text=Tercero B");
  await t.waitForURL(/\/teacher\/classes\/.+/);
  const classUrl = t.url();
  const classId = classUrl.split("/").at(-1);
  const code = (await t.locator("span.font-mono").first().textContent()).trim();
  const pin = await addStudent(t, classUrl, "Lucía", { initial: "R" });
  log("teacher, class Tercero B and student Lucía");

  // ── Teacher's Library row ──
  await t.goto(`${BASE}/teacher/library`);
  const row = t.getByTestId("topic-row").filter({ hasText: `Escuchar ${stamp}` });
  await row.waitFor();
  const kinds = await row.getByTestId("topic-access").evaluateAll((a) => a.map((x) => x.dataset.kind));
  assert(JSON.stringify(kinds) === JSON.stringify(["VIDEO", "GAME", "FLASHCARDS", "WORKSHEET", "LISTENING"]), `accesses from the real resources, fixed order (${kinds})`);
  const icons = await row.locator("img.topic-access-img").evaluateAll((im) => im.map((i) => i.getAttribute("src")));
  assert(icons.includes("/topic-icons/worksheet.webp") && icons.includes("/topic-icons/listening.webp"), `new Worksheet and Listening icons ${icons}`);
  const labels = await row.locator(".topic-access-label").allTextContents();
  assert(labels.includes("Worksheet") && labels.includes("Listening") && !labels.some((l) => /Printable/.test(l)), `labels ${labels}`);
  assert((await t.locator("[data-kind=PRINTABLE]").count()) === 0 && (await t.getByRole("link", { name: "Printables" }).count()) === 0, "no Printables category anywhere in the Library");
  assert((await row.getByText("Add resource").count()) === 0, "no Add resource in the rows");
  log("teacher row: accesses from the real resources with the Worksheet and Listening icons; no Printables, no Add resource");

  // Hover: lavender, purple border, shadow; nothing moves.
  await row.evaluate((el) => el.scrollIntoView({ block: "center" }));
  const box0 = await row.boundingBox();
  const kids0 = await row.locator(".topic-access").evaluateAll((a) => a.map((x) => JSON.stringify(x.getBoundingClientRect())));
  const desc = await row.locator(".topic-desc").boundingBox();
  await t.mouse.move(desc.x + 20, desc.y + desc.height / 2); // over the row (its link covers it)
  await t.waitForTimeout(250);
  const styled = await row.evaluate((el) => { const c = getComputedStyle(el); return [c.backgroundColor, c.borderTopColor, c.boxShadow]; });
  assert(styled[0] === "rgb(248, 245, 255)" && styled[1] === "rgb(139, 92, 214)" && styled[2] !== "none", `hover style ${styled}`);
  const box1 = await row.boundingBox();
  const kids1 = await row.locator(".topic-access").evaluateAll((a) => a.map((x) => JSON.stringify(x.getBoundingClientRect())));
  assert(JSON.stringify(box0) === JSON.stringify(box1) && JSON.stringify(kids0) === JSON.stringify(kids1), "hover keeps the layout still");
  await shot(t, "v2-teacher-1440-hover");
  // Keyboard: Tab onto the row's link gives the same highlight and a visible focus ring.
  await t.mouse.move(5, 5);
  const fav = row.locator(".topic-heart");
  await fav.focus();
  await t.keyboard.press("Shift+Tab");
  const focused = await t.evaluate(() => document.activeElement?.dataset.testid);
  assert(focused === "topic-row-link", `Shift+Tab lands on the row link (${focused})`);
  const ring = await row.evaluate((el) => { const c = getComputedStyle(el); return [c.backgroundColor, c.outlineStyle, c.outlineWidth]; });
  assert(ring[0] === "rgb(248, 245, 255)" && ring[1] === "solid" && ring[2] === "3px", `keyboard focus style ${ring}`);
  await shot(t, "v2-teacher-1440-focus");
  log("hover and keyboard focus: lavender background, thin purple border, discreet shadow, focus ring; layout unchanged");

  // The thumbnail (whole row) opens the topic.
  await row.evaluate((el) => el.scrollIntoView({ block: "center" }));
  const tb = await row.locator(".topic-thumb").boundingBox();
  await t.mouse.click(tb.x + tb.width / 2, tb.y + tb.height / 2);
  await t.waitForURL(new RegExp(`/teacher/library/topics/escuchar-${stamp}`));
  await t.goBack();
  await row.waitFor();
  log("clicking the row's thumbnail opens the topic");

  // Icons: previews, nothing recorded. Several Games → titles to choose.
  const before = await counts();
  await row.locator("[data-testid=topic-access][data-kind=GAME]").click();
  const menu = row.getByTestId("topic-access-menu");
  await menu.waitFor();
  assert((await menu.locator("a").count()) === 2, "two Games listed by title");
  await shot(t, "v2-teacher-1440-menu");
  await t.keyboard.press("Escape");
  await row.locator("[data-testid=topic-access][data-kind=LISTENING]").click();
  await t.waitForURL(new RegExp(`/teacher/library/resources/${listening.id}`));
  await t.getByTestId("listening-transcript").waitFor();
  await t.goBack();
  await row.locator("[data-testid=topic-access][data-kind=WORKSHEET]").click();
  await t.waitForURL(new RegExp(`/teacher/library/resources/${sheet.id}`));
  await t.goBack();
  assert(JSON.stringify(before) === JSON.stringify(await counts()), "previews record no progress");
  log("teacher icons open previews (Listening plays its transcript, Worksheet opens the old Printable); nothing recorded");

  // Worksheet tab holds the old Printables; an old Printables link opens it.
  await t.goto(`${BASE}/teacher/library?type=PRINTABLE`);
  await t.getByRole("link", { name: "Picture Dictionary" }).first().waitFor();
  assert((await t.locator("nav[aria-label='Browse by'] a.bg-ink").textContent()).trim() === "Worksheets", "Printables link opens Worksheets");
  log("old Printables are listed under Worksheets");

  // ── Topic setup confirmed for the class ──
  const setup = `${BASE}/teacher/library/topics/escuchar-${stamp}/lesson`;
  await t.goto(setup);
  const defaultOrder = await t.getByTestId("plan-title").allTextContents();
  await t.getByTestId("setup-class").filter({ hasText: "Tercero B" }).click();
  await t.waitForURL(/\?class=/);
  await t.getByTestId("setup-state").filter({ hasText: "uses your default order" }).waitFor();
  await t.getByTestId("plan-up").last().click(); // Listening before the worksheet
  await t.getByTestId("plan-save").filter({ hasText: "Confirm for Tercero B" }).click();
  await t.getByTestId("plan-status").filter({ hasText: "Confirmed for Tercero B" }).waitFor();
  await t.reload();
  await t.getByTestId("setup-state").filter({ hasText: "Confirmed for Tercero B" }).waitFor();
  const classOrder = await t.getByTestId("plan-title").allTextContents();
  assert(classOrder.at(-2) === listening.title && classOrder.at(-1) === "Picture Dictionary", `class order saved ${classOrder}`);
  await shot(t, "v2-teacher-setup-1440");
  const plan = await db.topicPlan.findFirst({ where: { topicId: topic.id, classroomId: classId } });
  assert(plan, "setup saved for the class");
  await t.goto(setup);
  assert(JSON.stringify(await t.getByTestId("plan-title").allTextContents()) === JSON.stringify(defaultOrder), "the default order is unchanged");
  log("topic setup confirmed for Tercero B and kept after reload; the default order stays as it was");

  // Assign Task for that class starts from the class setup (existing assignment system).
  await t.goto(`${BASE}/teacher/tasks/assign?classroomId=${classId}&topicId=${topic.id}`);
  await t.check("fieldset:has(legend:text-is('Individual students')) label:has-text('Lucía') input");
  await t.click("button:text-is('Next: choose a topic')");
  const wiz = (await t.getByTestId("wizard-step").locator("label span.font-bold").allTextContents()).map((x) => x.trim());
  assert(JSON.stringify(wiz) === JSON.stringify(classOrder), `wizard uses the class setup ${wiz}`);
  await t.click("button:text-is('Next: confirm')");
  await t.click("button:text-is('Assign Task')");
  await t.waitForURL(/\/teacher\/tasks\/[^/?]+\?new=1/);
  const taskId = new URL(t.url()).pathname.split("/").at(-1);
  const acts = await db.assignmentActivity.findMany({ where: { assignmentId: taskId }, orderBy: { position: "asc" }, include: { version: true } });
  assert(JSON.stringify(acts.map((a) => a.version?.title)) === JSON.stringify(classOrder), "the task follows the class setup");
  log("Assign Task for Tercero B uses the confirmed setup; the task keeps that order");

  // ── Student ──
  const sctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: "en-US" });
  const s = watch(await sctx.newPage());
  await s.goto(`${BASE}/student/${code}`);
  await s.click("button:has-text('Lucía')");
  for (const d of pin) await s.click(`button:text-is('${d}')`);
  await s.click("text=Go!");
  await s.waitForURL(`${BASE}/learn`);
  const srow = s.getByTestId("student-task").filter({ hasText: `Escuchar ${stamp}` });
  await srow.waitFor();
  const sk = await srow.getByTestId("topic-indicator").evaluateAll((a) => a.map((x) => x.dataset.kind));
  assert(JSON.stringify(sk) === JSON.stringify(["VIDEO", "GAME", "FLASHCARDS", "WORKSHEET", "LISTENING"]), `student indicators ${sk}`);
  const inner = await srow.evaluate((el) => ({ links: el.querySelectorAll("a, button, [onclick], [tabindex]").length, tag: el.tagName }));
  assert(inner.tag === "A" && inner.links === 0, `the row is one link; the icons are not links or buttons ${JSON.stringify(inner)}`);
  assert((await srow.getByTestId("task-progress").textContent()).includes("0/6"), "progress 0/6");
  await shot(s, "v2-student-1440");
  const sBefore = await counts();
  await srow.locator("[data-kind=LISTENING]").click();
  await s.waitForURL(`${BASE}/learn/tasks/${taskId}`);
  await s.locator("[data-testid=topic-lesson][data-phase=intro][data-step='0']").waitFor();
  assert(JSON.stringify(sBefore) === JSON.stringify(await counts()), "tapping an icon recorded nothing");
  log("student: tapping the Listening icon opens the topic's lesson at step 1 (no single step opens, nothing recorded)");

  // A direct URL to a later step goes back to the lesson; the current step opens.
  await s.goto(`${BASE}/learn/tasks/${taskId}/${acts.at(-1).id}`);
  await s.waitForURL(`${BASE}/learn/tasks/${taskId}`);
  await s.goto(`${BASE}/learn/tasks/${taskId}/${acts[0].id}`);
  assert(s.url().endsWith(acts[0].id), "the current step opens by URL");
  log("direct URL: a later step redirects to the lesson; the current one opens");

  // Resume: after finishing step 1 the row and the lesson continue at step 2.
  await db.activityProgress.create({ data: { activityId: acts[0].id, studentId: (await db.student.findFirst({ where: { classroomId: classId } })).id, completedAt: new Date() } });
  await s.goto(`${BASE}/learn`);
  assert((await srow.getByTestId("task-progress").textContent()).includes("1/6"), "progress 1/6");
  await srow.locator(".topic-thumb").click();
  await s.locator("[data-testid=topic-lesson][data-phase=intro][data-step='1']").waitFor();
  await s.goto(`${BASE}/learn/tasks/${taskId}/${acts[2].id}`);
  await s.waitForURL(`${BASE}/learn/tasks/${taskId}`);
  log("resume: the row opens the lesson at the next unfinished step; step 3 is still locked");

  // Hover on the student row too, keyboard focus on the row link.
  await s.goto(`${BASE}/learn`);
  await srow.focus();
  const sring = await srow.evaluate((el) => getComputedStyle(el).outlineStyle);
  assert(sring === "solid", "student row focus ring");

  // ── Phones ──
  for (const [who, ctxOpts, url, name] of [["teacher", tctx, `${BASE}/teacher/library`, "v2-teacher-390"], ["student", sctx, `${BASE}/learn`, "v2-student-390"]]) {
    const st = await ctxOpts.storageState();
    const mctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, storageState: st });
    const m = watch(await mctx.newPage());
    await m.goto(url);
    const r = m.locator(who === "teacher" ? "[data-testid=topic-row]" : "[data-testid=student-task]").filter({ hasText: `Escuchar ${stamp}` });
    await r.scrollIntoViewIfNeeded();
    const wide = await m.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    assert(!wide, `${who}: no sideways scroll at 390 px`);
    const th = await r.locator(".topic-thumb").boundingBox();
    assert(th.width <= 64.5, `${who}: smaller thumbnail on a phone (${th.width})`);
    const rb = await r.boundingBox();
    const out = await r.locator(".topic-access").evaluateAll((a, b) => a.filter((x) => { const q = x.getBoundingClientRect(); return q.right > b.x + b.width + 0.5; }).length, rb);
    assert(out === 0, `${who}: icons wrap inside the row`);
    await r.evaluate((el) => el.scrollIntoView({ block: "start" }));
    await m.evaluate(() => window.scrollBy(0, -(document.querySelector("header")?.getBoundingClientRect().height ?? 0) - 12));
    await shot(m, name);
    await mctx.close();
  }
  log("phones (390 px): smaller thumbnail, icons wrap, no sideways scroll for teacher and student");

  assert(errors.length === 0, `page errors: ${errors.join(" | ")}`);
  log("ALL TOPIC ROW V2 CHECKS PASSED");
} catch (e) {
  console.error("FAILED:", e.message);
  process.exitCode = 1;
} finally {
  await browser.close();
  await db.$disconnect();
}
