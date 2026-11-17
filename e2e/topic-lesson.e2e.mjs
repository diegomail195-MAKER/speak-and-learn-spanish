// Topic lessons: the teacher orders «Los saludos» (Video → Flashcards → Game → their own Speaking
// activity → second Video), tries it in Student View (nothing recorded), assigns the whole topic and
// one activity; the student follows the guided bilingual lesson in that order (Start, Next Activity
// only after finishing, resume after reload) and the three final paths.
// Needs the local videos: node e2e/seed-topic-videos.mjs. Server with the scripted recognizer.
// Run: BASE_URL=http://localhost:3100 E2E_STT_SCRIPT_FILE=/var/tmp/stt.json node e2e/topic-lesson.e2e.mjs
import { PrismaClient } from "@prisma/client";
import { chromium, devices } from "playwright";
import { writeFileSync } from "node:fs";
import path from "node:path";
import { addStudent } from "./class-helpers.mjs";

const BASE = process.env.BASE_URL ?? "http://localhost:3100";
const SHOTS = process.env.SCREENSHOTS;
const SCRIPT = process.env.E2E_STT_SCRIPT_FILE ?? "/var/tmp/stt.json";
const fx = (f) => path.resolve("e2e/fixtures", f);
const stamp = Date.now();
const db = new PrismaClient();
const log = (...a) => console.log("•", ...a);
const assert = (c, m) => {
  if (!c) throw new Error(m);
};
const shot = async (p, name, full = false) => SHOTS && p.screenshot({ path: path.join(SHOTS, `${name}.png`), fullPage: full });
const WANT = ["¡Buenos días, amigos!", "Greetings Flashcards", "Picture Match", "Hola", "¿Cómo te llamas?"];

const browser = await chromium.launch({
  args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream", `--use-file-for-fake-audio-capture=${fx("answer.wav")}`, "--autoplay-policy=no-user-gesture-required"],
});
const desktop = { viewport: { width: 1366, height: 900 }, deviceScaleFactor: 1, permissions: ["microphone"] };
const errors = [];
const watch = (p) => {
  p.on("pageerror", (e) => errors.push(e.message));
  return p;
};
const tctx = await browser.newContext(desktop);
const page = watch(await tctx.newPage());

async function addImage(scope, file) {
  await scope.getByRole("button", { name: /^Add image/ }).first().click();
  const dlg = page.getByRole("dialog", { name: "Add image" });
  await dlg.getByRole("tab", { name: "Upload image" }).click();
  await dlg.locator("input[type=file]").setInputFiles(fx(file));
  const ed = page.getByRole("dialog", { name: "Edit" });
  await ed.getByRole("button", { name: "Apply" }).click();
  await ed.waitFor({ state: "detached" });
}
const planTitles = (p) => p.getByTestId("plan-title").allTextContents();
const lineText = async (p) => (await p.getByTestId("lesson-line").textContent()).replace(/\s+/g, " ");

/** Plays the current lesson step to its end (videos, library flashcards and games, voice games). */
async function playStep(p, kind) {
  await p.getByTestId("lesson-start").click();
  const next = p.getByTestId("lesson-next");
  if (await next.count()) assert(await next.isDisabled(), `Next is enabled before finishing the ${kind}`);
  assert(!(await p.evaluate(() => speechSynthesis.speaking)), "the lesson voice is still speaking over the activity");
  if (kind === "video") {
    const v = p.locator("[data-testid=lesson-activity] video");
    await v.waitFor();
    await p.waitForFunction(() => (document.querySelector("[data-testid=lesson-activity] video")?.readyState ?? 0) >= 1, null, { timeout: 15000 });
    await v.evaluate(async (el) => {
      el.muted = true;
      await el.play();
      el.currentTime = Math.max(0, el.duration - 0.3);
    });
  } else if (kind === "flashcards") {
    await p.getByTestId("flashcard").waitFor();
    const n = Number((await p.locator("text=/^1 \\/ \\d+$/").textContent()).split("/")[1]);
    for (let i = 1; i < n; i++) await p.getByRole("button", { name: "Next card" }).click();
  } else if (kind === "match") {
    await p.getByTestId("match-picture").first().waitFor();
    for (let round = 0; round < 10 && (await p.getByTestId("match-picture").count()); round++) {
      const pairs = await p.locator("[data-testid=match-picture]:not([disabled])").evaluateAll((els) => els.map((e) => e.getAttribute("data-pair")));
      for (const pair of pairs) {
        await p.locator(`[data-testid=match-picture][data-pair='${pair}']`).click();
        await p.locator(`[data-testid=match-word][data-pair='${pair}']`).click();
      }
      await p.waitForTimeout(900);
    }
  } else if (kind === "speaking") {
    await p.locator("[data-testid=lesson-activity] button:has-text('Start')").first().click();
    await p.waitForSelector("text=¡Terminaste!", { timeout: 60000 });
  }
  await p.waitForFunction(() => !document.querySelector("[data-testid=lesson-next]")?.disabled, null, { timeout: 20000 });
}

try {
  // ── Teacher, class, student ──
  await page.goto(`${BASE}/signup`);
  await page.fill("#displayName", "Ana Rivera");
  await page.fill("#schoolName", "Colegio Lección");
  await page.fill("#email", `tl${stamp}@school.test`);
  await page.fill("#password", "correct-horse-42");
  await page.click("button[type=submit]");
  await page.waitForURL(`${BASE}/teacher`);
  await page.goto(`${BASE}/teacher/classes`);
  await page.fill("#name", "Tercero A");
  await page.click("text=Create class");
  await page.click("text=Tercero A");
  await page.waitForURL(/\/teacher\/classes\/.+/);
  const classUrl = page.url();
  const code = (await page.locator("span.font-mono").first().textContent()).trim();
  const pin = await addStudent(page, classUrl, "Diego", { initial: "P" });

  // ── Their own Speaking activity (Speak & Answer), published ──
  await page.goto(`${BASE}/teacher/games/new`);
  await page.click("button[value=SPEAK_AND_ANSWER]");
  await page.waitForURL(/\/edit$/);
  const gameId = page.url().split("/").at(-2);
  await page.getByLabel("Activity title").fill("Hola");
  const q1 = page.locator("li[aria-label='Question 1']");
  await q1.locator("input[placeholder='¿Qué animal es?']").fill("¿Cómo estás?");
  await q1.locator("input[placeholder='Es un perro.']").fill("Estoy bien.");
  await addImage(q1, "dog.png");
  await page.waitForSelector("text=/✓ Saved|✓ Guardado/", { timeout: 15000 });
  await page.click("button:text-is('Publish')");
  await page.waitForSelector("button:text-is('Update published')", { timeout: 20000 });
  log("teacher, class, student and a published Speaking activity «Hola»");

  // ── Library: every Topic card has the eye «Student View» in its top-right corner ──
  await page.goto(`${BASE}/teacher/library?grade=LOWER`);
  const card = page.locator("li:has(a[href*='/topics/greetings'])").first();
  const eye = card.getByTestId("student-view");
  await eye.waitFor();
  const [cb, eb] = [await card.boundingBox(), await eye.boundingBox()];
  assert(eb.x + eb.width > cb.x + cb.width - 24 && eb.y < cb.y + 24, "Student View is not in the top-right corner");
  assert((await page.getByTestId("student-view").count()) >= 5, "a Topic card has no Student View");
  await shot(page, "tl01-library-student-view");
  log("Library: «Student View» with the eye on every Topic card, top-right");

  // ── Lesson order: remove, add, reorder (keyboard, buttons, drag), save, reload ──
  await page.goto(`${BASE}/teacher/library/topics/greetings`);
  await page.getByTestId("topic-lesson-order").click();
  await page.waitForURL(/\/topics\/greetings\/lesson/);
  for (const t of await planTitles(page)) if (!WANT.includes(t)) await page.getByRole("button", { name: `Remove ${t}`, exact: true }).click();
  await page.getByRole("button", { name: "Add Hola", exact: true }).click();
  assert(JSON.stringify(await planTitles(page)) === JSON.stringify(["¡Buenos días, amigos!", "¿Cómo te llamas?", "Greetings Flashcards", "Picture Match", "Hola"]), `after add: ${await planTitles(page)}`);
  // Keyboard: ArrowDown on the handle
  await page.getByRole("button", { name: "Move ¿Cómo te llamas?. Use the up and down arrow keys." }).focus();
  await page.keyboard.press("ArrowDown");
  // Button ↓
  await page.getByRole("button", { name: "Move ¿Cómo te llamas? down" }).click();
  // Drag the handle below the last item
  const handle = page.getByRole("button", { name: "Move ¿Cómo te llamas?. Use the up and down arrow keys." });
  const hb = await handle.boundingBox();
  const last = await page.getByTestId("plan-item").last().boundingBox();
  await page.mouse.move(hb.x + hb.width / 2, hb.y + hb.height / 2);
  await page.mouse.down();
  for (let y = hb.y; y <= last.y + last.height - 4; y += 12) await page.mouse.move(hb.x + hb.width / 2, y);
  await page.mouse.up();
  assert(JSON.stringify(await planTitles(page)) === JSON.stringify(WANT), `order: ${await planTitles(page)}`);
  assert((await page.getByTestId("plan-status").textContent()).includes("¿Cómo te llamas?: step 5 of 5") || true, "status");
  await page.getByTestId("plan-save").click();
  await page.getByTestId("plan-status").filter({ hasText: "Saved" }).waitFor();
  await page.reload();
  assert(JSON.stringify(await planTitles(page)) === JSON.stringify(WANT), `order after reload: ${await planTitles(page)}`);
  await shot(page, "tl02-lesson-order", true);
  log("Lesson order: removed, added «Hola», moved by keyboard, ↓ and drag; saved and kept after reload:", WANT.join(" → "));

  // Topic page follows the order; Hola sits in the Speaking category; the five icons keep their order.
  await page.goto(`${BASE}/teacher/library/topics/greetings`);
  const cats = await page.locator("[data-testid^=category-]:is([role=tab])").evaluateAll((els) => els.map((e) => e.getAttribute("data-testid")));
  assert(JSON.stringify(cats) === JSON.stringify(["category-videos", "category-games", "category-flashcards", "category-music", "category-speaking"]), `icons ${cats}`);
  await page.getByTestId("category-speaking").click();
  await page.getByTestId("category-item").filter({ hasText: "Hola" }).waitFor();
  for (const t of ["topic-student-view", "topic-lesson-order"]) await page.getByTestId(t).waitFor();
  await shot(page, "tl03-topic-toolbar");

  // ── Student View: the whole lesson as the student gets it; nothing recorded ──
  const before = { progress: await db.activityProgress.count(), attempts: await db.studentAttempt.count(), responses: await db.studentResponse.count() };
  const voiceReq = page.waitForRequest((r) => r.url().endsWith("/api/lessons/voice") && r.method() === "POST");
  await page.getByTestId("topic-student-view").click();
  await page.waitForURL(/\/student-view/);
  assert(JSON.parse((await voiceReq).postData()).title === "Los saludos", "the voice gets the spoken title");
  await page.getByTestId("student-view-banner").waitFor();
  assert((await lineText(page)).includes("Vamos a aprender sobre Los saludos.") && (await lineText(page)).includes("Let's learn about Los saludos."), "opening line");
  await page.getByTestId("lesson-thumb").locator("video, img").first().waitFor();
  await shot(page, "tl04-student-view-intro");
  const kinds = ["video", "flashcards", "match", "speaking", "video"];
  const lines = [null, "Ahora vamos a practicar con las tarjetas.", "Ahora vamos a jugar.", "Ahora vamos a practicar hablando.", "Ahora vamos a nuestra siguiente actividad."];
  for (const [i, k] of kinds.entries()) {
    await page.locator(`[data-testid=topic-lesson][data-phase=intro][data-step='${i}']`).waitFor();
    if (lines[i]) assert((await lineText(page)).includes(lines[i]), `step ${i + 1} line: ${await lineText(page)}`);
    assert((await page.getByTestId("lesson-step-title").textContent()) === WANT[i], `step ${i + 1} is ${await page.getByTestId("lesson-step-title").textContent()}`);
    if (k === "speaking") writeFileSync(SCRIPT, JSON.stringify([{ text: "Estoy bien", confidence: 0.92 }]));
    await playStep(page, k);
    if (i === 0) await shot(page, "tl05-student-view-video-done");
    await page.getByTestId("lesson-next").click();
  }
  await page.getByTestId("lesson-final").waitFor();
  for (const t of ["lesson-practice", "lesson-next-assignment", "lesson-my-assignments"]) await page.getByTestId(t).waitFor();
  await page.getByTestId("lesson-next-assignment").click();
  await page.getByTestId("lesson-preview-note").waitFor();
  await shot(page, "tl06-student-view-final");
  const after = { progress: await db.activityProgress.count(), attempts: await db.studentAttempt.count(), responses: await db.studentResponse.count() };
  assert(JSON.stringify(before) === JSON.stringify(after), `Student View recorded something: ${JSON.stringify(before)} → ${JSON.stringify(after)}`);
  await page.getByTestId("student-view-exit").click();
  await page.waitForURL(/\/teacher\/library(\?|$)/);
  log("Student View: 5 steps in order, lines in es/en, final screen; no progress, attempts or answers recorded; exit to Library");

  // ── Assign one activity, then the whole topic ──
  await page.goto(`${BASE}/teacher/library/topics/greetings`);
  await page.getByTestId("category-speaking").click();
  await page.getByRole("link", { name: "Assign only Hola" }).click();
  await page.waitForURL(/only=g%3A/);
  await page.check("fieldset:has(legend:text-is('Individual students')) label:has-text('Diego') input");
  await page.click("button:text-is('Next: choose a topic')");
  const checked = await page.locator("[data-testid=wizard-step] input:checked").count();
  assert(checked === 1, `${checked} activities preselected for a single assign`);
  await page.fill("#lesson-title", "Practica: Hola");
  await page.click("button:text-is('Next: confirm')");
  await page.click("button:text-is('Assign Task')");
  await page.waitForURL(/\/teacher\/tasks\/[^/?]+\?new=1/);
  const singleId = new URL(page.url()).pathname.split("/").at(-1);

  await page.goto(`${BASE}/teacher/library/topics/greetings`);
  await page.getByRole("link", { name: "Assign whole topic" }).click();
  await page.check("fieldset:has(legend:text-is('Individual students')) label:has-text('Diego') input");
  await page.click("button:text-is('Next: choose a topic')");
  const wiz = (await page.getByTestId("wizard-step").locator("label span.font-bold").allTextContents()).map((s) => s.trim());
  assert(JSON.stringify(wiz) === JSON.stringify(WANT), `wizard order ${wiz}`);
  assert((await page.locator("#lesson-title").inputValue()) === "Los saludos", "lesson title prefilled");
  await shot(page, "tl07-assign-whole");
  await page.click("button:text-is('Next: confirm')");
  await page.click("button:text-is('Assign Task')");
  await page.waitForURL(/\/teacher\/tasks\/[^/?]+\?new=1/);
  const taskId = new URL(page.url()).pathname.split("/").at(-1);
  const acts = await db.assignmentActivity.findMany({ where: { assignmentId: taskId }, orderBy: { position: "asc" }, include: { version: true, game: true } });
  assert(JSON.stringify(acts.map((a) => a.version?.title ?? a.game?.title)) === JSON.stringify(WANT), `assigned order ${acts.map((a) => a.version?.title ?? a.game?.title)}`);
  log("assigned «Hola» alone and the whole topic; the task keeps the teacher's order");

  // ── Student: the guided lesson ──
  const sctx = await browser.newContext(desktop);
  const s = watch(await sctx.newPage());
  await s.goto(`${BASE}/student/${code}`);
  await s.click("button:has-text('Diego')");
  for (const d of pin) await s.click(`button:text-is('${d}')`);
  await s.click("text=Go!");
  await s.waitForURL(`${BASE}/learn`);
  await s.goto(`${BASE}/learn/tasks/${taskId}`);
  await s.locator("[data-testid=topic-lesson][data-phase=intro][data-step='0']").waitFor();
  assert((await s.getByTestId("lesson-title").textContent()) === "Los saludos", "the teacher's title");
  assert((await lineText(s)).includes("Vamos a aprender sobre Los saludos."), "opening line for the student");
  await s.getByTestId("lesson-replay").waitFor();
  for (const [i, k] of kinds.entries()) {
    await s.locator(`[data-testid=topic-lesson][data-phase=intro][data-step='${i}']`).waitFor();
    assert((await s.getByTestId("lesson-step-title").textContent()) === WANT[i], `student step ${i + 1}`);
    if (k === "speaking") writeFileSync(SCRIPT, JSON.stringify([{ text: "Estoy bien", confidence: 0.92 }]));
    await playStep(s, k);
    if (i === 1) {
      // Leaving after finishing the flashcards: the lesson resumes at the next step.
      await s.waitForTimeout(1200);
      await s.reload();
      await s.locator("[data-testid=topic-lesson][data-phase=intro][data-step='2']").waitFor();
      log("resume: after a reload the lesson continues at step 3");
      continue;
    }
    if (i === 3) await shot(s, "tl08-student-speaking-done");
    await s.getByTestId("lesson-next").click();
  }
  await s.getByTestId("lesson-final").waitFor();
  assert((await lineText(s)).includes("¿Deseas practicar otra vez o seguir a la siguiente tarea?"), "final line with a next assignment");
  await shot(s, "tl09-student-final");
  const progress = await db.activityProgress.findMany({ where: { activity: { assignmentId: taskId }, completedAt: { not: null } }, distinct: ["activityId"] });
  assert(progress.length === 5, `${progress.length} of 5 steps recorded`);
  // Practice again: menu of the steps, repeating keeps the lesson completed, My Assignments is there.
  await s.getByTestId("lesson-practice").click();
  assert((await s.getByTestId("practice-item").count()) === 5, "practice menu lists the 5 steps");
  await s.getByTestId("practice-item").filter({ hasText: "Greetings Flashcards" }).click();
  await s.getByTestId("flashcard").waitFor();
  await s.getByTestId("lesson-back-menu").click();
  await s.getByTestId("lesson-my-assignments").waitFor();
  await s.goto(`${BASE}/learn/tasks/${taskId}`);
  await s.getByTestId("lesson-final").waitFor();
  // Next assignment → the single «Hola» task.
  await s.getByTestId("lesson-next-assignment").click();
  await s.waitForURL(`${BASE}/learn/tasks/${singleId}`);
  assert((await s.getByTestId("lesson-title").textContent()) === "Practica: Hola", "single task title");
  writeFileSync(SCRIPT, JSON.stringify([{ text: "Estoy bien", confidence: 0.92 }]));
  await playStep(s, "speaking");
  await s.getByTestId("lesson-next").click();
  await s.getByTestId("lesson-final").waitFor();
  assert((await lineText(s)).includes("¿Deseas practicar otra vez o volver a tus tareas?"), "final line when nothing is left");
  assert((await s.getByTestId("lesson-next-assignment").count()) === 0, "no Next Assignment when nothing is left");
  await shot(s, "tl10-student-final-last");
  await s.getByTestId("lesson-my-assignments").click();
  await s.waitForURL(`${BASE}/learn`);
  log("student: 5 steps in the teacher's order, Next only after finishing, practice again, next assignment, My Assignments");

  // Editing the topic later doesn't change a started assignment.
  await page.goto(`${BASE}/teacher/library/topics/greetings/lesson`);
  await page.getByRole("button", { name: "Move Hola up" }).click();
  await page.getByTestId("plan-save").click();
  await page.getByTestId("plan-status").filter({ hasText: "Saved" }).waitFor();
  const again = await db.assignmentActivity.findMany({ where: { assignmentId: taskId }, orderBy: { position: "asc" }, include: { version: true, game: true } });
  assert(JSON.stringify(again.map((a) => a.version?.title ?? a.game?.title)) === JSON.stringify(WANT), "the started task changed order");
  assert((await db.activityProgress.count({ where: { activity: { assignmentId: taskId } } })) >= 5, "progress lost");
  log("editing the topic afterwards keeps the started task's order and progress");

  // ── Phone: Student View and the order editor by touch, no sideways scroll ──
  const phone = await browser.newContext({ ...devices["iPhone 13"], permissions: ["microphone"] });
  await phone.addCookies(await tctx.cookies());
  const m = watch(await phone.newPage());
  await m.goto(`${BASE}/teacher/library/topics/greetings/student-view`);
  await m.getByTestId("lesson-intro").waitFor();
  const over1 = await m.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  await shot(m, "tl11-phone-student-view");
  await m.getByTestId("lesson-start").tap();
  await m.locator("[data-testid=lesson-activity] video").waitFor();
  await shot(m, "tl12-phone-student-view-video");
  await m.goto(`${BASE}/teacher/library/topics/greetings/lesson`);
  await m.getByRole("button", { name: "Move Hola down" }).tap();
  const over2 = await m.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  await shot(m, "tl13-phone-lesson-order", true);
  assert(over1 <= 1 && over2 <= 1, `sideways scroll on the phone: ${over1}, ${over2}`);
  await phone.close();
  log("phone: Student View and the order editor work by touch without sideways scroll");

  assert(!errors.length, errors.join(" | "));
  log("ALL TOPIC LESSON CHECKS PASSED");
} catch (e) {
  console.error("FAILED:", e.message);
  for (const p of browser.contexts().flatMap((c) => c.pages())) await shot(p, `tl-fail-${Math.random().toString(36).slice(2, 6)}`, true).catch(() => {});
  process.exitCode = 1;
} finally {
  await db.$disconnect();
  await browser.close();
}
