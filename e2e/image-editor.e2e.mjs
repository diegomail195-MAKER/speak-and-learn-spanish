// End-to-end test for the picture editor: each rotate/flip goes the right way (checked on the
// canvas pixels of a four-colour test picture), Undo steps back one edit, Undo changes returns
// to the original, Crop cuts to the box, an applied edit can still be undone when reopened,
// and Replace / Remove still work. Also the 3D tool bar: 44px buttons, wraps on a narrow screen.
//
// Run: BASE_URL=http://localhost:3100 node e2e/image-editor.e2e.mjs
import { chromium } from "playwright";
import { writeFileSync } from "node:fs";
import path from "node:path";

const BASE = process.env.BASE_URL ?? "http://localhost:3100";
const SHOTS = process.env.SCREENSHOTS;
const shot = async (p, name) => SHOTS && p.screenshot({ path: path.join(SHOTS, `${name}.png`) });
const stamp = Date.now();
const log = (...a) => console.log("•", ...a);
const assert = (c, m) => {
  if (!c) throw new Error(m);
};

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 }, locale: "en-US" });
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));

// Test picture, 200×100: red | blue on top, green | yellow below.
const QUAD = "/tmp/quad-e2e.png";
const NAMES = { "255,0,0": "red", "0,0,255": "blue", "0,160,0": "green", "255,220,0": "yellow" };

/** The editor canvas: size and the colour near each corner. */
const look = () =>
  page.getByTestId("image-canvas").evaluate((c, names) => {
    const g = c.getContext("2d");
    const at = (x, y) => names[Array.from(g.getImageData(x, y, 1, 1).data).slice(0, 3).join(",")] ?? "other";
    return { w: c.width, h: c.height, tl: at(3, 3), tr: at(c.width - 4, 3), bl: at(3, c.height - 4), br: at(c.width - 4, c.height - 4) };
  }, NAMES);
const tool = (name) => page.getByRole("dialog", { name: "Edit" }).getByRole("button", { name, exact: true });

try {
  await page.goto(`${BASE}/login`);
  const png = await page.evaluate(() => {
    const c = document.createElement("canvas");
    c.width = 200;
    c.height = 100;
    const g = c.getContext("2d");
    [["#ff0000", 0, 0], ["#0000ff", 100, 0], ["#00a000", 0, 50], ["#ffdc00", 100, 50]].forEach(([f, x, y]) => ((g.fillStyle = f), g.fillRect(x, y, 100, 50)));
    return c.toDataURL("image/png").split(",")[1];
  });
  writeFileSync(QUAD, Buffer.from(png, "base64"));

  await page.goto(`${BASE}/signup`);
  await page.fill("#displayName", "Ana Rivera");
  await page.fill("#schoolName", "Colegio Imagen");
  await page.fill("#email", `img${stamp}@school.test`);
  await page.fill("#password", "correct-horse-42");
  await page.click("button[type=submit]");
  await page.waitForURL(`${BASE}/teacher`);
  await page.goto(`${BASE}/teacher/games/new`);
  await page.click("button[value=FLASHCARDS]");
  await page.waitForURL(/\/edit$/);
  await page.getByRole("button", { name: "EN", exact: true }).click();

  // Upload the picture on the first card's front; the editor opens on it.
  await page.locator("ol > li").first().getByRole("button", { name: /^Add image/ }).first().click();
  const add = page.getByRole("dialog", { name: "Add image" });
  await add.getByRole("tab", { name: "Upload image" }).click();
  await add.locator("input[type=file]").setInputFiles(QUAD);
  const ed = page.getByRole("dialog", { name: "Edit" });
  await page.getByTestId("image-canvas").waitFor();
  await page.waitForFunction(() => document.querySelector("[data-testid=image-canvas]")?.width === 200);

  // The bar: real buttons, at least 44px tall, icon-only ones named, with a tooltip.
  for (const n of ["Undo", "Rotate left", "Rotate right", "Flip horizontally", "Flip vertically", "Crop", "Undo changes"]) {
    const b = tool(n);
    const box = await b.boundingBox();
    assert(box && box.height >= 44, `${n}: at least 44px tall (${box?.height})`);
    assert((await b.getAttribute("title")) === n, `${n}: tooltip`);
  }
  assert(await tool("Undo").isDisabled(), "Undo off before any edit");
  assert(await tool("Undo changes").isDisabled(), "Undo changes off before any edit");
  let v = await look();
  assert(v.w === 200 && v.h === 100 && v.tl === "red" && v.tr === "blue" && v.bl === "green" && v.br === "yellow", `start ${JSON.stringify(v)}`);
  await shot(page, "ie1-editor");

  // Rotate right = clockwise: the bottom-left (green) comes to the top-left.
  await tool("Rotate right").click();
  v = await look();
  assert(v.w === 100 && v.h === 200 && v.tl === "green" && v.tr === "red" && v.br === "blue", `rotate right ${JSON.stringify(v)}`);
  await tool("Undo").click();
  v = await look();
  assert(v.w === 200 && v.tl === "red", `undo after rotate right ${JSON.stringify(v)}`);
  // Rotate left = counter-clockwise: the top-right (blue) comes to the top-left.
  await tool("Rotate left").click();
  v = await look();
  assert(v.w === 100 && v.h === 200 && v.tl === "blue" && v.bl === "red", `rotate left ${JSON.stringify(v)}`);
  await tool("Undo").click();
  // Flip horizontally: left and right swap.
  await tool("Flip horizontally").click();
  v = await look();
  assert(v.tl === "blue" && v.tr === "red" && v.bl === "yellow", `flip horizontally ${JSON.stringify(v)}`);
  await tool("Undo").click();
  // Flip vertically: top and bottom swap.
  await tool("Flip vertically").click();
  v = await look();
  assert(v.tl === "green" && v.bl === "red" && v.tr === "yellow", `flip vertically ${JSON.stringify(v)}`);
  // After a rotation, flip horizontally still swaps what is on the left and right of the screen.
  await tool("Rotate right").click(); // tl red? flipV then rotR: [red bottom-left…]
  const before = await look();
  await tool("Flip horizontally").click();
  v = await look();
  assert(v.tl === before.tr && v.tr === before.tl, `flip after rotate ${JSON.stringify(before)} → ${JSON.stringify(v)}`);
  log("rotate right/left, flip horizontally/vertically go the right way (also after a rotation)");

  // Undo changes: back to the original; Undo then brings the edits back.
  await tool("Undo changes").click();
  v = await look();
  assert(v.w === 200 && v.tl === "red" && v.br === "yellow", `undo changes ${JSON.stringify(v)}`);
  assert(await tool("Undo changes").isDisabled(), "Undo changes off on the original");
  await tool("Undo").click();
  v = await look();
  assert(v.tl === before.tr, `undo brings the edits back ${JSON.stringify(v)}`);
  await tool("Undo changes").click();
  log("Undo steps back one edit; Undo changes returns to the original (and can itself be undone)");

  // Crop: drag a box over the red quarter, then Crop.
  assert(await tool("Crop").isDisabled(), "Crop off without a box");
  const cb = await page.getByTestId("image-canvas").boundingBox();
  await page.mouse.move(cb.x + cb.width * 0.03, cb.y + cb.height * 0.05);
  await page.mouse.down();
  await page.mouse.move(cb.x + cb.width * 0.47, cb.y + cb.height * 0.45, { steps: 5 });
  await page.mouse.up();
  await shot(page, "ie2-crop-box");
  await tool("Crop").click();
  v = await look();
  assert(v.w < 100 && v.h < 50 && [v.tl, v.tr, v.bl, v.br].every((c) => c === "red"), `crop ${JSON.stringify(v)}`);
  log("Crop cuts to the box", `${v.w}×${v.h}`);

  // Apply: a new picture; reopening it can still undo back to the original.
  const row = page.locator("ol > li").first();
  await ed.getByRole("button", { name: "Apply" }).click();
  await ed.waitFor({ state: "detached" });
  const thumb = row.getByRole("button", { name: /^Edit:/ }).first();
  const firstSrc = await thumb.locator("img").getAttribute("src");
  await thumb.click();
  await page.waitForFunction(() => (document.querySelector("[data-testid=image-canvas]")?.width ?? 999) < 100);
  assert(!(await tool("Undo").isDisabled()) && !(await tool("Undo changes").isDisabled()), "reopened: Undo and Undo changes available");
  await tool("Undo").click();
  v = await look();
  assert(v.w === 200 && v.h === 100, `reopened, Undo removes the crop (the box stays drawn) ${JSON.stringify(v)}`);
  await tool("Undo").click(); // the box goes too: the original picture, nothing left to reset
  assert(await tool("Undo changes").isDisabled(), "on the original, Undo changes is off");
  await ed.getByRole("button", { name: "Apply" }).click();
  await ed.waitFor({ state: "detached" });
  const origSrc = await thumb.locator("img").getAttribute("src");
  assert(origSrc !== firstSrc, "Undo changes + Apply puts the original picture back");
  await thumb.click();
  await page.waitForFunction(() => document.querySelector("[data-testid=image-canvas]")?.width === 200);
  assert(await tool("Undo").isDisabled(), "the original opens with nothing to undo");
  log("after Apply, reopening keeps Undo/Undo changes; Undo changes + Apply restores the original picture");

  // Replace opens the picture search; Remove takes the picture off.
  await tool("Replace").click();
  await page.getByRole("dialog", { name: "Add image" }).waitFor();
  await page.getByRole("dialog", { name: "Add image" }).getByRole("button", { name: "Close" }).click();
  await thumb.click();
  await tool("Remove").click();
  await row.getByRole("button", { name: /^Edit:/ }).waitFor({ state: "detached" });
  log("Replace opens Add image; Remove takes the picture off");

  // Narrow screen: the bar wraps to a second row, no sideways scroll.
  await row.getByRole("button", { name: /^Add image/ }).first().click();
  await add.getByRole("tab", { name: "Upload image" }).click();
  await add.locator("input[type=file]").setInputFiles(QUAD);
  await page.getByTestId("image-canvas").waitFor();
  await ed.getByRole("button", { name: "Apply" }).click();
  await ed.waitFor({ state: "detached" });
  await page.setViewportSize({ width: 390, height: 800 });
  await row.getByRole("button", { name: /^Edit:/ }).first().click();
  const u = await tool("Undo").boundingBox();
  const r = await tool("Remove").boundingBox();
  assert(r.y > u.y + 20, "the bar wraps on a narrow screen");
  const over = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  assert(over <= 1, `no sideways scroll (${over})`);
  await shot(page, "ie3-narrow");
  log("narrow screen: the bar wraps to more rows");

  assert(errors.length === 0, `page errors: ${errors.join(" | ")}`);
  console.log("• ALL IMAGE EDITOR CHECKS PASSED");
} catch (e) {
  console.error("FAIL", e.message);
  process.exitCode = 1;
} finally {
  await browser.close();
}
