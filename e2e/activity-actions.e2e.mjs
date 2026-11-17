// The bar under every activity (teacher preview): Edit Content, Print Worksheet (only when the
// activity has a printable sheet), Set Assignment (publishes a draft, then the assign flow) and
// Rename (same id, links and assignments keep working), plus the activity's Assignments list.
// Run: BASE_URL=http://localhost:3100 node e2e/activity-actions.e2e.mjs
import { chromium } from "playwright";
import path from "node:path";

const BASE = process.env.BASE_URL ?? "http://localhost:3100";
const SHOTS = process.env.SCREENSHOTS;
const stamp = Date.now();
const log = (...a) => console.log("•", ...a);
const assert = (c, m) => {
  if (!c) throw new Error(m);
};
const shot = async (p, name) => SHOTS && p.screenshot({ path: path.join(SHOTS, `${name}.png`), fullPage: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 }, locale: "es-MX" });
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
const saved = () => page.waitForFunction(() => /Guardado|Saved/.test(document.querySelector("[data-testid=save-status]")?.textContent ?? ""), null, { timeout: 15000 });

try {
  await page.goto(`${BASE}/signup`);
  await page.fill("#displayName", "Ana Rivera");
  await page.fill("#schoolName", "Colegio Voz");
  await page.fill("#email", `aa${stamp}@school.test`);
  await page.fill("#password", "correct-horse-42");
  await page.click("button[type=submit]");
  await page.waitForURL(`${BASE}/teacher`);
  await page.goto(`${BASE}/teacher/classes`);
  await page.fill("#name", "Segundo B");
  await page.click("text=Create class");

  // A flashcards draft with two cards.
  await page.goto(`${BASE}/teacher/games/new`);
  await page.click("button[value=FLASHCARDS]");
  await page.waitForURL(/\/edit$/);
  const gameId = page.url().split("/").at(-2);
  await page.getByLabel("Título de la actividad").fill("Los colores");
  const c1 = page.locator("ol > li").first();
  await c1.getByRole("textbox", { name: "Frente: Texto" }).fill("rojo");
  await c1.getByRole("textbox", { name: "Reverso: Texto" }).fill("red");
  await page.getByText("+ Añadir tarjeta").click();
  const c2 = page.locator("ol > li").nth(1);
  await c2.getByRole("textbox", { name: "Frente: Texto" }).fill("azul");
  await c2.getByRole("textbox", { name: "Reverso: Texto" }).fill("blue");
  await saved();

  // Editor: no Settings panel any more (it moved to Activity settings); Let's practice can be edited.
  assert((await page.getByRole("button", { name: /^⚙ Settings$/ }).count()) === 0, "the editor still has Settings");
  await page.getByTestId("open-activity-settings").waitFor();
  await page.getByTestId("create-practice").click();
  await page.getByTestId("practice-edit").click();
  const prow = page.getByTestId("practice-row").first();
  await prow.getByTestId("practice-question").fill("¿Qué color es?");
  await prow.getByTestId("practice-accepted").fill("colorado");
  await prow.getByTestId("practice-accepted").blur();
  await saved();
  if (SHOTS) await page.getByTestId("practice-editor").screenshot({ path: path.join(SHOTS, "aa0-practice-edit.png") });
  await page.reload();
  await page.getByTestId("practice-edit").click();
  assert((await page.getByTestId("practice-row").first().getByTestId("practice-question").inputValue()) === "¿Qué color es?", "practice question saved");
  assert((await page.getByTestId("practice-row").first().getByTestId("practice-accepted").inputValue()) === "colorado", "practice answers saved");
  log("editor: Settings moved out; «Práctica creada» → Editar: question and other answers saved");

  // Preview: the bar with the four actions and an empty Assignments list.
  await page.goto(`${BASE}/play/preview/${gameId}`);
  const bar = page.getByTestId("activity-actions");
  for (const t of ["action-edit", "action-print", "action-assign", "action-rename"]) await bar.getByTestId(t).waitFor();
  // Activity settings sit right under the actions, open, in short sections.
  const settings = page.getByTestId("activity-settings");
  await settings.waitFor();
  const [barBox, setBox] = [await bar.boundingBox(), await settings.boundingBox()];
  assert(setBox.y > barBox.y, "Activity settings is under the actions");
  for (const t of ["settings-look", "settings-options", "settings-voice", "settings-about"]) await page.getByTestId(t).waitFor();
  // Font: saved per activity, previewed, and used by the game and the printables.
  await page.locator("#opt-font").selectOption("montessori");
  await page.getByTestId("settings-status").filter({ hasText: "Saved" }).waitFor();
  const previewFont = await page.getByTestId("font-preview").locator(".font-display").evaluate((el) => getComputedStyle(el).fontFamily);
  assert(/montessori|Playwrite/i.test(previewFont), `preview uses the cursive: ${previewFont}`);
  assert((await page.getByTestId("font-preview").textContent()).includes("¿Cómo estás? Ñandú"), "sample has Ñ, accents and ¿¡");
  await page.reload();
  assert((await page.locator("#opt-font").inputValue()) === "montessori", "font saved after reload");
  assert((await page.getByTestId("flashcards-stage").getAttribute("data-practice-font")) === "montessori", "the game uses the font");
  await page.waitForFunction(() => document.fonts.check('32px "Playwrite MX"') || [...document.fonts].some((f) => /montessori|Playwrite/i.test(f.family) && f.status === "loaded"), null, { timeout: 15000 });
  if (SHOTS) await page.getByTestId("flashcards-stage").screenshot({ path: path.join(SHOTS, "aa0-font-stage.png") });
  if (SHOTS) await page.getByTestId("activity-settings").screenshot({ path: path.join(SHOTS, "aa0-font-settings.png") });
  log("Activity settings under the actions → Font: Montessori Cursive saved, previewed and applied to the game");
  // Options and Voice & answers: a setting saves by itself; possible answers per card.
  await page.getByTestId("settings-options").click();
  await page.getByLabel("Shuffle cards").check();
  await page.getByTestId("settings-status").filter({ hasText: "Saved" }).waitFor();
  await page.getByTestId("settings-voice").click();
  const row = page.getByTestId("answer-row").filter({ hasText: "red" });
  await row.getByTestId("answer-input").fill("colorado, rojizo");
  await row.getByTestId("answer-input").press("Enter");
  await row.getByText("✓").waitFor();
  if (SHOTS) await page.getByTestId("activity-settings").screenshot({ path: path.join(SHOTS, "aa0-voice-answers.png") });
  await page.reload();
  await page.getByTestId("settings-voice").click();
  assert((await page.getByTestId("answer-row").filter({ hasText: "red" }).getByTestId("answer-input").inputValue()) === "colorado, rojizo", "possible answers saved");
  log("Options and Voice & answers save by themselves; «colorado, rojizo» saved as other answers for a card");
  await shot(page, "aa1-bar-empty");
  log("flashcards: Edit Content, Print Worksheet, Set Assignment, Rename; no assignments yet");

  // Print Worksheet opens the printable view.
  await bar.getByTestId("action-print").click();
  await page.getByRole("dialog").first().waitFor({ timeout: 10000 });
  const printFont = await page.locator("[data-testid=printable-preview] [data-print-page]").first().evaluate((el) => getComputedStyle(el).fontFamily);
  assert(/montessori|Playwrite/i.test(printFont), `the worksheet uses the activity font: ${printFont}`);
  await shot(page, "aa2-print");
  await page.keyboard.press("Escape");
  await page.getByRole("dialog").first().waitFor({ state: "detached", timeout: 10000 }).catch(() => page.getByRole("button", { name: /close|cerrar|✕/i }).first().click());
  log("Print Worksheet opens the printable view");

  // Rename: only the title changes, the address stays the same.
  await bar.getByTestId("action-rename").click();
  await page.getByTestId("rename-input").fill("Los colores · Colors");
  await page.getByTestId("rename-save").click();
  await page.getByTestId("activity-title").filter({ hasText: "Los colores · Colors" }).waitFor();
  await page.reload();
  assert((await page.getByTestId("activity-title").textContent()) === "Los colores · Colors", "renamed title is saved");
  assert(page.url().endsWith(`/play/preview/${gameId}`), "same activity id after renaming");
  // An empty title is refused.
  await page.getByTestId("action-rename").click();
  await page.getByTestId("rename-input").fill("   ");
  await page.getByTestId("rename-save").click();
  await page.getByText("The title can't be empty.").waitFor();
  await page.getByRole("button", { name: "Cancel" }).click();
  log("Rename: title saved, same id, empty title refused");

  // Edit Content opens this activity's editor.
  await page.getByTestId("action-edit").click();
  await page.waitForURL(`${BASE}/teacher/games/${gameId}/edit`);
  assert((await page.getByLabel("Título de la actividad").inputValue()) === "Los colores · Colors", "editor shows the new title");
  log("Edit Content opens the editor with the new title");

  // Set Assignment on a draft publishes it and opens the assign flow.
  await page.goto(`${BASE}/play/preview/${gameId}`);
  await page.getByTestId("action-assign").click();
  await page.waitForURL(/\/teacher\/assignments\/new\?gameId=/, { timeout: 30000 });
  await page.check("label:has-text('Whole class') input");
  await page.click("text=Assign activity");
  await page.waitForURL(/\?new=1$/, { timeout: 20000 });
  log("Set Assignment: published and assigned to the class");

  // Back on the activity: its assignment is listed; renaming again keeps it.
  await page.goto(`${BASE}/play/preview/${gameId}`);
  await page.getByTestId("activity-assignments").getByText("Segundo B").waitFor();
  await page.getByTestId("action-rename").click();
  await page.getByTestId("rename-input").fill("Colores");
  await page.getByTestId("rename-save").click();
  await page.getByTestId("activity-title").filter({ hasText: "Colores" }).waitFor();
  await shot(page, "aa3-bar-assigned");
  await page.goto(`${BASE}/teacher/assignments`);
  const card = page.getByTestId("assignment-card").filter({ hasText: "Colores" });
  await card.waitFor();
  // Compact card: title, type, recipients, date, status, results and delete all visible, card short.
  for (const t of ["Colores", "Flashcards", "Segundo B", "no due date", "open", "See results"]) assert((await card.textContent()).includes(t), `card shows ${t}`);
  await card.getByTestId("delete-assignment").waitFor();
  const h = (await card.boundingBox()).height;
  assert(h < 190, `compact card height ${h}`);
  await shot(page, "aa5-my-assignments");
  await page.setViewportSize({ width: 390, height: 844 });
  await shot(page, "aa6-my-assignments-phone");
  await page.setViewportSize({ width: 1366, height: 900 });
  log("the assignment follows the renamed activity");

  // Another type of activity: same bar, without Print Worksheet.
  await page.goto(`${BASE}/teacher/games/new`);
  await page.click("button[value=SPIN_THE_WHEEL]");
  await page.waitForURL(/\/edit$/);
  const wheelId = page.url().split("/").at(-2);
  await page.goto(`${BASE}/play/preview/${wheelId}`);
  for (const t of ["action-edit", "action-assign", "action-rename"]) await page.getByTestId(t).waitFor();
  assert((await page.getByTestId("action-print").count()) === 0, "no Print Worksheet without a printable sheet");
  // A draft that isn't finished explains what's missing instead of assigning it.
  await page.getByTestId("action-assign").click();
  await page.getByTestId("assign-problems").waitFor({ timeout: 20000 });
  await shot(page, "aa4-wheel-bar");
  log("Spin the wheel: bar without Print Worksheet; unfinished draft says what's missing");

  assert(!errors.length, errors.join(" | "));
  log("ALL ACTIVITY ACTION CHECKS PASSED");
} catch (e) {
  console.error("FAILED:", e.message);
  await shot(page, "aa-fail");
  process.exitCode = 1;
} finally {
  await browser.close();
}
