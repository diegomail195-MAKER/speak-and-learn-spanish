// Protected videos: the play circle on a lesson's video starts it, nothing offers a download, the
// file can't be opened as a page, the teacher's Student View has every control (skipping ahead
// works) and the student can rewind but never skip past what they watched.
// Needs the local videos: node e2e/seed-topic-videos.mjs.
// Run: BASE_URL=http://localhost:3100 node e2e/video-protect.e2e.mjs
import { chromium } from "playwright";
import path from "node:path";
import { addStudent } from "./class-helpers.mjs";

const BASE = process.env.BASE_URL ?? "http://localhost:3100";
const SHOTS = process.env.SCREENSHOTS;
const stamp = Date.now();
const log = (...a) => console.log("•", ...a);
const assert = (c, m) => {
  if (!c) throw new Error(m);
};
const shot = async (p, name) => SHOTS && p.screenshot({ path: path.join(SHOTS, `${name}.png`) });
const errors = [];
const watch = (p) => {
  p.on("pageerror", (e) => errors.push(e.message));
  return p;
};
const vid = (p) => p.locator("[data-testid=lesson-activity] video[data-testid=video-file]");
const state = (p) => vid(p).evaluate((v) => ({ t: v.currentTime, paused: v.paused, list: v.getAttribute("controlslist"), d: v.duration }));

const browser = await chromium.launch({ args: ["--autoplay-policy=no-user-gesture-required"] });
const desktop = { viewport: { width: 1366, height: 900 }, deviceScaleFactor: 1 };
let exit = 0;
try {
  const page = watch(await (await browser.newContext(desktop)).newPage());
  await page.goto(`${BASE}/signup`);
  await page.fill("#displayName", "Ana Rivera");
  await page.fill("#schoolName", "Colegio Video");
  await page.fill("#email", `vprot${stamp}@school.test`);
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

  // ── Teacher: Student View. The play circle starts the video; every control but download. ──
  await page.goto(`${BASE}/teacher/library/topics/greetings/student-view`);
  await page.locator("[data-testid=topic-lesson][data-phase=intro]").waitFor();
  await shot(page, "vp1-intro-play-button");
  await page.getByTestId("lesson-thumb-play").click();
  await page.locator("[data-testid=topic-lesson][data-phase=play]").waitFor();
  await vid(page).waitFor();
  await page.waitForFunction(() => {
    const v = document.querySelector("[data-testid=lesson-activity] video");
    return v && !v.paused && v.currentTime > 0.3;
  }, null, { timeout: 10000 });
  let st = await state(page);
  assert(st.list.includes("nodownload") && !st.list.includes("noplaybackrate"), `teacher controlslist ${st.list}`);
  await shot(page, "vp2-teacher-playing");
  await vid(page).evaluate((v) => (v.currentTime = v.duration - 1));
  await page.waitForTimeout(400);
  st = await state(page);
  assert(st.t >= st.d - 1.5, `teacher can skip ahead (t=${st.t})`);
  const blocked = await vid(page).evaluate((v) => {
    const e = new MouseEvent("contextmenu", { bubbles: true, cancelable: true });
    return !v.dispatchEvent(e);
  });
  assert(blocked, "right-click menu is turned off");
  log("teacher: play circle starts the video, skipping ahead works, no download, no right-click menu");

  // The file itself can't be opened in a tab (where "Save as…" would work).
  const src = await vid(page).getAttribute("src");
  const tab = await page.context().newPage();
  const resp = await tab.goto(`${BASE}${src}`);
  assert(resp.status() === 403, `opening the video file as a page: ${resp.status()}`);
  await tab.close();
  log("opening the video file in a tab is refused (403)");

  // ── Assign the whole topic to Diego ──
  await page.goto(`${BASE}/teacher/library/topics/greetings`);
  await page.getByRole("link", { name: "Assign whole topic" }).click();
  await page.check("fieldset:has(legend:text-is('Individual students')) label:has-text('Diego') input");
  await page.click("button:text-is('Next: choose a topic')");
  await page.click("button:text-is('Next: confirm')");
  await page.click("button:text-is('Assign Task')");
  await page.waitForURL(/\/teacher\/tasks\/[^/?]+\?new=1/);
  const taskId = new URL(page.url()).pathname.split("/").at(-1);

  // ── Student: rewinding works, skipping ahead doesn't, Next stays locked ──
  const s = watch(await (await browser.newContext(desktop)).newPage());
  await s.goto(`${BASE}/student/${code}`);
  await s.click("button:has-text('Diego')");
  for (const d of pin) await s.click(`button:text-is('${d}')`);
  await s.click("text=Go!");
  await s.waitForURL(`${BASE}/learn`);
  await s.goto(`${BASE}/learn/tasks/${taskId}`);
  await s.locator("[data-testid=topic-lesson][data-phase=intro][data-step='0']").waitFor();
  await s.getByTestId("lesson-thumb-play").click();
  await vid(s).waitFor();
  await s.waitForFunction(() => {
    const v = document.querySelector("[data-testid=lesson-activity] video");
    return v && !v.paused && v.currentTime > 2;
  }, null, { timeout: 10000 });
  st = await state(s);
  assert(st.list.includes("nodownload") && st.list.includes("noplaybackrate"), `student controlslist ${st.list}`);
  const before = st.t;
  await vid(s).evaluate((v) => (v.currentTime = v.duration - 0.5));
  await s.waitForTimeout(500);
  st = await state(s);
  assert(st.t < before + 1.5, `student skipped ahead to ${st.t} (was ${before})`);
  assert(await s.getByTestId("lesson-next").isDisabled(), "Next unlocked after a skip");
  await vid(s).evaluate((v) => (v.currentTime = 0.2));
  await s.waitForTimeout(400);
  st = await state(s);
  assert(st.t < 1.5, `student can rewind (t=${st.t})`);
  await vid(s).evaluate((v) => (v.playbackRate = 2));
  assert((await vid(s).evaluate((v) => v.playbackRate)) <= 1.25, "student speed capped");
  await shot(s, "vp3-student-playing");
  log("student: skipping ahead is undone, rewinding works, speed capped, Next stays locked");
  // Watching to the end unlocks Next.
  await s.waitForFunction(() => !document.querySelector("[data-testid=lesson-next]")?.disabled, null, { timeout: 20000 });
  log("student: watching to the end unlocks Next");

  assert(errors.length === 0, `page errors: ${errors.join(" | ")}`);
  log("all good");
} catch (e) {
  console.error("✗", e.message);
  exit = 1;
} finally {
  await browser.close();
  process.exit(exit);
}
