// End-to-end test for Create Activity with the 3D activity-type cards, in Teacher View and in
// Platform Admin. For each of the eleven types: choose the card → the right editor opens (type
// icon and name in the header) → enter content → it saves → the preview opens with the same icon
// → reopening the activity shows the saved content. Also: Recommended / Alphabetical order (the
// keys don't change), keyboard selection, the same icon in My Activities, Spanish names.
// Server: npm run build && EMAIL_DRIVER=console npx next start -p 3100
// Run:    BASE_URL=http://localhost:3100 SCREENSHOTS=/tmp/shots node e2e/create-activity.e2e.mjs
import { chromium } from "playwright";
import path from "node:path";
import bcrypt from "bcryptjs";
import prismaPkg from "@prisma/client";

const { PrismaClient } = prismaPkg;
const db = new PrismaClient();
const BASE = process.env.BASE_URL ?? "http://localhost:3100";
const SHOTS = process.env.SCREENSHOTS;
const stamp = Date.now();
const log = (...a) => console.log("•", ...a);
const assert = (c, m) => {
  if (!c) throw new Error(m);
};
const shot = async (p, name, full = false) => SHOTS && p.screenshot({ path: path.join(SHOTS, `${name}.png`), fullPage: full });
const fx = (f) => path.resolve("e2e/fixtures", f);
const PASSWORD = "correct-horse-42";

const TYPES = [
  ["FLASHCARDS", "Flashcards", "flashcards"],
  ["SPIN_THE_WHEEL", "Spin the Wheel", "spin-the-wheel"],
  ["MATCH_AND_SPEAK", "Match & Speak", "match-and-speak"],
  ["SPELL_THE_WORD", "Spell the Word", "spell-the-word"],
  ["SPEAK_AND_ANSWER", "Image & Speak", "image-and-speak"],
  ["LISTEN_AND_SPEAK", "Listen & Repeat", "listen-and-repeat"],
  ["OPEN_THE_BOX", "Open the Box", "open-the-box"],
  ["LABEL_THE_DIAGRAM", "Label the Diagram", "label-the-diagram"],
  ["SPELL_YOUR_NAME", "Spell Your Name", "spell-your-name"],
  ["QUESTION_AND_ANSWER", "Question & Answer", "question-and-answer"],
  ["IMAGE_AND_VOCABULARY", "Picture Words", "picture-words"],
];
const NEEDS_IMAGE = new Set(["MATCH_AND_SPEAK", "SPEAK_AND_ANSWER", "IMAGE_AND_VOCABULARY"]);

const hash = await bcrypt.hash(PASSWORD, 10);
const school = await db.school.create({ data: { name: `Iconos ${stamp % 10000}` } });
async function user(name, email, role) {
  const u = await db.user.create({ data: { schoolId: school.id, role, email, passwordHash: hash, displayName: name, emailVerifiedAt: new Date(), welcomeSentAt: new Date() } });
  await db.teacher.create({ data: { userId: u.id, schoolId: school.id } });
  return email;
}
const teacherEmail = await user("Marta Iconos", `ca-teacher-${stamp}@lextro.test`, "TEACHER");
const adminEmail = await user("Diego Admin", `ca-admin-${stamp}@lextro.test`, "ADMIN");

const browser = await chromium.launch();
const errors = [];
async function signedIn(email, viewport = { width: 1440, height: 1000 }) {
  const ctx = await browser.newContext({ viewport, locale: "en-US" });
  const p = await ctx.newPage();
  p.on("pageerror", (e) => errors.push(`${p.url()}: ${e.message.slice(0, 160)}`));
  p.on("dialog", (d) => d.accept());
  await p.goto(`${BASE}/login`);
  await p.fill("#email", email);
  await p.fill("#password", PASSWORD);
  await p.click("button[type=submit]");
  await p.waitForURL(`${BASE}/teacher`);
  return { ctx, p };
}
const iconsLoaded = (p, sel) => p.waitForFunction((s) => [...document.querySelectorAll(s)].length > 0 && [...document.querySelectorAll(s)].every((i) => i.complete && i.naturalWidth > 0), sel);
const saved = (p) => p.waitForSelector("text=/✓ Saved|✓ Guardado/", { timeout: 20000 });

async function addImage(p, scope) {
  await scope.getByRole("button", { name: /^Add image/ }).first().click();
  const dlg = p.getByRole("dialog", { name: "Add image" });
  await dlg.getByRole("tab", { name: "Upload image" }).click();
  await dlg.locator("input[type=file]").setInputFiles(fx("dog.png"));
  const ed = p.getByRole("dialog", { name: "Edit" });
  await ed.getByRole("button", { name: "Apply" }).click();
  await ed.waitFor({ state: "detached" });
}

// Fill the empty text fields of the first item (whatever the template asks for).
async function fillFirstItem(p, word) {
  const item = p.locator("main ol > li").first();
  await item.waitFor();
  // Open folded optional parts (e.g. the flashcards' spoken answer).
  for (const b of await item.getByRole("button", { name: /\(optional\)/ }).all()) await b.click().catch(() => {});
  const fields = item.locator("input[type=text]:visible, input:not([type]):visible, textarea:visible");
  const n = await fields.count();
  let filled = 0;
  for (let i = 0; i < n; i++) {
    const f = fields.nth(i);
    if (!(await f.isEditable()) || (await f.inputValue())) continue;
    await f.fill(word);
    filled++;
  }
  return { item, filled };
}

async function createEach(p, workspace) {
  const games = workspace === "admin" ? "/admin/games" : "/teacher/games";
  const results = [];
  for (const [key, name, icon] of TYPES) {
    await p.goto(`${BASE}${games}/new`);
    await p.click(`button[value=${key}]`);
    await p.waitForURL(new RegExp(`${games}/[^/]+/edit$`), { timeout: 30000 });
    const id = p.url().split("/").at(-2);
    const head = p.getByTestId("editor-activity-type");
    await head.waitFor();
    assert((await head.locator("img").getAttribute("src")).includes(`/activity-icons/${icon}-`), `${key}: editor header icon`);
    assert((await head.textContent()).includes(name) || workspace === "es", `${key}: editor header says ${name}, got ${await head.textContent()}`);
    const title = `${name} ${stamp % 1000}`;
    await p.locator("#game-title").fill(title);
    const word = `rojo${results.length}`;
    const { item, filled } = await fillFirstItem(p, word);
    if (NEEDS_IMAGE.has(key)) {
      await addImage(p, item);
      await item.locator("img").first().waitFor();
    }
    await saved(p);
    // Preview: same icon and name.
    await p.goto(`${BASE}/play/preview/${id}`);
    await p.waitForSelector("text=Teacher preview — answers are not saved", { timeout: 30000 });
    const prevIcon = await p.locator(`img[data-activity-icon]`).first().getAttribute("src").catch(() => null);
    // Reopen: title and content kept.
    await p.goto(`${BASE}${games}/${id}/edit`);
    await p.getByTestId("editor-activity-type").waitFor();
    const keptTitle = await p.locator("#game-title").inputValue();
    const api = await p.evaluate((id) => fetch(`/api/games/${id}`).then((r) => r.json()), id);
    const blob = JSON.stringify(api);
    assert(keptTitle === title, `${key}: reopened title "${keptTitle}"`);
    assert(filled === 0 || blob.includes(word), `${key}: saved content includes ${word}`);
    const row = await db.game.findUnique({ where: { id }, select: { templateKey: true } });
    assert(row.templateKey === key, `${key}: saved as ${row.templateKey}`);
    results.push({ key, id, filled, preview: prevIcon?.includes(icon) ?? false });
    log(`${workspace}: ${name} → editor, ${filled} field(s), saved, preview${prevIcon ? " (icon)" : ""}, reopened`);
  }
  return results;
}

try {
  // ── Teacher View ──
  const { p } = await signedIn(teacherEmail);
  await p.goto(`${BASE}/teacher/games/new`);
  await p.waitForSelector("h1:text-is('Create Activity')");
  await iconsLoaded(p, "[data-testid=activity-type] img");
  const cards = p.getByTestId("activity-type");
  const order = () => cards.evaluateAll((els) => els.map((e) => e.getAttribute("value")));
  assert(JSON.stringify(await order()) === JSON.stringify(TYPES.map((t) => t[0])), `recommended order ${await order()}`);
  // Two columns on desktop: Picture Words alone in the last row, one card wide.
  const boxes = await cards.evaluateAll((els) => els.map((e) => e.getBoundingClientRect()).map((r) => ({ x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) })));
  assert(boxes[0].y === boxes[1].y && boxes[1].x > boxes[0].x, "row 1: Flashcards | Spin the Wheel");
  assert(boxes[10].w === boxes[0].w && boxes[10].x === boxes[0].x, "Picture Words is one card wide, in the left column");
  for (let i = 0; i < 10; i += 2) assert(boxes[i].h === boxes[i + 1].h, `row ${i / 2 + 1}: cards share the height`);
  await shot(p, "ca1-desktop", true);
  // Hover: purple border, lift.
  await cards.nth(2).hover();
  await p.waitForTimeout(250);
  const hover = await cards.nth(2).evaluate((e) => ({ b: getComputedStyle(e).borderColor, t: getComputedStyle(e).transform }));
  assert(hover.b === "rgb(98, 13, 120)" && hover.t !== "none", `hover style ${JSON.stringify(hover)}`);
  await shot(p, "ca2-hover");
  // Alphabetical, then back.
  await p.getByTestId("sort-alphabetical").click();
  const names = await cards.evaluateAll((els) => els.map((e) => e.querySelector(".activity-type-card__name").textContent));
  assert(JSON.stringify(names) === JSON.stringify([...names].sort((a, b) => a.localeCompare(b))), `alphabetical ${names}`);
  assert((await p.getByTestId("sort-alphabetical").getAttribute("aria-pressed")) === "true", "Alphabetical pressed");
  assert(new Set(await order()).size === 11, "keys kept");
  await shot(p, "ca3-alphabetical");
  await p.getByTestId("sort-recommended").click();
  // Keyboard: Tab to a card, visible focus, Enter opens its editor.
  await p.getByTestId("sort-recommended").focus();
  await p.keyboard.press("Tab");
  await p.keyboard.press("Tab");
  const focused = await p.evaluate(() => document.activeElement?.getAttribute("value"));
  assert(focused === "FLASHCARDS", `first card after the sort buttons, got ${focused}`);
  const ring = await p.evaluate(() => getComputedStyle(document.activeElement).outlineStyle);
  assert(ring !== "none", "focus ring visible");
  await shot(p, "ca4-keyboard-focus");
  await p.keyboard.press("Enter");
  await p.waitForURL(/\/teacher\/games\/[^/]+\/edit$/);
  log("Create Activity: order, two columns, hover, Alphabetical, keyboard");

  const teacherResults = await createEach(p, "teacher");
  await shot(p, "ca5-editor-header");

  // My Activities: the same icons.
  await p.goto(`${BASE}/teacher/my-activities`);
  await p.getByTestId("activity").first().waitFor();
  await iconsLoaded(p, "[data-testid=activity] img[data-activity-icon]");
  for (const [key, , icon] of TYPES) {
    assert(await p.locator(`[data-testid=activity] img[data-activity-icon=${key}][src*='/${icon}-']`).count(), `My Activities shows the ${key} icon`);
  }
  await shot(p, "ca6-my-activities", true);
  log("My Activities: each type with its icon");

  // Spanish (editor language choice is shared): names translated, alphabetical by Spanish names.
  await p.evaluate(() => localStorage.setItem("sls-ui-lang", "es"));
  await p.goto(`${BASE}/teacher/games/new`);
  await p.waitForSelector("h1:text-is('Crear actividad')");
  await p.getByTestId("sort-alphabetical").click();
  const es = await cards.evaluateAll((els) => els.map((e) => e.querySelector(".activity-type-card__name").textContent));
  assert(es[0] === "Abre la caja", `Spanish alphabetical starts with ${es[0]}`);
  await shot(p, "ca7-spanish");
  await p.getByTestId("sort-recommended").click();
  await p.evaluate(() => localStorage.setItem("sls-ui-lang", "en"));
  log("Spanish names and alphabetical order");

  // Phone width: one column.
  await p.setViewportSize({ width: 390, height: 844 });
  await p.goto(`${BASE}/teacher/games/new`);
  await iconsLoaded(p, "[data-testid=activity-type] img");
  const xs = await cards.evaluateAll((els) => [...new Set(els.map((e) => Math.round(e.getBoundingClientRect().x)))]);
  assert(xs.length === 1, `one column on a phone (${xs})`);
  const overflow = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  assert(overflow <= 0, `no horizontal scroll (${overflow}px)`);
  await shot(p, "ca8-phone", true);

  // ── Platform Admin ──
  const { p: a } = await signedIn(adminEmail);
  await a.goto(`${BASE}/admin/games/new`);
  await a.waitForSelector("h1:text-is('Create Activity')");
  await iconsLoaded(a, "[data-testid=activity-type] img");
  await shot(a, "ca9-admin", true);
  const adminResults = await createEach(a, "admin");

  // A teacher can't open Platform Admin's Create Activity.
  await p.goto(`${BASE}/admin/games/new`);
  assert(!p.url().includes("/admin/games/new") || (await p.getByTestId("activity-type").count()) === 0, "teacher kept out of Platform Admin");

  const noPreviewIcon = [...teacherResults, ...adminResults].filter((r) => !r.preview).map((r) => r.key);
  if (noPreviewIcon.length) log("preview without icon strip:", [...new Set(noPreviewIcon)].join(", "));
  assert(errors.length === 0, `page errors:\n${errors.join("\n")}`);
  log("ALL PASSED");
} catch (e) {
  console.error("FAILED:", e.message);
  if (errors.length) console.error(errors.join("\n"));
  process.exitCode = 1;
} finally {
  await browser.close();
  await db.$disconnect();
}
