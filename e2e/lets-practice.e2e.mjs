// Flashcards: paste a picture with Ctrl+V, no 🎤 on each card, "Let's practice · Create practice",
// then the student's "¡Vamos a practicar!" round answered out loud (scripted recognizer), and
// My Assignments with the category of each assignment.
// Run: BASE_URL=http://localhost:3100 E2E_STT_SCRIPT_FILE=/var/tmp/stt.json node e2e/lets-practice.e2e.mjs
// (the server runs with STT_PROVIDER=scripted-test E2E_SCRIPTED_STT=1 and the same script file)
import { chromium } from "playwright";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const BASE = process.env.BASE_URL ?? "http://localhost:3100";
const SCRIPT = process.env.E2E_STT_SCRIPT_FILE;
const SHOTS = process.env.SCREENSHOTS;
const stamp = Date.now();
const fx = (f) => path.resolve("e2e/fixtures", f);
const log = (...a) => console.log("•", ...a);
const assert = (c, m) => {
  if (!c) throw new Error(m);
};
const shot = async (p, name) => SHOTS && p.screenshot({ path: path.join(SHOTS, `${name}.png`) });
const script = (items) => writeFileSync(SCRIPT, JSON.stringify(items));

const browser = await chromium.launch({
  args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream", `--use-file-for-fake-audio-capture=${fx("answer.wav")}`, "--autoplay-policy=no-user-gesture-required"],
});
const ctx = await browser.newContext({ permissions: ["microphone"], viewport: { width: 1366, height: 900 }, locale: "es-MX" });
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
const saved = () => page.waitForFunction(() => /Guardado|Saved/.test(document.querySelector("[data-testid=save-status]")?.textContent ?? ""), null, { timeout: 15000 });

try {
  assert(SCRIPT, "E2E_STT_SCRIPT_FILE is required");
  script([]);
  await page.goto(`${BASE}/signup`);
  await page.fill("#displayName", "Ana Rivera");
  await page.fill("#schoolName", "Colegio Voz");
  await page.fill("#email", `lp${stamp}@school.test`);
  await page.fill("#password", "correct-horse-42");
  await page.click("button[type=submit]");
  await page.waitForURL(`${BASE}/teacher`);
  await page.goto(`${BASE}/teacher/classes`);
  await page.fill("#name", "Segundo B");
  await page.click("text=Create class");

  await page.goto(`${BASE}/teacher/games/new`);
  await page.click("button[value=FLASHCARDS]");
  await page.waitForURL(/\/edit$/);
  const gameId = page.url().split("/").at(-2);
  await page.getByLabel("Título de la actividad").fill("Animales y colores");
  const c1 = page.locator("ol > li").first();
  // Paste a picture into the front box (as Ctrl+V does), without uploading it from the computer.
  const png = readFileSync(fx("dog.png")).toString("base64");
  const front = c1.getByRole("textbox", { name: "Frente: Texto" });
  await front.click();
  await front.evaluate((el, b64) => {
    const bytes = Uint8Array.from(atob(b64), (ch) => ch.charCodeAt(0));
    const dt = new DataTransfer();
    dt.items.add(new File([bytes], "image.png", { type: "image/png" }));
    el.dispatchEvent(new ClipboardEvent("paste", { clipboardData: dt, bubbles: true, cancelable: true }));
  }, png);
  await c1.locator("img").first().waitFor({ timeout: 15000 });
  log("pasted picture shows on card 1");
  await c1.getByRole("textbox", { name: "Reverso: Texto" }).fill("el perro");
  await page.getByText("+ Añadir tarjeta").click();
  const c2 = page.locator("ol > li").nth(1);
  await c2.getByRole("textbox", { name: "Frente: Texto" }).fill("rojo");
  await c2.getByRole("textbox", { name: "Reverso: Texto" }).fill("red");
  assert((await page.locator("ol > li button:has-text('🎤')").count()) === 0, "no 🎤 button on the card rows");
  assert((await page.getByTestId("paste-help").count()) === 0, "flashcards show no paste hint");
  assert((await page.getByTestId("autocorrect-help").count()) === 0, "flashcards show no autocorrect help");
  await page.getByTestId("create-practice").click();
  await page.getByTestId("practice-created").waitFor();
  await saved();
  await shot(page, "lp1-editor");
  log("editor: no 🎤 per card, no help lines, Let's practice created");

  // Assign it, then My Assignments shows it under Flashcards.
  // Done → the activity page → Set Assignment (publishes, then the assign form).
  await page.getByTestId("editor-done").click();
  await page.waitForURL(/\/play\/preview\//, { timeout: 20000 });
  await page.getByTestId("action-assign").click();
  await page.waitForURL(/assignments\/new/, { timeout: 30000 });
  await page.check("label:has-text('Whole class') input");
  await page.click("text=Assign activity");
  await page.waitForURL(/\?new=1$/, { timeout: 20000 });
  await page.getByRole("link", { name: "My Assignments" }).first().click();
  await page.waitForURL(/\/teacher\/assignments$/);
  await page.getByRole("heading", { name: "My Assignments" }).waitFor();
  const card = page.getByTestId("assignment-card").filter({ hasText: "Animales y colores" });
  assert((await card.getByTestId("assignment-kind").textContent()).includes("Flashcards"), "category is Flashcards");
  for (const k of ["Videos", "Songs", "Games", "Flashcards", "Printables", "Worksheets"]) await page.getByTestId("assignment-filters").getByText(k).waitFor();
  await shot(page, "lp2-my-assignments");
  await page.getByTestId("assignment-filters").getByText("Videos").click();
  await page.waitForURL(/kind=VIDEO/);
  assert((await page.getByTestId("assignment-card").count()) === 0, "Videos filter hides the flashcards");
  log("My Assignments: preview cards with category, filters by category");
  // Clicking an activity in My Activities plays it (it doesn't open the editor).
  await page.goto(`${BASE}/teacher/my-activities`);
  await page.locator("[data-testid=activity]", { hasText: "Animales y colores" }).getByTestId("activity-open").click();
  await page.waitForURL(new RegExp(`/play/preview/${gameId}$`));
  log("My Activities: a click plays the activity");

  // Play (teacher preview): the cards, then ¡Vamos a practicar! answered out loud.
  await page.goto(`${BASE}/play/preview/${gameId}`);
  await page.getByRole("button", { name: "Start" }).click();
  for (let i = 0; i < 2; i++) {
    await page.getByTestId("turn-card").click();
    await page.getByTestId("mark-knew").click();
    await page.waitForTimeout(900);
  }
  await page.getByTestId("round-results").waitFor();
  assert((await page.getByText("Show answers").count()) === 0, "results screen shows only the result and the practice button");
  await shot(page, "lp3-results");
  // Card 1: a first miss gets "look again" without the answer, then the right answer.
  // Card 2: two misses, then the answer is given.
  script([{ text: "gato", confidence: 0.95 }, { text: "el perro", confidence: 0.95 }, { text: "blue", confidence: 0.95 }, { text: "green", confidence: 0.95 }]);
  await page.getByTestId("go-practice").click(); // turns the microphone on by itself
  await page.getByTestId("lets-practice").waitFor({ timeout: 15000 });
  assert((await page.getByTestId("practice-question").textContent()) === "¿Qué es esto?", "card 1 question");
  await page.waitForSelector("text=/Observemos este nuevamente|Mira este otra vez con calma/", { timeout: 30000 });
  assert((await page.locator("[role=status]", { hasText: "el perro" }).count()) === 0, "the answer is not given after the first miss");
  await shot(page, "lp5-practice-retry");
  log("first miss: look again, no answer");
  await page.waitForSelector("text=/Así es|Lo dijiste correctamente|Lo hiciste por tu cuenta|Seguiste intentándolo|Notaste la diferencia/", { timeout: 30000 });
  await page.getByTestId("practice-question").filter({ hasText: "¿Qué color es este?" }).waitFor({ timeout: 15000 });
  await page.waitForSelector("text=You're still learning this word", { timeout: 40000 });
  await shot(page, "lp5b-practice-model");
  log("second miss on card 2: the answer is given");
  await page.getByTestId("lets-practice-results").waitFor({ timeout: 60000 });
  const score = await page.getByTestId("practice-score").textContent();
  await shot(page, "lp6-practice-done");
  assert(score === "1/2", `practice score ${score}`);
  log("Let's practice:", score);
  // Delete the assignment from My Assignments (after a confirmation).
  page.once("dialog", (d) => d.accept());
  await page.goto(`${BASE}/teacher/assignments`);
  await page.getByTestId("assignment-card").filter({ hasText: "Animales y colores" }).getByTestId("delete-assignment").click();
  await page.getByTestId("assignment-card").filter({ hasText: "Animales y colores" }).waitFor({ state: "detached", timeout: 15000 });
  log("My Assignments: assignment deleted");
  assert(!errors.length, errors.join(" | "));
  log("ALL LET'S PRACTICE CHECKS PASSED");
} catch (e) {
  console.error("FAILED:", e.message);
  await shot(page, "lp-fail");
  process.exitCode = 1;
} finally {
  await browser.close();
}
