// Library › Videos (PBS KIDS-style gallery): featured video, rows by topic, arrows, keyboard,
// touch swipe, watch page with the topic's other videos, and returning to the same spot.
// Needs videos: node e2e/seed-library-videos.mjs (local DB).
// Run: BASE_URL=http://localhost:3100 SCREENSHOTS=/tmp/shots node e2e/library-videos.e2e.mjs
import { chromium, devices } from "playwright";
import path from "node:path";
import { addStudent } from "./class-helpers.mjs";

const BASE = process.env.BASE_URL ?? "http://localhost:3100";
const SHOTS = process.env.SCREENSHOTS;
const stamp = Date.now();
const log = (...a) => console.log("•", ...a);
const assert = (c, m) => {
  if (!c) throw new Error(m);
};
const shot = async (p, name, full = false) => SHOTS && p.screenshot({ path: path.join(SHOTS, `${name}.png`), fullPage: full });
const browser = await chromium.launch({ args: ["--autoplay-policy=no-user-gesture-required"] });
const errors = [];
const GALLERY = `${BASE}/teacher/library?grade=LOWER&type=VIDEO`;

async function signup(ctx) {
  const page = await ctx.newPage();
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(`${BASE}/signup`);
  await page.fill("#displayName", "Ana Rivera");
  await page.fill("#schoolName", "Colegio Voz");
  await page.fill("#email", `lv${stamp}@school.test`);
  await page.fill("#password", "correct-horse-42");
  await page.click("button[type=submit]");
  await page.waitForURL(`${BASE}/teacher`);
  return page;
}

try {
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 }, deviceScaleFactor: 1 });
  const page = await signup(ctx);
  const cookies = await ctx.cookies();

  await page.goto(GALLERY);
  await page.getByTestId("video-featured").waitFor();
  const rows = await page.getByTestId("video-row").count();
  assert(rows >= 5, `rows by topic: ${rows}`);
  const titles = await page.locator("[data-testid=video-row] h2").allTextContents();
  log("rows:", titles.map((t) => t.split(" ·")[0]).join(" | "));
  assert(titles[0].startsWith("Los saludos"), "topic order");
  const featured = await page.getByTestId("featured-card").getAttribute("aria-label");
  assert(/Music video/.test(featured), `featured is a music video: ${featured}`);
  log("featured:", featured);
  // Durations come from the files' metadata (thumbnails load when a row comes near the screen).
  await page.getByTestId("video-row").first().scrollIntoViewIfNeeded();
  await page.waitForFunction(() => document.querySelectorAll("[data-testid=video-thumb] .tabular-nums").length >= 4, null, { timeout: 15000 });
  await page.evaluate(() => window.scrollTo(0, 0));
  await shot(page, "lv1-gallery-desktop");
  await page.evaluate(() => window.scrollTo(0, document.querySelector("[data-testid=topic-band]").getBoundingClientRect().top + window.scrollY - 20));
  await page.waitForTimeout(300);
  await shot(page, "lv1b-rows");

  // Arrows: «Los saludos» has 9 videos → next arrow visible, prev hidden.
  const row0 = page.getByTestId("video-row").first();
  const prev = row0.getByTestId("row-prev");
  const next = row0.getByTestId("row-next");
  assert((await prev.evaluate((b) => getComputedStyle(b).opacity)) === "0", "prev hidden at the start");
  assert((await next.evaluate((b) => getComputedStyle(b).opacity)) === "1", "next visible when there is more");
  // A short row (Los animales, 1 video) shows no arrows.
  const animals = page.getByTestId("video-row").filter({ has: page.locator("h2", { hasText: /^Los animales · Animals$/ }) });
  assert((await animals.getByTestId("row-next").evaluate((b) => getComputedStyle(b).opacity)) === "0", "no arrows without overflow");

  // Hover: a ring around the thumbnail, the neighbours don't move.
  const cards = row0.getByTestId("video-card");
  const boxesBefore = await Promise.all([0, 1, 2].map(async (i) => JSON.stringify(await cards.nth(i).boundingBox())));
  await cards.nth(1).hover();
  await page.waitForTimeout(400);
  const ring = await cards.nth(1).getByTestId("video-thumb").evaluate((e) => getComputedStyle(e).boxShadow);
  assert(/rgb\(98, 13, 120\)/.test(ring), `hover ring: ${ring}`);
  const boxesAfter = await Promise.all([0, 1, 2].map(async (i) => JSON.stringify(await cards.nth(i).boundingBox())));
  assert(boxesBefore.join() === boxesAfter.join(), "hover moves nothing");
  await shot(page, "lv2-hover");
  log("hover: ring", ring.slice(0, 40), "· cards did not move");

  await next.click();
  await page.waitForTimeout(700);
  const left = await row0.locator("ul").evaluate((u) => u.scrollLeft);
  assert(left > 200, `next arrow pages the row: ${left}`);
  assert((await prev.evaluate((b) => getComputedStyle(b).opacity)) === "1", "prev shows after paging");
  await prev.click();
  await page.waitForTimeout(700);
  log("arrows page the row:", left, "px");

  // Keyboard: one Tab stop per row, arrows move inside it, focus ring visible.
  await page.mouse.move(5, 5);
  await cards.first().focus();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  const focused = await page.evaluate(() => document.activeElement?.getAttribute("aria-label"));
  const focusIndex = await cards.evaluateAll((els) => els.indexOf(document.activeElement));
  assert(focusIndex === 5, `arrow keys moved focus: ${focusIndex}`);
  await page.waitForTimeout(500);
  const focusRing = await cards.nth(5).getByTestId("video-thumb").evaluate((e) => getComputedStyle(e).boxShadow);
  assert(/rgb\(255, 81, 72\)/.test(focusRing), `focus ring: ${focusRing}`);
  const rowLeft = await row0.locator("ul").evaluate((u) => u.scrollLeft);
  assert(rowLeft > 0, "row scrolled to the focused card");
  const tabbable = await cards.evaluateAll((els) => els.filter((e) => e.tabIndex === 0).length);
  assert(tabbable === 1, `one Tab stop per row: ${tabbable}`);
  await page.keyboard.press("Tab");
  const nextRowFocus = await page.evaluate(() => document.activeElement?.closest("[data-testid=video-row]")?.querySelector("h2")?.textContent);
  assert(nextRowFocus && !nextRowFocus.startsWith("Los saludos"), `Tab leaves the row: ${nextRowFocus}`);
  await page.keyboard.press("Shift+Tab");
  await shot(page, "lv3-keyboard-focus");
  log("keyboard:", focused, "· row scrollLeft", rowLeft);

  // Scroll the page a bit, then open the focused card with Enter.
  await page.evaluate(() => window.scrollBy(0, 260));
  await cards.nth(5).focus({ preventScroll: true });
  const y0 = await page.evaluate(() => Math.round(window.scrollY));
  const left0 = await row0.locator("ul").evaluate((u) => Math.round(u.scrollLeft));
  const title5 = (await cards.nth(5).locator("span.line-clamp-2").textContent()).trim();
  await page.keyboard.press("Enter");
  await page.waitForURL(/\/teacher\/library\/videos\//);
  await page.getByTestId("watch-title").filter({ hasText: title5 }).waitFor();
  await page.waitForFunction(() => {
    const v = document.querySelector("[data-testid=watch-stage] video");
    return v && !v.paused && v.currentTime > 0.2;
  }, null, { timeout: 15000 });
  const related = await page.getByTestId("watch-related").getByTestId("video-card").count();
  const now = await page.getByTestId("watch-related").locator("[aria-current=true]").getAttribute("aria-label");
  assert(related === 9 && /now playing/.test(now), `related row: ${related}, ${now}`);
  assert(await page.getByTestId("watch-next").isVisible(), "next video button");
  const external = await page.locator("[data-testid=video-watch] a[href^=http]").count();
  assert(external === 0, "no external links on the watch page");
  await shot(page, "lv4-watch");
  log("watch:", title5, "plays in the platform player · related", related);

  // Next video, then back to the gallery.
  await page.getByTestId("watch-next").click();
  await page.waitForFunction((t) => document.querySelector("[data-testid=watch-title]")?.textContent !== t, title5);
  await page.getByTestId("back-to-videos").click();
  await page.waitForURL(/type=VIDEO/);
  await page.getByTestId("video-featured").waitFor();
  await page.waitForTimeout(400);
  const y1 = await page.evaluate(() => Math.round(window.scrollY));
  const left1 = await page.getByTestId("video-row").first().locator("ul").evaluate((u) => Math.round(u.scrollLeft));
  const back = await page.evaluate(() => document.activeElement?.getAttribute("aria-label"));
  assert(Math.abs(y1 - y0) <= 2, `scroll restored: ${y0} → ${y1}`);
  assert(Math.abs(left1 - left0) <= 2, `row restored: ${left0} → ${left1}`);
  assert(back?.startsWith(title5), `focus restored: ${back}`);
  log("back link: page", y1, "row", left1, "focus", back);

  // Category + browser Back.
  await page.getByTestId("video-category").filter({ hasText: "Math" }).click();
  assert(page.url().includes("cat=Math"), "category in the URL");
  const mathRows = await page.locator("[data-testid=video-row] h2").allTextContents();
  assert(mathRows.length === 2 && mathRows[0].startsWith("Los números"), `math rows: ${mathRows}`);
  const numbers = page.getByTestId("video-row").first();
  await numbers.getByTestId("row-next").click();
  await page.waitForTimeout(700);
  await page.evaluate(() => window.scrollTo(0, 420));
  const y2 = await page.evaluate(() => Math.round(window.scrollY));
  const left2 = await numbers.locator("ul").evaluate((u) => Math.round(u.scrollLeft));
  const card = numbers.getByTestId("video-card").nth(4);
  await card.click();
  await page.waitForURL(/\/videos\//);
  await page.getByTestId("watch-title").waitFor();
  await page.goBack();
  await page.waitForURL(/cat=Math/);
  await page.getByTestId("video-featured").waitFor();
  await page.waitForTimeout(400);
  const pressed = await page.locator("[data-testid=video-category][aria-pressed=true]").textContent();
  const y3 = await page.evaluate(() => Math.round(window.scrollY));
  const left3 = await page.getByTestId("video-row").first().locator("ul").evaluate((u) => Math.round(u.scrollLeft));
  assert(pressed.startsWith("Math"), `category restored: ${pressed}`);
  assert(Math.abs(y3 - y2) <= 2, `scroll restored after Back: ${y2} → ${y3}`);
  assert(Math.abs(left3 - left2) <= 2, `row restored after Back: ${left2} → ${left3}`);
  log("browser Back: category", pressed, "page", y3, "row", left3);

  // Reduced motion: no transition on the ring.
  const rm = await browser.newContext({ viewport: { width: 1366, height: 900 }, reducedMotion: "reduce" });
  await rm.addCookies(cookies);
  const rp = await rm.newPage();
  await rp.goto(GALLERY);
  const dur = await rp.getByTestId("video-thumb").first().evaluate((e) => `${getComputedStyle(e).transitionProperty} ${getComputedStyle(e).transitionDuration}`);
  assert(/^none |^\S+ (0s|1e-0\d+s)$/.test(dur), `reduced motion transition: ${dur}`);
  log("reduced motion: transition", dur);
  await rm.close();

  // Phone: swipe a row, tap a card.
  const phone = await browser.newContext({ ...devices["iPhone 13"] });
  await phone.addCookies(cookies);
  const pp = await phone.newPage();
  pp.on("pageerror", (e) => errors.push(e.message));
  await pp.goto(GALLERY);
  await pp.getByTestId("video-featured").waitFor();
  await shot(pp, "lv5-phone");
  const prow = pp.getByTestId("video-row").first();
  await prow.evaluate((e) => e.scrollIntoView({ block: "center" }));
  await pp.waitForTimeout(300);
  assert(!(await prow.getByTestId("row-next").isVisible()), "no arrows on a phone");
  const b = await prow.locator("ul").boundingBox();
  const cdp = await phone.newCDPSession(pp);
  // A real finger swipe: touchStart, a few touchMoves to the left, touchEnd.
  const y = Math.round(b.y + b.height / 2);
  const x0 = Math.round(b.x + b.width * 0.85);
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: x0, y }] });
  for (let k = 1; k <= 10; k++) {
    await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: x0 - k * Math.round(b.width * 0.07), y }] });
    await pp.waitForTimeout(16);
  }
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await pp.waitForTimeout(900);
  const swiped = await prow.locator("ul").evaluate((u) => Math.round(u.scrollLeft));
  assert(swiped > 100, `swipe scrolls the row: ${swiped}`);
  const pcards = prow.getByTestId("video-card");
  const target = await pcards.evaluateAll((els) => {
    const ul = els[0].closest("ul").getBoundingClientRect();
    return els.findIndex((e) => e.getBoundingClientRect().left >= ul.left - 2);
  });
  const ptitle = (await pcards.nth(target).locator("span.line-clamp-2").textContent()).trim();
  await pcards.nth(target).tap();
  await pp.waitForURL(/\/videos\//);
  await pp.getByTestId("watch-title").filter({ hasText: ptitle }).waitFor();
  await shot(pp, "lv6-phone-watch");
  await pp.goBack();
  await pp.getByTestId("video-featured").waitFor();
  await pp.waitForTimeout(400);
  const swiped2 = await pp.getByTestId("video-row").first().locator("ul").evaluate((u) => Math.round(u.scrollLeft));
  assert(Math.abs(swiped2 - swiped) <= 2, `phone row restored: ${swiped} → ${swiped2}`);
  log("phone: swipe", swiped, "· tap opened", ptitle, "· back restored", swiped2);
  await phone.close();

  // Student side: Student View of the topic, then a video assigned from its watch page.
  await page.goto(`${BASE}/teacher/library/topics/greetings/student-view?grade=LOWER`);
  await page.getByTestId("student-view-banner").waitFor();
  await page.getByTestId("lesson-start").click();
  await page.locator("[data-testid=lesson-activity] video").waitFor();
  log("Student View of «Los saludos» opens and plays its first video");

  await page.goto(`${BASE}/teacher/classes`);
  await page.fill("#name", "Primero A");
  await page.click("text=Create class");
  await page.click("text=Primero A");
  await page.waitForURL(/\/teacher\/classes\/.+/);
  const classUrl = page.url();
  const code = (await page.locator("span.font-mono").first().textContent()).trim();
  const pin = await addStudent(page, classUrl, "Diego", { initial: "P" });
  await page.goto(GALLERY);
  await page.getByTestId("video-row").first().getByTestId("video-card").nth(1).click();
  await page.getByTestId("watch-title").waitFor();
  const watched = (await page.getByTestId("watch-title").textContent()).trim();
  await page.getByRole("link", { name: "Assign this video" }).click();
  await page.waitForURL(/only=r%3A/);
  await page.check("fieldset:has(legend:text-is('Individual students')) label:has-text('Diego') input");
  await page.click("button:text-is('Next: choose a topic')");
  const pre = (await page.getByTestId("wizard-step").locator("label:has(input:checked) span.font-bold").allTextContents()).map((t) => t.trim());
  assert(pre.length === 1 && pre[0] === watched, `preselected: ${pre}`);
  await page.click("button:text-is('Next: confirm')");
  await page.click("button:text-is('Assign Task')");
  await page.waitForURL(/\/teacher\/tasks\/[^/?]+\?new=1/);
  const taskId = new URL(page.url()).pathname.split("/").at(-1);
  const sctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const sp = await sctx.newPage();
  sp.on("pageerror", (e) => errors.push(e.message));
  await sp.goto(`${BASE}/student/${code}`);
  await sp.click("button:has-text('Diego')");
  for (const d of pin) await sp.click(`button:text-is('${d}')`);
  await sp.click("text=Go!");
  await sp.waitForURL(`${BASE}/learn`);
  await sp.goto(`${BASE}/learn/tasks/${taskId}`);
  await sp.getByTestId("lesson-step-title").filter({ hasText: watched }).waitFor();
  await sp.getByTestId("lesson-start").click();
  const sv = sp.locator("[data-testid=lesson-activity] video");
  await sv.waitFor();
  await sp.waitForFunction(() => (document.querySelector("[data-testid=lesson-activity] video")?.readyState ?? 0) >= 1, null, { timeout: 15000 });
  await shot(sp, "lv7-student-video");
  await sctx.close();
  log("student: assigned from the watch page, the student sees and loads", watched);

  assert(errors.length === 0, `page errors: ${errors.join(" | ")}`);
  log("OK");
} catch (e) {
  console.error("FAILED:", e.message);
  process.exitCode = 1;
} finally {
  await browser.close();
}
