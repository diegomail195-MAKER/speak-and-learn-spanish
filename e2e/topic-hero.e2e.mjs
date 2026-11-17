// The Topic page (featured video, video carousel, five 3D categories) on desktop and on a phone.
// Needs videos on «Los animales» and «Los saludos»: node e2e/seed-topic-videos.mjs (local DB).
// Run: BASE_URL=http://localhost:3100 node e2e/topic-hero.e2e.mjs
import { chromium, devices } from "playwright";
import path from "node:path";

const BASE = process.env.BASE_URL ?? "http://localhost:3100";
const SHOTS = process.env.SCREENSHOTS;
const stamp = Date.now();
const log = (...a) => console.log("•", ...a);
const assert = (c, m) => {
  if (!c) throw new Error(m);
};
const shot = async (p, name, full = false) => SHOTS && p.screenshot({ path: path.join(SHOTS, `${name}.png`), fullPage: full });
const box = async (l) => {
  const b = await l.boundingBox();
  return `${Math.round(b.width)}x${Math.round(b.height)}`;
};

const browser = await chromium.launch({ args: ["--autoplay-policy=no-user-gesture-required"] });
const errors = [];

async function teacher(ctxOpts) {
  const ctx = await browser.newContext(ctxOpts);
  const page = await ctx.newPage();
  page.on("pageerror", (e) => errors.push(e.message));
  return { ctx, page };
}

try {
  // ── Desktop ──
  const { ctx, page } = await teacher({ viewport: { width: 1366, height: 900 }, deviceScaleFactor: 1 });
  await page.goto(`${BASE}/signup`);
  await page.fill("#displayName", "Ana Rivera");
  await page.fill("#schoolName", "Colegio Voz");
  await page.fill("#email", `th${stamp}@school.test`);
  await page.fill("#password", "correct-horse-42");
  await page.click("button[type=submit]");
  await page.waitForURL(`${BASE}/teacher`);
  const cookies = await ctx.cookies();

  // Los animales: one video, the topic's name on the purple strip, no carousel.
  await page.goto(`${BASE}/teacher/library/topics/animals`);
  await page.getByTestId("hero-title").filter({ hasText: "Los animales" }).waitFor();
  assert((await page.getByTestId("hero-carousel").count()) === 0, "no carousel for a single video");
  const labels = await page.locator("[role=tab]").allTextContents();
  assert(["Videos", "Games", "Flashcards", "Music Videos", "Speaking"].every((l, i) => labels[i]?.startsWith(l)), `category order: ${labels.join(" | ")}`);
  const stage = page.getByTestId("hero-stage");
  const before = await box(stage);
  await shot(page, "th1-animals-desktop");
  await page.getByTestId("hero-play").click();
  const vid = page.locator("[data-testid=hero-player] video");
  await vid.waitFor();
  await page.waitForFunction(() => {
    const v = document.querySelector("[data-testid=hero-player] video");
    return v && !v.paused && v.currentTime > 0.2;
  }, null, { timeout: 15000 });
  assert((await box(stage)) === before, `player size changed: ${before} → ${await box(stage)}`);
  log("animals: one video, Play starts it in the same 16:9 frame", before);
  await shot(page, "th2-animals-playing");

  // Categories: selected keeps lavender + purple border; empty category says so.
  await page.getByTestId("category-games").click();
  assert((await page.getByTestId("category-games").getAttribute("aria-selected")) === "true", "games selected");
  assert((await page.getByTestId("category-panel").getByTestId("category-item").count()) > 0, "games listed");
  await page.mouse.move(5, 5);
  await page.waitForTimeout(400);
  const bg = await page.getByTestId("category-games").evaluate((el) => getComputedStyle(el).backgroundColor);
  assert(bg === "rgb(243, 232, 247)", `selected background stays after the pointer leaves: ${bg}`);
  await page.getByTestId("category-speaking").click();
  await page.getByTestId("category-empty").waitFor();
  for (const k of ["flashcards", "music"]) {
    await page.getByTestId(`category-${k}`).click();
    const first = page.getByTestId("category-panel").locator("a[data-testid=category-item]").first();
    const href = await first.getAttribute("href");
    assert(href?.startsWith("/teacher/library/resources/"), `${k} links to its resource`);
  }
  await page.getByTestId("category-music").click();
  await page.getByTestId("category-panel").locator("a[data-testid=category-item]").first().click();
  await page.waitForURL(/\/teacher\/library\/resources\//);
  log("five categories: selection state, items link to their resources, Speaking shows an empty state");

  // Keyboard: Tab reaches the categories with a visible outline.
  await page.goto(`${BASE}/teacher/library/topics/animals`);
  await page.getByTestId("category-videos").focus();
  await page.keyboard.press("Tab");
  const outline = await page.evaluate(() => getComputedStyle(document.activeElement).outlineStyle + " " + document.activeElement.dataset.testid);
  assert(outline.startsWith("solid category-games"), `focus outline: ${outline}`);
  log("keyboard focus is outlined", outline);

  // Los saludos: several videos → carousel; choosing one updates the cover, the title and the selection together.
  await page.goto(`${BASE}/teacher/library/topics/greetings`);
  const cards = page.getByTestId("carousel-card");
  await cards.first().waitFor();
  const n = await cards.count();
  assert(n >= 5, `carousel cards ${n}`);
  const sizes = new Set(await cards.evaluateAll((els) => els.map((e) => `${Math.round(e.getBoundingClientRect().width)}x${Math.round(e.getBoundingClientRect().height)}`)));
  assert(sizes.size === 1, `cards of one size: ${[...sizes].join(", ")}`);
  await shot(page, "th3-greetings-desktop");
  await page.getByTestId("hero-play").click();
  await page.locator("[data-testid=hero-player] video").waitFor();
  const t0 = await page.getByTestId("hero-title").textContent();
  // Next arrow pages the rail; then pick the 5th video.
  await page.getByTestId("carousel-next").click();
  await page.waitForTimeout(600);
  assert((await page.locator("[data-testid=hero-carousel] ul").evaluate((el) => el.scrollLeft)) > 0, "next arrow scrolls the rail");
  await cards.nth(4).click();
  const t1 = await page.getByTestId("hero-title").textContent();
  const label = await cards.nth(4).textContent();
  assert(t1 !== t0 && label.includes(t1), `title follows the selection: ${t0} → ${t1}`);
  assert((await cards.nth(4).getAttribute("aria-current")) === "true", "selected card marked");
  assert((await page.getByTestId("hero-player").count()) === 0, "the previous video stopped when another was chosen");
  assert((await page.getByTestId("hero-play").count()) === 1, "new cover with Play, no autoplay");
  await page.waitForTimeout(500);
  await shot(page, "th4-greetings-selected");
  // Keyboard on the rail: arrows move focus, Enter plays it.
  await cards.nth(4).focus();
  await page.keyboard.press("ArrowLeft");
  assert((await page.evaluate(() => document.activeElement.getAttribute("aria-label"))) === (await cards.nth(3).getAttribute("aria-label")), "ArrowLeft moves focus");
  await page.keyboard.press("Enter");
  assert((await cards.nth(3).getAttribute("aria-current")) === "true", "Enter selects");
  log(`greetings: ${n} cards of one size, arrows page, selection updates cover/title/state, previous video stops`);
  await ctx.close();

  // ── Phone ──
  const phone = await browser.newContext({ ...devices["iPhone 13"] });
  await phone.addCookies(cookies);
  const m = await phone.newPage();
  m.on("pageerror", (e) => errors.push(e.message));
  await m.goto(`${BASE}/teacher/library/topics/greetings`);
  const rail = m.locator("[data-testid=hero-carousel] ul");
  await rail.waitFor();
  const r = await rail.evaluate((el) => ({ sw: el.scrollWidth, cw: el.clientWidth, card: el.querySelector("li").getBoundingClientRect().width }));
  assert(r.sw > r.cw && r.card < r.cw * 0.85, `next card peeks: ${JSON.stringify(r)}`);
  assert(!(await m.getByTestId("carousel-next").isVisible()), "no arrows on the phone (swipe)");
  const overflow = await m.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  assert(overflow <= 0, `no horizontal page scroll (${overflow}px)`);
  // Swipe the rail with touch.
  await rail.scrollIntoViewIfNeeded();
  const rb = await rail.boundingBox();
  const cdp = await phone.newCDPSession(m);
  const y = Math.round(rb.y + 60);
  const touch = (type, x) => cdp.send("Input.dispatchTouchEvent", { type, touchPoints: type === "touchEnd" ? [] : [{ x, y }] });
  await touch("touchStart", Math.round(rb.x + rb.width * 0.85));
  for (let i = 1; i <= 10; i++) await touch("touchMove", Math.round(rb.x + rb.width * 0.85 - i * 25));
  await touch("touchEnd");
  await m.waitForTimeout(700);
  assert((await rail.evaluate((el) => el.scrollLeft)) > 0, "swipe moves the rail");
  await m.getByTestId("carousel-card").nth(2).tap();
  assert((await m.getByTestId("carousel-card").nth(2).getAttribute("aria-current")) === "true", "tap selects");
  await shot(m, "th5-greetings-phone", true);
  const cols = await m.locator("[role=tablist]").evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(" ").length);
  assert(cols === 3, `compact 3-column grid on the phone (${cols})`);
  await m.getByTestId("hero-play").tap();
  await m.locator("[data-testid=hero-player] video").waitFor();
  await m.goto(`${BASE}/teacher/library/topics/animals`);
  await m.getByTestId("hero-title").waitFor();
  await shot(m, "th6-animals-phone", true);
  log("phone: next card peeks, swipe and tap work, compact category grid, no sideways page scroll");
  await phone.close();

  assert(!errors.length, errors.join(" | "));
  log("ALL TOPIC PAGE CHECKS PASSED");
} catch (e) {
  console.error("FAILED:", e.message);
  process.exitCode = 1;
} finally {
  await browser.close();
}
