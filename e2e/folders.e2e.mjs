// My Activities folders: solid colour palette, New folder with live preview, Edit folder (⋯ menu)
// for name and/or colour, old folders without a valid colour, persistence after reload, the folder's
// contents after editing, saving state / no double submit / error keeps the changes, phone and keyboard.
// Run: BASE_URL=http://localhost:3100 node e2e/folders.e2e.mjs   (needs DATABASE_URL for the old-folder step)
// Optional: SCREENSHOTS=/some/dir to save screenshots.
import { chromium } from "playwright";
import path from "node:path";
import prismaPkg from "@prisma/client";

const { PrismaClient } = prismaPkg;
const BASE = process.env.BASE_URL ?? "http://localhost:3100";
const SHOTS = process.env.SCREENSHOTS;
const stamp = Date.now();
const log = (...a) => console.log("•", ...a);
const assert = (c, m) => {
  if (!c) throw new Error(m);
};
const shot = async (p, name) => SHOTS && p.screenshot({ path: path.join(SHOTS, `${name}.png`) });

const COLORS = [
  ["coral", "Red", "rgb(239, 68, 68)"],
  ["sky", "Blue", "rgb(37, 99, 235)"],
  ["sun", "Yellow", "rgb(250, 204, 21)"],
  ["leaf", "Green", "rgb(34, 197, 94)"],
  ["orange", "Orange", "rgb(249, 115, 22)"],
  ["grape", "Purple", "rgb(147, 51, 234)"],
  ["berry", "Fuchsia", "rgb(236, 72, 153)"],
  ["teal", "Turquoise", "rgb(6, 182, 212)"],
];

const db = new PrismaClient();
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: "en-US", deviceScaleFactor: 2 });
const page = await ctx.newPage();
page.on("pageerror", (e) => console.error("PAGE ERROR", e.message));
const tile = (name) => page.locator("[data-testid=folder]").filter({ has: page.getByText(name, { exact: true }) });
const tileColor = (name) => tile(name).locator("[data-folder-color]").first().getAttribute("data-folder-color");
const dialog = () => page.getByTestId("folder-dialog");
const MY = `${BASE}/teacher/my-activities`;

async function openEdit(name) {
  await tile(name).getByRole("button", { name: `Options for folder ${name}` }).click();
  await page.getByRole("menuitem", { name: "Edit folder" }).click();
  await page.getByRole("dialog", { name: "Edit folder" }).waitFor();
}
async function saveAndWait() {
  await dialog().getByRole("button", { name: "Save changes" }).click();
  await dialog().waitFor({ state: "detached" });
}

try {
  await page.goto(`${BASE}/signup`);
  await page.fill("#displayName", "Diego Carpetas");
  await page.fill("#schoolName", "Colegio Carpetas");
  await page.fill("#email", `folders${stamp}@school.test`);
  await page.fill("#password", "correct-horse-42");
  await page.click("button[type=submit]");
  await page.waitForURL(`${BASE}/teacher`);
  const user = await db.user.findFirst({ where: { email: `folders${stamp}@school.test` }, include: { teacher: true } });
  const teacherId = user.teacher.id;

  // An activity to put inside a folder
  await page.goto(`${BASE}/teacher/games/new`);
  await page.click("button[value=FLASHCARDS]");
  await page.waitForURL(/\/edit$/);
  const gameId = page.url().split("/").at(-2);
  await db.game.update({ where: { id: gameId }, data: { title: "Los colores" } });

  // 1-2. New folder: palette, preview, validation, one folder per colour
  await page.goto(MY);
  await page.getByRole("button", { name: "+ New folder" }).click();
  const d = page.getByRole("dialog", { name: "New folder" });
  await d.waitFor();
  // Swatches: 36px circles in 44px targets, accessible names, Blue preselected
  for (const [key, label, rgb] of COLORS) {
    const sw = d.getByTestId(`swatch-${key}`);
    const box = await sw.boundingBox();
    assert(box.width >= 44 && box.height >= 44, `${label}: target ≥ 44px (got ${box.width}×${box.height})`);
    const circle = sw.locator("span").first();
    const cb = await circle.boundingBox();
    assert(Math.round(cb.width) === 36 && Math.round(cb.height) === 36, `${label}: circle 36px (got ${cb.width})`);
    assert((await circle.evaluate((e) => getComputedStyle(e).backgroundColor)) === rgb, `${label}: colour ${rgb}`);
    assert((await d.getByRole("radio", { name: label }).count()) === 1, `${label}: accessible name`);
  }
  assert(await d.getByRole("radio", { name: "Blue" }).isChecked(), "Blue preselected");
  // Empty name is refused with a message
  await d.getByRole("button", { name: "Create folder" }).click();
  await d.getByText("Write a name for the folder.").waitFor();
  assert((await page.locator("#folder-name").getAttribute("aria-invalid")) === "true", "name marked invalid");
  // Preview follows the name and colour
  await page.fill("#folder-name", "Preview test");
  assert((await d.getByTestId("folder-preview").textContent()).includes("Preview test"), "preview shows the name");
  await d.getByTestId("swatch-grape").click();
  assert((await d.getByTestId("folder-preview").getAttribute("data-folder-color")) === "grape", "preview shows the colour");
  assert(await d.getByRole("radio", { name: "Purple" }).isChecked(), "click selects Purple");
  // Selected swatch: check mark + outline
  const sel = d.getByTestId("swatch-grape").locator("span").first();
  assert((await sel.locator("svg").count()) === 1, "check mark on the selected colour");
  assert((await sel.evaluate((e) => getComputedStyle(e).outlineStyle)) === "solid", "outline on the selected colour");
  assert((await d.getByTestId("swatch-sky").locator("svg").count()) === 0, "no check on the others");
  // Tooltip on hover
  await d.getByTestId("swatch-sun").hover();
  await page.waitForTimeout(250);
  assert((await d.getByTestId("swatch-sun").locator("span").nth(1).evaluate((e) => getComputedStyle(e).opacity)) === "1", "tooltip shows the colour name on hover");
  await d.getByRole("button", { name: "Cancel" }).click();
  log("palette: 8 solid colours, 36/44px, check + outline, names, tooltip, preview, empty-name validation");

  for (const [key, label] of COLORS) {
    await page.getByRole("button", { name: "+ New folder" }).click();
    await page.fill("#folder-name", `F ${label}`);
    await dialog().getByTestId(`swatch-${key}`).click();
    await dialog().getByRole("button", { name: "Create folder" }).click();
    await dialog().waitFor({ state: "detached" });
    await tile(`F ${label}`).waitFor();
    assert((await tileColor(`F ${label}`)) === key, `F ${label} tile shows ${key}`);
  }
  await page.reload();
  for (const [key, label] of COLORS) assert((await tileColor(`F ${label}`)) === key, `after reload F ${label} is ${key}`);
  const rows = await db.activityFolder.findMany({ where: { teacherId }, select: { name: true, color: true } });
  for (const [key, label] of COLORS) assert(rows.find((r) => r.name === `F ${label}`)?.color === key, `DB: F ${label} = ${key}`);
  log("created one folder per colour; colours shown, kept after reload and saved in the database");
  await shot(page, "folders-palette");

  // Put the activity in "F Blue"
  const blue = await db.activityFolder.findFirst({ where: { teacherId, name: "F Blue" } });
  await db.game.update({ where: { id: gameId }, data: { folderId: blue.id } });

  // 3. Edit: name only
  await page.reload();
  await openEdit("F Blue");
  assert((await page.locator("#folder-name").inputValue()) === "F Blue", "edit opens with the current name");
  assert(await dialog().getByRole("radio", { name: "Blue" }).isChecked(), "edit opens with the current colour");
  await page.fill("#folder-name", "Unidad 1");
  await saveAndWait();
  await tile("Unidad 1").waitFor();
  assert((await tileColor("Unidad 1")) === "sky", "name only: colour unchanged");
  let row = await db.activityFolder.findUnique({ where: { id: blue.id } });
  assert(row.name === "Unidad 1" && row.color === "sky", "name only saved, same id");
  log("edit: name only");

  // Colour only
  await openEdit("Unidad 1");
  await dialog().getByTestId("swatch-berry").click();
  await saveAndWait();
  await page.waitForFunction(() => document.querySelector("[data-testid=folder] [data-folder-color=berry]"));
  row = await db.activityFolder.findUnique({ where: { id: blue.id } });
  assert(row.name === "Unidad 1" && row.color === "berry", "colour only saved");
  log("edit: colour only");

  // Both
  await openEdit("Unidad 1");
  await page.fill("#folder-name", "Unidad 2");
  await dialog().getByTestId("swatch-teal").click();
  await saveAndWait();
  await tile("Unidad 2").waitFor();
  assert((await tileColor("Unidad 2")) === "teal", "both: tile colour");
  row = await db.activityFolder.findUnique({ where: { id: blue.id } });
  assert(row.id === blue.id && row.name === "Unidad 2" && row.color === "teal", "both saved, same id");
  log("edit: name and colour, id kept");

  // Reload, open the folder: contents still there, title shows the new name and colour
  await page.reload();
  assert((await tileColor("Unidad 2")) === "teal", "kept after reload");
  await tile("Unidad 2").getByRole("link").click();
  await page.waitForURL(new RegExp(`folder=${blue.id}`));
  await page.getByRole("heading", { name: "Unidad 2" }).waitFor();
  assert((await page.getByRole("heading", { name: "Unidad 2" }).locator("[data-folder-color]").getAttribute("data-folder-color")) === "teal", "folder title icon in the new colour");
  await page.locator("[data-testid=activity]", { hasText: "Los colores" }).waitFor();
  log("after editing, the folder opens with its activity inside");

  // Search result shows the folder in its colour; Move to… lists it with its colour
  await page.goto(`${MY}?q=colores`);
  const act = page.locator("[data-testid=activity]", { hasText: "Los colores" });
  await act.getByText("Unidad 2").waitFor();
  assert((await act.locator("[data-folder-color]").getAttribute("data-folder-color")) === "teal", "search result: folder colour");
  await act.getByRole("button", { name: /Options for/ }).click();
  await page.getByRole("menuitem", { name: /Move to…/ }).click();
  assert((await page.getByRole("menuitem", { name: "F Red" }).locator("[data-folder-color]").getAttribute("data-folder-color")) === "coral", "Move to… shows colours");
  await page.keyboard.press("Escape");
  log("search results and Move to… show the updated folder");

  // Old folders: a retired colour and an empty colour show the default and can be edited
  await db.activityFolder.create({ data: { teacherId, name: "Vieja gris", color: "slate" } });
  await db.activityFolder.create({ data: { teacherId, name: "Vieja vacia", color: "" } });
  await page.goto(MY);
  assert((await tileColor("Vieja gris")) === "sky", "retired colour shows the default");
  assert((await tileColor("Vieja vacia")) === "sky", "empty colour shows the default");
  await openEdit("Vieja gris");
  assert(await dialog().getByRole("radio", { name: "Blue" }).isChecked(), "old folder opens with the default selected");
  await dialog().getByTestId("swatch-orange").click();
  await saveAndWait();
  await page.reload();
  assert((await tileColor("Vieja gris")) === "orange", "old folder edited and kept after reload");
  log("old folders: default colour shown, editable");

  // Saving state, no double submit, error keeps the changes and retry works
  let calls = 0;
  let fail = true;
  await page.route(`${MY}*`, async (route) => {
    const r = route.request();
    if (r.method() === "POST" && r.headers()["next-action"]) {
      calls++;
      await new Promise((res) => setTimeout(res, 600));
      if (fail) return route.abort("failed");
    }
    return route.continue();
  });
  await openEdit("Vieja vacia");
  await page.fill("#folder-name", "Recuperada");
  await dialog().getByTestId("swatch-leaf").click();
  const save = dialog().getByRole("button", { name: "Save changes" });
  await save.click();
  await dialog().getByRole("button", { name: "Saving…" }).waitFor();
  assert(await dialog().getByRole("button", { name: "Saving…" }).isDisabled(), "button disabled while saving");
  await dialog().getByRole("button", { name: "Saving…" }).click({ force: true }).catch(() => {});
  await page.keyboard.press("Enter");
  await dialog().getByRole("alert").waitFor();
  assert(calls === 1, `one request only (got ${calls})`);
  assert((await page.locator("#folder-name").inputValue()) === "Recuperada", "error keeps the name");
  assert(await dialog().getByRole("radio", { name: "Green" }).isChecked(), "error keeps the colour");
  await shot(page, "folders-error");
  fail = false;
  await dialog().getByRole("button", { name: "Save changes" }).click();
  await dialog().waitFor({ state: "detached" });
  await page.unroute(`${MY}*`);
  await page.reload();
  assert((await tileColor("Recuperada")) === "leaf", "retry saved");
  log("saving state, single request, error keeps changes, retry works");

  // Keyboard: open ⋯ with the keyboard, change colour with arrows, save with Enter
  await page.reload();
  const menuBtn = tile("F Yellow").getByRole("button", { name: "Options for folder F Yellow" });
  await menuBtn.focus();
  await page.keyboard.press("Enter");
  await page.getByRole("menuitem", { name: "Edit folder" }).focus();
  await page.keyboard.press("Enter");
  await page.getByRole("dialog", { name: "Edit folder" }).waitFor();
  assert(await page.locator("#folder-name").evaluate((e) => e === document.activeElement), "name field focused");
  await page.keyboard.press("Tab");
  assert(await dialog().getByRole("radio", { name: "Yellow" }).evaluate((e) => e === document.activeElement), "Tab goes to the selected colour");
  const tipOpacity = await dialog().getByTestId("swatch-sun").locator("span").nth(1).evaluate((e) => getComputedStyle(e).opacity);
  await page.keyboard.press("ArrowRight");
  assert(await dialog().getByRole("radio", { name: "Green" }).isChecked(), "ArrowRight picks the next colour");
  const ring = await dialog().getByTestId("swatch-leaf").locator("span").first().evaluate((e) => getComputedStyle(e).boxShadow);
  assert(ring && ring !== "none", "visible focus ring on the focused colour");
  await shot(page, "folders-keyboard");
  await page.keyboard.press("Enter");
  await dialog().waitFor({ state: "detached" });
  await page.reload();
  assert((await tileColor("F Yellow")) === "leaf", "keyboard edit saved");
  log(`keyboard: menu, Tab to colours (tooltip opacity ${tipOpacity}), arrows, Enter saves`);

  // Esc closes without saving
  await openEdit("F Red");
  await page.fill("#folder-name", "No guardar");
  await page.keyboard.press("Escape");
  await dialog().waitFor({ state: "detached" });
  assert((await tile("F Red").count()) === 1, "Esc: nothing saved");

  // Spanish when the teacher chose Spanish
  await page.evaluate(() => localStorage.setItem("sls-ui-lang", "es"));
  await page.reload();
  await page.getByRole("button", { name: "+ Nueva carpeta" }).click();
  await page.getByRole("dialog", { name: "Nueva carpeta" }).getByRole("radio", { name: "Fucsia" }).waitFor({ state: "attached" });
  await page.getByRole("button", { name: "Cancelar" }).click();
  await page.evaluate(() => localStorage.removeItem("sls-ui-lang"));
  log("labels follow the chosen interface language (Spanish)");

  // Edit modal screenshot at desktop
  await page.reload();
  await openEdit("Unidad 2");
  await page.fill("#folder-name", "Unidad 2 · Colores");
  await dialog().getByTestId("swatch-teal").hover();
  await page.waitForTimeout(250);
  await shot(page, "folders-edit-modal");
  await page.keyboard.press("Escape");

  // Phone: tiles fit, no horizontal scroll, ⋯ and swatches are tappable
  const phone = await browser.newContext({ ...(await import("playwright")).devices["iPhone 13"], storageState: await ctx.storageState() });
  const pp = await phone.newPage();
  await pp.goto(MY);
  assert(await pp.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "phone: no horizontal scroll");
  const ptile = pp.locator("[data-testid=folder]").filter({ has: pp.getByText("Unidad 2", { exact: true }) });
  await ptile.getByRole("button", { name: "Options for folder Unidad 2" }).tap();
  await pp.getByRole("menuitem", { name: "Edit folder" }).tap();
  const pd = pp.getByTestId("folder-dialog");
  await pd.waitFor();
  const db0 = await pd.boundingBox();
  assert(db0.x >= 0 && db0.x + db0.width <= 390, "phone: dialog inside the screen");
  await pd.getByTestId("swatch-coral").tap();
  assert(await pd.getByRole("radio", { name: "Red" }).isChecked(), "phone: tap selects");
  assert(await pp.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "phone dialog: no horizontal scroll");
  await shot(pp, "folders-phone-edit");
  await pd.getByRole("button", { name: "Save changes" }).tap();
  await pd.waitFor({ state: "detached" });
  await pp.reload();
  assert((await ptile.locator("[data-folder-color]").first().getAttribute("data-folder-color")) === "coral", "phone edit saved");
  await shot(pp, "folders-phone");
  await phone.close();
  log("phone: no horizontal scroll, tap ⋯ › Edit folder, tap colour, save");

  // Final palette screenshot (one folder per colour)
  await page.goto(MY);
  await shot(page, "folders-palette-final");

  console.log("\nAll folder checks passed.");
} catch (e) {
  await shot(page, "folders-failure").catch(() => {});
  console.error("FAILED:", e.message);
  process.exitCode = 1;
} finally {
  await browser.close();
  await db.$disconnect();
}
