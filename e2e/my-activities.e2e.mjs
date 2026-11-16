// My Activities and lost-work protection in real Chromium:
// - "My Activities" lists only the activities this teacher created.
// - Back button after Done: the cached (empty) editor must not overwrite the saved cards.
// - Two tabs: the older tab cannot overwrite the newer save; it shows a conflict instead.
// - Clicking a link with unsaved changes saves them first.
// - Changes kept only on this device are listed on My Activities.
// Run: BASE_URL=http://localhost:3100 node e2e/my-activities.e2e.mjs
import { chromium } from "playwright";
import path from "node:path";

const BASE = process.env.BASE_URL ?? "http://localhost:3100";
const stamp = Date.now();
const log = (...a) => console.log("•", ...a);
const SHOTS = process.env.SCREENSHOTS;
const shot = async (p, name) => SHOTS && p.screenshot({ path: path.join(SHOTS, `${name}.png`) });
const assert = (c, m) => {
  if (!c) throw new Error(m);
};

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 }, locale: "es-MX" });
const page = await ctx.newPage();
page.on("pageerror", (e) => console.error("PAGE ERROR", e.message));
const waitSaved = (p = page) => p.waitForFunction(() => /Guardado|Saved/.test(document.querySelector("[data-testid=save-status]")?.textContent ?? ""), null, { timeout: 15000 });
const front = (p, i) => p.locator("ol > li").nth(i).getByRole("textbox", { name: "Frente: Texto" });
const api = (p, id) => p.evaluate((id) => fetch(`/api/games/${id}`).then((r) => r.json()), id);

try {
  await page.goto(`${BASE}/signup`);
  await page.fill("#displayName", "Diego Prueba");
  await page.fill("#schoolName", "Colegio Mis Actividades");
  await page.fill("#email", `myact${stamp}@school.test`);
  await page.fill("#password", "correct-horse-42");
  await page.click("button[type=submit]");
  await page.waitForURL(`${BASE}/teacher`);

  // Nav button and empty state
  await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "My Activities" }).click();
  await page.waitForURL(`${BASE}/teacher/my-activities`);
  await page.waitForSelector("text=You haven't created any activities yet");
  await shot(page, "1-my-activities-empty");
  log("My Activities: nav button and empty state");

  // Create an activity like diego's: flashcards with colors
  await page.goto(`${BASE}/teacher/games/new`);
  await page.click("button[value=FLASHCARDS]");
  await page.waitForURL(/\/edit$/);
  const editUrl = page.url();
  const gameId = editUrl.split("/").at(-2);
  await page.waitForSelector("text=Frente");
  await page.getByLabel("Título de la actividad").fill("Los colores");
  await front(page, 0).fill("rojo");
  await page.getByRole("button", { name: /Añadir tarjeta|Add card/ }).first().click();
  await front(page, 1).fill("azul");
  await waitSaved();
  log("created 'Los colores' with 2 cards");

  // Done → player → browser Back: the editor page comes from the router cache (taken while empty)
  await page.getByRole("button", { name: /^(Listo|Done)/ }).click();
  await page.waitForURL(/\/play\/preview\//);
  await page.goBack();
  await page.waitForURL(editUrl);
  await page.waitForFunction(() => [...document.querySelectorAll("ol > li")].length >= 2, null, { timeout: 10000 });
  assert((await front(page, 0).inputValue()) === "rojo" && (await front(page, 1).inputValue()) === "azul", "Back shows the saved cards");
  await front(page, 1).fill("azul claro");
  await waitSaved();
  let server = await api(page, gameId);
  assert(server.items.length === 2 && server.items[1].text === "azul claro", `after Back + edit the server keeps both cards (got ${server.items.map((i) => i.text)})`);
  log("Back button after Done: saved cards kept, edit saved");

  // Two tabs: tab B opened now, tab A then saves; B's later edit must not overwrite A
  const pageB = await ctx.newPage();
  await pageB.goto(editUrl);
  await pageB.waitForSelector("text=Frente");
  await front(page, 0).fill("rojo oscuro");
  await waitSaved();
  await front(pageB, 1).fill("verde");
  await pageB.waitForSelector("text=/otra pestaña|another tab/", { timeout: 15000 });
  server = await api(page, gameId);
  assert(server.items[0].text === "rojo oscuro" && server.items[1].text === "azul claro", `stale tab did not overwrite (got ${server.items.map((i) => i.text)})`);
  await shot(pageB, "2-conflict");
  await pageB.getByRole("button", { name: /Cargar la versión guardada|Load the saved version/ }).click();
  assert((await front(pageB, 0).inputValue()) === "rojo oscuro", "loaded the newer version");
  await pageB.close();
  log("stale tab: conflict shown, newer save kept");

  // Publish, then edit again: the status change must not be taken as a conflict
  await page.reload();
  await page.waitForSelector("text=Frente");
  await page.getByRole("button", { name: /^Publish|^Publicar/ }).click();
  await page.waitForSelector("text=Published", { timeout: 15000 });
  await front(page, 1).fill("amarillo");
  await waitSaved();
  assert((await page.locator("text=/otra pestaña|another tab/").count()) === 0, "no conflict after publishing");
  log("publish then edit: saved without a conflict");

  // "My images": reuse an image uploaded earlier without uploading it again
  const row = (i) => page.locator("ol > li").nth(i);
  await row(0).getByRole("button", { name: "Añadir imagen (Frente)" }).click();
  let dlg = page.getByRole("dialog", { name: "Añadir imagen" });
  await dlg.locator("input[type=file]").setInputFiles(path.resolve("e2e/fixtures", "red-circle.png"));
  const ed = page.getByRole("dialog", { name: "Editar" });
  await ed.getByRole("button", { name: "Aplicar" }).click();
  await ed.waitFor({ state: "detached" });
  await waitSaved();
  await row(1).getByRole("button", { name: "Añadir imagen (Frente)" }).click();
  dlg = page.getByRole("dialog", { name: "Añadir imagen" });
  await dlg.getByRole("tab", { name: "Mis imágenes" }).click();
  await dlg.locator("button[title]").first().click();
  await dlg.waitFor({ state: "detached" });
  for (let i = 0; i < 20; i++) {
    server = await api(page, gameId);
    if (server.items[1].imageAssetId) break;
    await page.waitForTimeout(500);
  }
  assert(server.items[1].imageAssetId && server.items[1].imageAssetId === server.items[0].imageAssetId, "My images reused the uploaded image");
  log("My images: reused an uploaded image");

  // Link click right after typing: saved before leaving
  await front(page, 0).fill("morado");
  await page.getByRole("link", { name: "← Activities" }).click();
  await page.waitForURL(`${BASE}/teacher/games`);
  server = await api(page, gameId);
  assert(server.items[0].text === "morado", `link click saved first (got ${server.items[0].text})`);
  log("link with unsaved changes: saved first");

  // My Activities lists it; a second teacher's activity does not appear
  await page.goto(`${BASE}/teacher/my-activities`);
  await page.waitForSelector("text=Los colores");
  // Device-only changes are listed as a reminder
  await page.evaluate((id) => localStorage.setItem(`sls-editor-${id}`, JSON.stringify({ id, title: "Los colores", items: [{}, {}] })), gameId);
  await page.reload();
  await page.waitForSelector("text=unsaved changes on this device");
  await shot(page, "3-my-activities");
  log("My Activities: lists the activity and the device reminder");

  const ctx2 = await browser.newContext();
  const p2 = await ctx2.newPage();
  await p2.goto(`${BASE}/signup`);
  await p2.fill("#displayName", "Otra Maestra");
  await p2.fill("#schoolName", "Otro Colegio");
  await p2.fill("#email", `myact2${stamp}@school.test`);
  await p2.fill("#password", "correct-horse-42");
  await p2.click("button[type=submit]");
  await p2.waitForURL(`${BASE}/teacher`);
  await p2.goto(`${BASE}/teacher/my-activities`);
  assert((await p2.locator("text=Los colores").count()) === 0, "other teacher does not see it");
  await ctx2.close();
  log("another teacher does not see it");

  console.log("\nALL MY-ACTIVITIES CHECKS PASSED");
} catch (e) {
  await shot(page, "fail");
  console.error("FAILED:", e.message);
  process.exitCode = 1;
} finally {
  await browser.close();
}
