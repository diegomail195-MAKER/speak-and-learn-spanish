// End-to-end test for the Library topic rows (horizontal list) and the topic editor:
// thumbnail, title, short description and one access per resource type (the 3D icons), a menu
// when a topic has several resources of the same type, editing the description and thumbnail,
// Add resource (existing content), reorder and remove, persistence after reload, permissions,
// and the layout at 1440, 1024, 768 and 390 px.
// Run: BASE_URL=http://localhost:3100 node e2e/topic-rows.e2e.mjs
import { chromium } from "playwright";
import path from "node:path";
import prismaPkg from "@prisma/client";

const { PrismaClient } = prismaPkg;
const db = new PrismaClient();
const BASE = process.env.BASE_URL ?? "http://localhost:3100";
const SHOTS = process.env.SCREENSHOTS;
const shot = async (p, name, full = false) => SHOTS && p.screenshot({ path: path.join(SHOTS, `${name}.png`), fullPage: full });
const log = (...a) => console.log("•", ...a);
const assert = (c, m) => {
  if (!c) throw new Error(m);
};
const stamp = Date.now();

const browser = await chromium.launch();
const errors = [];
async function teacherPage(name, admin) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: "en-US" });
  const p = await ctx.newPage();
  p.on("pageerror", (e) => errors.push(e.message));
  const email = `${name.toLowerCase()}${stamp}@school.test`;
  await p.goto(`${BASE}/signup`);
  await p.fill("#displayName", name);
  await p.fill("#schoolName", "Colegio Filas");
  await p.fill("#email", email);
  await p.fill("#password", "correct-horse-42");
  await p.click("button[type=submit]");
  await p.waitForURL(`${BASE}/teacher`);
  if (admin) await db.user.update({ where: { email }, data: { role: "ADMIN" } });
  return p;
}
const published = (kind) => db.libraryResource.findMany({ where: { kind, status: "PUBLISHED", currentVersionId: { not: null } }, orderBy: { title: "asc" }, select: { id: true, title: true } });

try {
  // Two topics made for this test: one with many resources (two Games), one with a single one.
  const [games, videos, songs, cards, sheets] = await Promise.all(["GAME", "VIDEO", "SONG", "FLASHCARDS", "WORKSHEET"].map(published));
  assert(games.length >= 2 && cards.length && sheets.length, "seeded library content");
  const long = "Una descripción larga para comprobar que el texto pasa a varias líneas dentro de la fila sin salirse ni cortar nada, también en un teléfono pequeño.";
  const many = await db.topic.create({ data: { slug: `filas-${stamp}`, titleEn: `Rows ${stamp}`, titleEs: `Las filas ${stamp}`, category: "Vocabulary", description: long, color: "#7FC8F8", art: "topic:colors", sortOrder: -2, status: "PUBLISHED" } });
  const manyIds = [games[0].id, games[1].id, cards[0].id, sheets[0].id, ...(songs[0] ? [songs[0].id] : [])];
  await db.topicResource.createMany({ data: manyIds.map((resourceId, position) => ({ topicId: many.id, resourceId, position })) });
  const few = await db.topic.create({ data: { slug: `una-${stamp}`, titleEn: `One ${stamp}`, titleEs: `Uno ${stamp}`, category: "Vocabulary", description: "Un solo recurso.", color: "#FFC928", art: "topic:numbers", sortOrder: -1, status: "PUBLISHED" } });
  await db.topicResource.create({ data: { topicId: few.id, resourceId: cards[0].id, position: 0 } });

  // ── Teacher (not admin): rows, accesses, menu for repeated types, no edit tools ──
  const t = await teacherPage("Rosa", false);
  await t.goto(`${BASE}/teacher/library`);
  const row = (title) => t.getByTestId("topic-row").filter({ hasText: title });
  await row(`Las filas ${stamp}`).waitFor();
  const r1 = row(`Las filas ${stamp}`);
  assert((await r1.getByTestId("topic-description").textContent()) === long, "description under the title");
  const kinds = await r1.getByTestId("topic-access").evaluateAll((a) => a.map((x) => x.dataset.kind));
  assert(kinds[0] === "GAME" && kinds.includes("FLASHCARDS") && kinds.includes("WORKSHEET"), `one access per type, fixed order (${kinds})`);
  assert(kinds.filter((k) => k === "GAME").length === 1, "two Games share one access");
  const imgs = await r1.locator("img.topic-access-img").evaluateAll((im) => im.map((i) => [i.getAttribute("src"), i.getBoundingClientRect().width]));
  assert(imgs.some(([s]) => s === "/topic-icons/games.webp") && imgs.some(([s]) => s === "/topic-icons/flashcards.webp"), `3D icon files reused ${JSON.stringify(imgs)}`);
  assert(imgs.every(([, w]) => w >= 28 && w <= 32), "icons 28–32 px");
  const targets = await r1.getByTestId("topic-access").evaluateAll((a) => a.map((x) => { const r = x.getBoundingClientRect(); return [r.width, r.height]; }));
  assert(targets.every(([w, h]) => w >= 44 && h >= 44), `44 px touch targets ${JSON.stringify(targets)}`);
  const thumb = await r1.locator(".topic-thumb").boundingBox();
  assert(Math.round(thumb.width) === 96 && Math.round(thumb.height) === 96, `96×96 thumbnail (${thumb.width})`);
  assert((await t.getByTestId("edit-topic").count()) === 0, "teachers who aren't administrators get no Edit");
  log("teacher: rows with thumbnail, title, description and one 3D-icon access per type; no edit tools");

  // Several Games → a menu with their titles; each opens the right content.
  const gameBtn = r1.locator("[data-testid=topic-access][data-kind=GAME]");
  await gameBtn.click();
  const menu = r1.getByTestId("topic-access-menu");
  await menu.waitFor();
  const opts = await menu.locator("a").evaluateAll((a) => a.map((x) => [x.textContent.trim(), x.getAttribute("href")]));
  assert(opts.length === 2 && opts.every(([, h]) => /\/teacher\/library\/resources\//.test(h)), `menu lists both games ${JSON.stringify(opts)}`);
  await shot(t, "rows-1440-menu");
  await t.keyboard.press("Escape");
  await menu.waitFor({ state: "detached" });
  await gameBtn.click();
  await menu.locator("a").nth(1).click();
  await t.waitForURL(/\/teacher\/library\/resources\//);
  const opened = t.url().split("/").at(-1);
  assert(opts[1][1].endsWith(opened), "the chosen game opens");
  await t.goto(`${BASE}/teacher/library`);
  const cardHref = await row(`Uno ${stamp}`).locator("[data-testid=topic-access][data-kind=FLASHCARDS]").getAttribute("href");
  assert(cardHref === `/teacher/library/resources/${cards[0].id}`, `single resource opens directly (${cardHref})`);
  await row(`Uno ${stamp}`).locator("[data-testid=topic-access]").click();
  await t.waitForURL(new RegExp(cards[0].id));
  log("repeated type: a menu with the titles (Escape closes it), each access opens its content; a single resource opens directly");

  // ── Layout at 1440, 1024, 768 and 390 px: nothing outside its row, no sideways scroll ──
  await t.goto(`${BASE}/teacher/library`);
  for (const w of [1440, 1024, 768, 390]) {
    await t.setViewportSize({ width: w, height: w === 390 ? 844 : 900 });
    await t.waitForTimeout(300);
    const bad = await t.evaluate(() => {
      const out = [];
      for (const r of document.querySelectorAll("[data-testid=topic-row]")) {
        const b = r.getBoundingClientRect();
        for (const el of r.querySelectorAll("a, button, p, h2, img")) {
          const e = el.getBoundingClientRect();
          if (e.width && (e.left < b.left - 0.5 || e.right > b.right + 0.5)) out.push(`${el.tagName}:${el.textContent.slice(0, 20)}`);
        }
      }
      return { out, scroll: document.documentElement.scrollWidth > window.innerWidth };
    });
    assert(!bad.scroll && bad.out.length === 0, `${w}px: ${JSON.stringify(bad)}`);
    await r1.scrollIntoViewIfNeeded();
    await shot(t, `rows-${w}`);
  }
  const mThumb = await r1.locator(".topic-thumb").boundingBox();
  assert(mThumb.width < 96, "smaller thumbnail on a phone");
  log("layout: every row's content stays inside it at 1440, 1024, 768 and 390 px, no sideways scroll");
  await t.setViewportSize({ width: 1440, height: 900 });

  // ── Administrator: Edit → description, thumbnail, Add resource, reorder, remove; persists ──
  const a = await teacherPage("Admin", true);
  await a.goto(`${BASE}/teacher/library`);
  const edit = a.getByTestId("topic-row").filter({ hasText: `Uno ${stamp}` }).getByTestId("edit-topic");
  await edit.click();
  await a.waitForURL(new RegExp(`/admin/topics/${few.id}`));
  await a.getByTestId("topic-description-input").fill("Cuenta del 1 al 20 con juegos y canciones.");
  await a.getByRole("radio", { name: "panda" }).click();
  await a.getByRole("button", { name: "Save topic" }).click();
  await a.getByText("Topic saved.").waitFor();
  // Add resource → existing content (a Game and a Video)
  await a.getByTestId("add-from-library").click();
  const dlg = a.getByRole("dialog", { name: "Choose existing content" });
  await dlg.waitFor();
  await dlg.locator(`#pick-${games[1].id}`).check();
  if (videos[0]) await dlg.locator(`#pick-${videos[0].id}`).check();
  await dlg.getByRole("button", { name: /^Add selected/ }).click();
  await dlg.waitFor({ state: "hidden" });
  await a.waitForFunction((n) => document.querySelectorAll("[data-testid=topic-activity]").length === n, videos[0] ? 3 : 2, { timeout: 15000 });
  assert(await a.getByTestId("add-new-resource").isVisible(), "Upload a file or add a link is offered");
  // Reorder: move the Game up to first
  await a.getByRole("button", { name: `Move ${games[1].title} up` }).first().click();
  await a.waitForFunction((t) => document.querySelector("[data-testid=topic-activity]")?.textContent.includes(t), games[1].title, { timeout: 15000 });
  await shot(a, "editor-1440", true);
  await a.reload();
  assert((await a.getByTestId("topic-description-input").inputValue()) === "Cuenta del 1 al 20 con juegos y canciones.", "description saved");
  assert((await a.getByRole("radio", { name: "panda" }).getAttribute("aria-checked")) === "true", "thumbnail saved");
  const saved = await db.topicResource.findMany({ where: { topicId: few.id }, orderBy: { position: "asc" }, select: { resourceId: true } });
  assert(saved[0].resourceId === games[1].id && saved.length === (videos[0] ? 3 : 2), "order and links saved");
  log("admin: Edit opens the topic editor; description and thumbnail saved; Add resource (existing content) and reorder persist after reload");

  // Remove the flashcards from the topic (it stays in the Library)
  const cardsRow = a.getByTestId("topic-activity").filter({ hasText: cards[0].title });
  await cardsRow.locator("summary").click();
  await cardsRow.getByRole("button", { name: "Remove from Topic" }).click();
  await a.waitForFunction((n) => document.querySelectorAll("[data-testid=topic-activity]").length === n, videos[0] ? 2 : 1, { timeout: 15000 });
  assert(await db.libraryResource.findUnique({ where: { id: cards[0].id } }), "the resource stays in the Library");

  // The teacher's row follows the saved resources and order
  await t.goto(`${BASE}/teacher/library`);
  const r2 = t.getByTestId("topic-row").filter({ hasText: `Uno ${stamp}` });
  await r2.waitFor();
  assert((await r2.getByTestId("topic-description").textContent()) === "Cuenta del 1 al 20 con juegos y canciones.", "row shows the new description");
  const k2 = await r2.getByTestId("topic-access").evaluateAll((x) => x.map((e) => e.dataset.kind));
  assert(!k2.includes("FLASHCARDS") && k2.includes("GAME"), `row accesses follow the topic (${k2})`);
  log("removing a resource unlinks it (it stays in the Library); the teacher's row shows the new description and accesses");

  // Student View still reachable from the row
  await r2.getByTestId("student-view").click();
  await t.waitForURL(/student-view/);

  assert(errors.length === 0, `page errors: ${errors.join(" | ")}`);
  console.log("• ALL TOPIC ROW CHECKS PASSED");
} catch (e) {
  console.error("FAIL", e.message);
  process.exitCode = 1;
} finally {
  await browser.close();
  await db.$disconnect();
}
