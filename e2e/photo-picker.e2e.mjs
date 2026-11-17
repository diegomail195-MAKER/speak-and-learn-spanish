// End-to-end test for the flashcard photo picker: automatic Wikimedia Commons suggestions (a local
// fake Commons API stands in, see COMMONS_API_URL), the Google Images link, choosing a photo,
// uploading one, and the card keeping its photo after a reload and in the player.
//
// Start the server with COMMONS_API_URL=http://127.0.0.1:3199/w/api.php, then:
// Run: BASE_URL=http://localhost:3100 node e2e/photo-picker.e2e.mjs
import { chromium } from "playwright";
import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import path from "node:path";
import prismaPkg from "@prisma/client";

const { PrismaClient } = prismaPkg;
const db = new PrismaClient();
const BASE = process.env.BASE_URL ?? "http://localhost:3100";
const SHOTS = process.env.SCREENSHOTS;
const shot = async (p, name) => SHOTS && p.screenshot({ path: path.join(SHOTS, `${name}.png`) });
const stamp = Date.now();
const log = (...a) => console.log("•", ...a);
const assert = (c, m) => {
  if (!c) throw new Error(m);
};

// ── Fake Wikimedia Commons: records each search; one cartoon and one tiny file per answer ──
const PNG = readFileSync(path.resolve("e2e/fixtures/red-circle.png"));
const searches = [];
const FAKE = "http://127.0.0.1:3199";
const page = (title, w, mime = "image/jpeg") => ({
  title: `File:${title}`,
  imageinfo: [{
    url: `${FAKE}/img/${encodeURIComponent(title)}`,
    thumburl: `${FAKE}/img/${encodeURIComponent(title)}`,
    width: w,
    height: Math.round(w * 0.75),
    mime,
    descriptionurl: `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(title)}`,
    extmetadata: { Artist: { value: "<a href='x'>Ana Foto</a>" }, LicenseShortName: { value: "CC BY-SA 4.0" } },
  }],
});
const fake = createServer((req, res) => {
  const u = new URL(req.url, FAKE);
  // Different bytes per file (the media library keeps one copy of identical files).
  if (u.pathname.startsWith("/img/")) return res.writeHead(200, { "Content-Type": "image/png" }).end(Buffer.concat([PNG, Buffer.from(u.pathname)]));
  const q = u.searchParams.get("gsrsearch");
  const titles = u.searchParams.get("titles");
  let pages = [];
  if (q) {
    const term = q.replace(" filetype:bitmap", "");
    searches.push(term);
    pages = [page(`${term} cartoon.png`, 2000, "image/png"), page(`${term} tiny.jpg`, 200)];
    for (let i = 1; i <= 8; i++) pages.push(page(`${term} photo ${i}.jpg`, 2400));
    pages.forEach((p, i) => (p.index = i + 1));
  } else if (titles) {
    pages = [page(titles.replace(/^File:/, ""), 2400)];
  }
  res.writeHead(200, { "Content-Type": "application/json" }).end(JSON.stringify({ query: { pages } }));
});
await new Promise((r) => fake.listen(3199, "127.0.0.1", r));

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 }, locale: "en-US" });
const p = await ctx.newPage();
const errors = [];
p.on("pageerror", (e) => errors.push(e.message));
const waitSaved = () => p.waitForFunction(() => /Saved|Guardado/.test(document.querySelector("[data-testid=save-status]")?.textContent ?? ""), null, { timeout: 15000 });

try {
  const email = `photo${stamp}@school.test`;
  await p.goto(`${BASE}/signup`);
  await p.fill("#displayName", "Ana Rivera");
  await p.fill("#schoolName", "Colegio Fotos");
  await p.fill("#email", email);
  await p.fill("#password", "correct-horse-42");
  await p.click("button[type=submit]");
  await p.waitForURL(`${BASE}/teacher`);
  const user = await db.user.findUniqueOrThrow({ where: { email } });
  const cat = async (nameEn, nameEs) =>
    (await db.category.findFirst({ where: { schoolId: user.schoolId, nameEn } })) ?? db.category.create({ data: { schoolId: user.schoolId, nameEn, nameEs, sortOrder: 99 } });

  const cases = [
    { es: "pavo", en: "turkey", category: ["Animals", "Los animales"], query: "turkey animal" },
    { es: "gris", en: "gray", category: ["Colors", "Los colores"], query: "gray color" },
    { es: "andar en bicicleta", en: "ride a bike", category: ["Activities", "Las actividades"], query: "ride a bike" },
  ];
  let firstGame = null;
  for (const [n, c] of cases.entries()) {
    await p.goto(`${BASE}/teacher/games/new`);
    await p.click("button[value=FLASHCARDS]");
    await p.waitForURL(/\/edit$/);
    const gameId = p.url().split("/").at(-2);
    firstGame ??= gameId;
    const category = await cat(...c.category);
    await db.game.update({ where: { id: gameId }, data: { categoryId: category.id, title: `Fotos ${c.en}` } });
    await p.reload();
    await p.getByRole("button", { name: "EN", exact: true }).click();
    const row = p.locator("ol > li").first();
    const section = row.getByTestId("photo-section");
    await section.waitFor();
    assert(await section.getByText("Type the word to see photo suggestions.").isVisible(), "asks for a word first");

    // Typing: the search waits ~650 ms after the last key and replaces older searches.
    const before = searches.length;
    await row.getByRole("textbox", { name: "Front: Text" }).pressSequentially(c.es, { delay: 40 });
    await row.getByRole("textbox", { name: "Back: Text" }).pressSequentially(c.en, { delay: 40 });
    await section.getByTestId("photo-suggestions").waitFor({ timeout: 15000 });
    const mine = searches.slice(before);
    assert(mine.at(-1) === c.query, `searched «${c.query}» (got ${JSON.stringify(mine)})`);
    assert(mine.length <= 2, `no search per key press (${mine.length} searches)`);
    const thumbs = section.getByTestId("photo-suggestion");
    assert((await thumbs.count()) === 6, `six suggestions (${await thumbs.count()})`);
    const labels = await thumbs.evaluateAll((bs) => bs.map((b) => b.getAttribute("aria-label")));
    assert(labels.every((l) => !/cartoon|tiny/.test(l)), "drawings and tiny files left out");
    assert(labels[0].includes("Ana Foto") && labels[0].includes("CC BY-SA 4.0"), "author and license shown");

    // Google Images: safe search, photographs, the category context.
    const g = new URL(await section.getByTestId("google-images").getAttribute("href"));
    assert(g.hostname === "www.google.com" && g.searchParams.get("tbm") === "isch" && g.searchParams.get("safe") === "active", "Google Images link");
    assert(g.searchParams.get("q") === `${c.query} photograph -cartoon -illustration`, `Google query ${g.searchParams.get("q")}`);
    if (n === 0) await shot(p, "pp1-suggestions");

    // Keyboard: Tab to the second photo and press Enter.
    await thumbs.nth(1).focus();
    await p.keyboard.press("Enter");
    await section.getByTestId("photo-chosen").waitFor({ timeout: 15000 });
    assert(await section.getByTestId("photo-chosen").getByText(c.es, { exact: true }).isVisible(), "chosen photo shows the Spanish text");
    assert(await section.getByTestId("photo-chosen").getByText(c.en, { exact: true }).isVisible(), "chosen photo shows the English text");
    await waitSaved();
    const item = await db.gameItem.findFirst({ where: { gameId }, include: { image: true } });
    assert(item?.image, "photo linked to the card");
    assert(/Ana Foto \/ Wikimedia Commons \(CC BY-SA 4\.0\) https:\/\/commons\.wikimedia\.org\/wiki\/File:/.test(item.image.originalName), `credits kept: ${item.image.originalName}`);
    const firstAsset = item.imageAssetId;

    // Change it before saving: pick another photo.
    await thumbs.nth(3).click();
    let changed = null;
    for (let k = 0; k < 30 && !(changed?.imageAssetId && changed.imageAssetId !== firstAsset); k++) {
      await p.waitForTimeout(500);
      changed = await db.gameItem.findFirst({ where: { gameId } });
    }
    assert(changed.imageAssetId && changed.imageAssetId !== firstAsset, "the photo can be changed");

    // Reload: the card keeps its photo, in its category.
    await p.reload();
    await p.locator("ol > li").first().getByRole("button", { name: /^Edit:/ }).first().waitFor();
    const g2 = await db.game.findUniqueOrThrow({ where: { id: gameId }, include: { category: true } });
    assert(g2.category?.nameEn === c.category[0], "the activity stays in its category");
    if (n === 0) await shot(p, "pp2-after-reload");
    log(`«${c.es} / ${c.en}» in ${c.category[0]}: searched «${c.query}», 6 photos, chosen by keyboard, changed, kept after reload`);
  }

  // Upload a photo on a second card of the first activity.
  await p.goto(`${BASE}/teacher/games/${firstGame}/edit`);
  await p.getByRole("button", { name: "EN", exact: true }).click();
  await p.getByText("+ Add an item").click();
  const row2 = p.locator("ol > li").nth(1);
  await row2.getByRole("textbox", { name: "Front: Text" }).fill("gallina");
  await row2.getByTestId("photo-section").waitFor();
  await row2.getByTestId("photo-section").locator("input[type=file]").setInputFiles(path.resolve("e2e/fixtures/red-circle.png"));
  await row2.getByTestId("photo-chosen").waitFor({ timeout: 15000 });
  await waitSaved();
  await p.reload();
  await p.locator("ol > li").nth(1).getByRole("button", { name: /^Edit:/ }).first().waitFor();
  log("Upload a photo: saved on the card and still there after reload");

  // The player (what students see): the photo, no editor controls.
  await p.goto(`${BASE}/play/preview/${firstGame}`);
  await p.waitForSelector("text=Teacher preview — answers are not saved");
  const start = p.getByRole("button", { name: /Start|Empezar/ }).first();
  if (await start.count()) await start.click();
  await p.waitForFunction(() => [...document.images].some((i) => i.src.includes("/api/media/") && i.complete && i.naturalWidth > 0), null, { timeout: 15000 });
  assert((await p.getByTestId("photo-section").count()) === 0 && (await p.getByTestId("google-images").count()) === 0, "no editor controls in the player");
  await shot(p, "pp3-player");
  log("player shows the photo without the editor's picture controls");

  assert(errors.length === 0, `page errors: ${errors.join(" | ")}`);
  console.log("• ALL PHOTO PICKER CHECKS PASSED");
} catch (e) {
  console.error("FAIL", e.message);
  process.exitCode = 1;
} finally {
  await browser.close();
  fake.close();
  await db.$disconnect();
}
