// Assigning a flashcards activity: from the editor's Assign button and from My Activities,
// to a whole class and to one student; the student sees it and can open it.
// Run: BASE_URL=http://localhost:3100 node e2e/assign-flashcards.e2e.mjs
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
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 }, locale: "es-MX" });
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
const shot = async (p, name) => SHOTS && p.screenshot({ path: path.join(SHOTS, `${name}.png`) });
try {
  await page.goto(`${BASE}/signup`);
  await page.fill("#displayName", "Ana Rivera");
  await page.fill("#schoolName", "Colegio Colores");
  await page.fill("#email", `as${stamp}@school.test`);
  await page.fill("#password", "correct-horse-42");
  await page.click("button[type=submit]");
  await page.waitForURL(`${BASE}/teacher`);

  await page.goto(`${BASE}/teacher/classes`);
  await page.fill("#name", "Primero A");
  await page.click("text=Create class");
  await page.click("text=Primero A");
  await page.waitForURL(/\/teacher\/classes\/.+/);
  const classUrl = page.url();
  const code = (await page.locator("span.font-mono").first().textContent()).trim();
  const pin = await addStudent(page, classUrl, "Diego", { initial: "P" });
  log("class", code, "student pin", pin);

  await page.goto(`${BASE}/teacher/games/new`);
  await page.click("button[value=FLASHCARDS]");
  await page.waitForURL(/\/edit$/);
  await page.getByLabel("Título de la actividad").fill("Los colores");
  const f = page.locator("ol > li").first();
  await f.getByRole("textbox", { name: "Frente: Texto" }).fill("rojo");
  await f.getByRole("textbox", { name: "Reverso: Texto" }).fill("red");
  await page.waitForFunction(() => /Guardado|Saved/.test(document.querySelector("[data-testid=save-status]")?.textContent ?? ""), null, { timeout: 15000 });
  await shot(page, "as0-editor");
  // Done → the activity page → Set Assignment (publishes, then the assign form).
  await page.getByTestId("editor-done").click();
  await page.waitForURL(/\/play\/preview\//, { timeout: 20000 });
  await page.getByTestId("action-assign").click();
  await page.waitForURL(/assignments\/new/, { timeout: 30000 });
  await shot(page, "as1-assign-form");
  await page.check("label:has-text('Whole class') input");
  await page.click("text=Assign activity");
  await page.waitForURL(/\/teacher\/assignments\/(?!new)[^/?]+\?new=1$/, { timeout: 20000 });
  const repeatId = new URL(page.url()).pathname.split("/").at(-1);
  await page.getByTestId("assigned-banner").getByText("Assigned to 1 student.").waitFor();
  await page.getByTestId("assigned-banner").getByText("Cards repeat until all are correct.").waitFor();
  await shot(page, "as2-assigned");
  log("assigned from the editor (repeat until all correct) → banner shown");

  // My Activities shows that it is assigned
  await page.goto(`${BASE}/teacher/my-activities`);
  await page.locator("[data-testid=activity]", { hasText: "Los colores" }).getByTestId("assigned-badge").waitFor();
  await shot(page, "as2b-my-activities");
  log("My Activities: ✓ Assigned badge");

  // Assign Task (menu) → one of my activities → each card only once
  await page.getByRole("link", { name: "Assign Task" }).first().click();
  await page.getByRole("link", { name: "Assign one of my activities" }).click();
  await page.waitForURL(/assignments\/new/);
  await page.selectOption("#activity", { label: "Los colores" });
  await page.getByText("Activity mode").waitFor();
  assert((await page.locator("#mode").inputValue()) === "repeat", "mode defaults to the activity's setting");
  await page.selectOption("#mode", "once");
  await page.getByText("Individual students", { exact: true }).click();
  await page.check("label:has-text('Diego') input");
  await shot(page, "as1b-assign-once");
  await page.click("text=Assign activity");
  await page.waitForURL(/\?new=1$/, { timeout: 20000 });
  const onceId = new URL(page.url()).pathname.split("/").at(-1);
  await page.getByTestId("assigned-banner").getByText("Each card is shown only once.").waitFor();
  log("assigned from Assign Task to one student, each card only once");

  const s = await (await browser.newContext({ viewport: { width: 1366, height: 900 } })).newPage();
  s.on("pageerror", (e) => errors.push("student: " + e.message));
  await s.goto(`${BASE}/student`);
  await s.fill("#code", code);
  await s.click("text=Next");
  await s.click("button:has-text('Diego')");
  for (const d of pin) await s.click(`button:text-is('${d}')`);
  await s.click("text=Go!");
  await s.waitForURL(`${BASE}/learn`);
  await shot(s, "as3-student");
  assert((await s.getByText("Los colores").count()) >= 2, "student sees both assignments");
  log("student sees them");

  const playOnce = async (id) => {
    await s.goto(`${BASE}/play/${id}`);
    await s.getByRole("button", { name: "Start" }).click();
    await s.getByTestId("turn-card").click();
    await s.getByTestId("mark-again").click();
    await s.waitForTimeout(2500);
    return s.getByTestId("round-results").isVisible();
  };
  assert(await playOnce(onceId), "each card only once: the game ends after one pass");
  assert(!(await playOnce(repeatId)), "repeat until all correct: the missed card comes round again");
  await shot(s, "as4-student-play");
  log("student: 'once' ends after one pass, 'repeat' brings the missed card back");
  assert(!errors.length, errors.join(" | "));
  log("ALL ASSIGN CHECKS PASSED");
} catch (e) {
  console.error("FAILED:", e.message);
  await shot(page, "as-fail");
  process.exitCode = 1;
} finally {
  await browser.close();
}
