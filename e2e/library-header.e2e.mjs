// End-to-end test for the Library top block: the four grade filters (All Grades, K–2, 3–4, 5–6),
// the theme/activity search and My favorites, with the mouse, the keyboard and on a phone.
// Run: BASE_URL=http://localhost:3100 node e2e/library-header.e2e.mjs
import { chromium } from "playwright";
import path from "node:path";

const BASE = process.env.BASE_URL ?? "http://localhost:3100";
const SHOTS = process.env.SCREENSHOTS;
const shot = async (p, name) => SHOTS && p.screenshot({ path: path.join(SHOTS, `${name}.png`), fullPage: false });
const log = (...a) => console.log("•", ...a);
const assert = (c, m) => {
  if (!c) throw new Error(m);
};

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 }, locale: "en-US" });
const p = await ctx.newPage();
const errors = [];
p.on("pageerror", (e) => errors.push(e.message));
const head = () => p.getByTestId("library-header");
const titles = () => p.getByTestId("library-topics").locator("li").evaluateAll((li) => li.map((l) => l.textContent));
const pressed = () => head().locator("[role=group] button").evaluateAll((bs) => bs.map((b) => `${b.textContent}:${b.getAttribute("aria-pressed")}`));
const waitUrl = (re) => p.waitForURL(re, { timeout: 15000 });

try {
  const stamp = Date.now();
  await p.goto(`${BASE}/signup`);
  await p.fill("#displayName", "Lia Gomez");
  await p.fill("#schoolName", "Colegio Biblioteca");
  await p.fill("#email", `lib${stamp}@school.test`);
  await p.fill("#password", "correct-horse-42");
  await p.click("button[type=submit]");
  await p.waitForURL(`${BASE}/teacher`);

  // ── Block layout ──
  await p.goto(`${BASE}/teacher/library`);
  await head().waitFor();
  assert(await head().getByRole("heading", { name: "Library" }).isVisible(), "title");
  assert(await head().getByText("Filter by grade or search by topic to find the content your students need.").isVisible(), "description");
  const labels = await head().locator("[role=group] button").allTextContents();
  assert(JSON.stringify(labels) === JSON.stringify(["All Grades", "K–2", "3–4", "5–6"]), `four filters, no 6+ (${labels})`);
  const boxes = await head().locator("[role=group] button").evaluateAll((bs) => bs.map((b) => { const r = b.getBoundingClientRect(); const s = getComputedStyle(b); return { w: Math.round(r.width), h: r.height, top: Math.round(r.top), bg: s.backgroundColor, color: s.color, radius: s.borderRadius }; }));
  assert(new Set(boxes.map((b) => b.w)).size === 1 && new Set(boxes.map((b) => b.top)).size === 1, `one row, same width ${JSON.stringify(boxes)}`);
  assert(boxes.every((b) => b.h >= 44 && b.color === "rgb(255, 255, 255)" && b.radius === "12px"), `44px+, white text, 12px corners ${JSON.stringify(boxes)}`);
  assert(JSON.stringify(boxes.map((b) => b.bg)) === JSON.stringify(["rgb(98, 13, 120)", "rgb(20, 200, 196)", "rgb(255, 201, 40)", "rgb(255, 100, 88)"]), `colors ${boxes.map((b) => b.bg)}`);
  assert((await pressed())[0] === "All Grades:true", "All Grades selected by default");
  assert(await head().getByPlaceholder("Search theme or activity").isVisible() && await head().getByRole("button", { name: "My favorites" }).isVisible(), "search and My favorites");
  const all = await titles();
  assert(all.length >= 5, `All Grades shows every topic (${all.length})`);
  await shot(p, "lib1-desktop");
  log("block: title, description, four equal filters in one row (44px+, white text, 12px), search and My favorites");

  // Hover lifts the filter without moving its neighbour.
  const k2 = head().getByTestId("grade-k-2");
  const before = await head().getByTestId("grade-3-4").boundingBox();
  await k2.hover();
  await p.waitForTimeout(300);
  const lifted = await k2.evaluate((b) => getComputedStyle(b).transform);
  const after = await head().getByTestId("grade-3-4").boundingBox();
  assert(lifted !== "none" && before.x === after.x && before.y === after.y, `hover lift, neighbours still (${lifted})`);

  // ── Filters ──
  await k2.click();
  await waitUrl(/grade=k-2/);
  await p.waitForFunction(() => document.querySelector("[data-testid=grade-k-2]").getAttribute("aria-pressed") === "true");
  const lower = await titles();
  // Selected = white inner ring (inset shadow); the outline is kept for keyboard focus only.
  const selRing = await k2.evaluate((b) => getComputedStyle(b).boxShadow);
  assert(/inset/.test(selRing) && /255, 255, 255/.test(selRing), `selected inner ring (${selRing})`);
  await head().getByTestId("grade-3-4").click();
  await waitUrl(/grade=3-4/);
  const upper = await titles();
  await head().getByTestId("grade-5-6").click();
  await waitUrl(/grade=5-6/);
  assert(JSON.stringify(await titles()) === JSON.stringify(upper), "5–6 shows the Upper content too");
  await head().getByTestId("grade-all").click();
  await waitUrl(/\/teacher\/library$/);
  assert((await titles()).length === all.length, "All Grades again shows everything");
  log(`filters: K–2 ${lower.length} topics, 3–4 / 5–6 ${upper.length}, All Grades ${all.length}; selected one has an inner ring and aria-pressed`);

  // ── Search: as you type, no Enter ──
  await head().getByTestId("library-search").pressSequentially("color", { delay: 40 });
  await waitUrl(/q=color/);
  await p.waitForFunction(() => [...document.querySelectorAll("[data-testid=library-topics] li")].some((l) => /Colors/.test(l.textContent)), null, { timeout: 15000 });
  await head().getByTestId("library-search").fill("shapes");
  await waitUrl(/q=shapes/);
  await p.waitForFunction(() => { const li = [...document.querySelectorAll("[data-testid=library-topics] li")]; return li.length === 1 && /Shapes/.test(li[0].textContent); }, null, { timeout: 15000 });
  log("search by theme: «shapes» → only Las figuras / Shapes");
  await head().getByTestId("library-search").fill("Memory Game");
  await waitUrl(/q=Memory/);
  await p.waitForFunction(() => !/q=shapes/.test(location.search) && document.querySelectorAll("[data-testid=library-topics] li").length >= 2, null, { timeout: 15000 });
  await p.waitForTimeout(800);
  assert((await titles()).length >= 2, "search by activity name finds the topics that have it");
  await head().getByTestId("library-search").fill("zzzz");
  await p.getByTestId("library-empty").waitFor({ timeout: 15000 });
  await head().getByTestId("library-search").fill("");
  await waitUrl(/\/teacher\/library$/);
  log("search: typing works without Enter, «shapes» finds the theme, «Memory Game» finds activities, no match shows a message");

  // ── Favorites ──
  const first = p.getByTestId("library-topics").locator("li").first();
  const favName = (await first.textContent()).trim();
  await first.getByTestId("favorite-toggle").click();
  await p.waitForFunction(() => document.querySelector("[data-testid=favorite-toggle]").getAttribute("aria-pressed") === "true");
  await p.waitForTimeout(500);
  await head().getByTestId("library-favorites").click();
  await waitUrl(/fav=1/);
  await p.waitForFunction(() => document.querySelectorAll("[data-testid=library-topics] li").length === 1);
  assert((await titles())[0].trim() === favName, "My favorites shows the saved topic");
  assert((await head().getByTestId("library-favorites").getAttribute("aria-pressed")) === "true", "My favorites pressed");
  await shot(p, "lib2-favorites");
  await p.getByTestId("favorite-toggle").first().click();
  await p.getByTestId("library-empty").waitFor({ timeout: 15000 });
  await head().getByTestId("library-favorites").click();
  await waitUrl(/\/teacher\/library$/);
  log("favorites: heart saves a topic, My favorites shows it, removing it empties the list");

  // ── Keyboard: Tab through the filters, Enter/Space select; focus is visible ──
  await p.goto(`${BASE}/teacher/library`);
  await head().getByTestId("grade-all").focus();
  await p.keyboard.press("Tab");
  const focused = await p.evaluate(() => document.activeElement?.dataset.testid);
  assert(focused === "grade-k-2", `Tab moves to K–2 (${focused})`);
  await p.waitForTimeout(300);
  const ring = await p.evaluate(() => { const s = getComputedStyle(document.activeElement); return `${s.outlineStyle} ${s.outlineWidth}`; });
  assert(ring === "solid 2px", `visible keyboard focus: one 2px outline (${ring})`);
  await shot(p, "lib3-keyboard-focus");
  await p.keyboard.press("Enter");
  await waitUrl(/grade=k-2/);
  await p.keyboard.press("Tab");
  await p.keyboard.press("Space");
  await waitUrl(/grade=3-4/);
  for (let i = 0; i < 2; i++) await p.keyboard.press("Tab");
  assert((await p.evaluate(() => document.activeElement?.dataset.testid)) === "library-search", "Tab reaches the search");
  await p.keyboard.type("num");
  await waitUrl(/q=num/);
  await p.keyboard.press("Tab");
  assert((await p.evaluate(() => document.activeElement?.dataset.testid)) === "library-favorites", "then My favorites");
  log("keyboard: Tab order filters → search → My favorites, Enter and Space select, focus ring visible");

  // ── Phone: two columns of filters, search and favorites below ──
  await p.setViewportSize({ width: 390, height: 844 });
  await p.goto(`${BASE}/teacher/library`);
  await head().waitFor();
  const ph = await head().locator("[role=group] button").evaluateAll((bs) => bs.map((b) => { const r = b.getBoundingClientRect(); return [Math.round(r.left), Math.round(r.top), r.height]; }));
  assert(new Set(ph.map((x) => x[0])).size === 2 && new Set(ph.map((x) => x[1])).size === 2 && ph.every((x) => x[2] >= 44), `2×2 grid on a phone ${JSON.stringify(ph)}`);
  const sb = await head().getByTestId("library-search").boundingBox();
  const fb = await head().getByTestId("library-favorites").boundingBox();
  assert(sb.y > ph[3][1] && fb.y > sb.y, "search, then favorites, below the filters");
  assert(await p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), "no sideways scroll");
  await head().getByTestId("grade-5-6").click();
  await waitUrl(/grade=5-6/);
  await shot(p, "lib4-phone");
  log("phone: filters in two columns, search and My favorites underneath, filters work");

  assert(errors.length === 0, `page errors: ${errors.join(" | ")}`);
  console.log("• ALL LIBRARY HEADER CHECKS PASSED");
} catch (e) {
  console.error("FAIL", e.message);
  process.exitCode = 1;
} finally {
  await browser.close();
}
