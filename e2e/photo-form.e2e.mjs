// End-to-end test for the flashcard "Search online" photo form: a card with two picture slots
// (front and back). Search Wikimedia Commons for the first (a local fake Commons API stands in,
// see COMMONS_API_URL), upload the second, save; change only the second, reload; remove the
// second. The first photo, the text and the audio must never change. Cancel keeps everything.
//
// Start the server with COMMONS_API_URL=http://127.0.0.1:3199/w/api.php and, for Google Images
// (fake Custom Search API), GOOGLE_CSE_API_KEY=test GOOGLE_CSE_CX=test
// GOOGLE_IMAGES_TEST_ENDPOINT=http://127.0.0.1:3199/cse, then:
// Run: BASE_URL=http://localhost:3100 node e2e/photo-form.e2e.mjs
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
const fx = (f) => path.resolve("e2e/fixtures", f);

// ── Fake Wikimedia Commons: records searches; one cartoon and one tiny file per answer ──
const PNG = readFileSync(fx("red-circle.png"));
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
  if (u.pathname === "/cse") {
    // Fake Google Custom Search (searchType=image): one clip-art and one tiny result per answer.
    const term = u.searchParams.get("q");
    searches.push(term);
    assert(u.searchParams.get("searchType") === "image" && u.searchParams.get("safe") === "active", "Google image search, safe on");
    const it = (title, w) => ({ link: `${FAKE}/img/${encodeURIComponent(title)}.jpg`, title, displayLink: "example.org", image: { thumbnailLink: `${FAKE}/img/${encodeURIComponent(title)}-thumb.jpg`, width: w, height: Math.round(w * 0.75), contextLink: `https://example.org/${encodeURIComponent(title)}` } });
    const items = term.includes("zzzz") ? [] : [it(`${term} clipart`, 2000), it(`${term} tiny`, 200), ...Array.from({ length: 8 }, (_, i) => it(`${term} photo ${i + 1}`, 2400))];
    return res.writeHead(200, { "Content-Type": "application/json" }).end(JSON.stringify({ items }));
  }
  const q = u.searchParams.get("gsrsearch");
  const titles = u.searchParams.get("titles");
  let pages = [];
  if (q) {
    const term = q.replace(" filetype:bitmap", "");
    searches.push(term);
    if (!term.includes("zzzz")) {
      pages = [page(`${term} cartoon.png`, 2000, "image/png"), page(`${term} tiny.jpg`, 200)];
      for (let i = 1; i <= 8; i++) pages.push(page(`${term} photo ${i}.jpg`, 2400));
      pages.forEach((p, i) => (p.index = i + 1));
    }
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
const form = () => p.getByTestId("card-photo-form");
const box = (n) => form().getByTestId("photo-box").nth(n);
const row = () => p.locator("ol > li").first();
const item = async (gameId) => db.gameItem.findFirstOrThrow({ where: { gameId }, orderBy: { position: "asc" } });
const backOf = (it) => it.data?.back ?? {};
/** Polls the saved card until `ok` holds (autosave runs a moment after a change). */
async function savedCard(gameId, ok, what) {
  let it;
  for (let k = 0; k < 40; k++) {
    it = await item(gameId);
    if (ok(it)) return it;
    await p.waitForTimeout(400);
  }
  throw new Error(`${what}: ${JSON.stringify({ front: it.imageAssetId, back: backOf(it).imageAssetId })}`);
}

try {
  const email = `form${stamp}@school.test`;
  await p.goto(`${BASE}/signup`);
  await p.fill("#displayName", "Ana Rivera");
  await p.fill("#schoolName", "Colegio Fotos");
  await p.fill("#email", email);
  await p.fill("#password", "correct-horse-42");
  await p.click("button[type=submit]");
  await p.waitForURL(`${BASE}/teacher`);
  const user = await db.user.findUniqueOrThrow({ where: { email } });
  const animals = await db.category.findFirstOrThrow({ where: { schoolId: user.schoolId, nameEn: "Animals" } });

  await p.goto(`${BASE}/teacher/games/new`);
  await p.click("button[value=FLASHCARDS]");
  await p.waitForURL(/\/edit$/);
  const gameId = p.url().split("/").at(-2);
  await p.getByRole("button", { name: "EN", exact: true }).click();
  await row().getByRole("textbox", { name: "Front: Text" }).fill("pavo");
  await row().getByRole("textbox", { name: "Back: Text" }).fill("turkey");
  await waitSaved();
  // Category and an audio clip on the card (both must survive every photo change).
  const it0 = await item(gameId);
  const audio = { text: "pavo", language: "es-419", source: "browser" };
  await db.game.update({ where: { id: gameId }, data: { categoryId: animals.id, title: "Animales" } });
  await db.gameItem.update({ where: { id: it0.id }, data: { data: { ...it0.data, audio } } });
  await p.reload();
  await p.getByRole("button", { name: "EN", exact: true }).click();

  // ── 1. Front slot: Search online, query prefilled from the card, six photos ──
  await row().getByRole("button", { name: "Search the internet (Front)" }).click();
  await form().waitFor();
  assert(await form().getByText("Añadir vocabulario / Add words").isVisible(), "form title");
  assert(await form().getByText("Los animales / Animals").isVisible(), "category line");
  assert((await form().getByRole("textbox", { name: "Español" }).inputValue()) === "pavo", "Spanish field");
  assert((await form().getByRole("textbox", { name: "English" }).inputValue()) === "turkey", "English field");
  assert((await form().getByTestId("photo-box").count()) === 2, "one photo box per picture slot");
  const query = box(0).getByTestId("photo-query");
  assert((await query.inputValue()) === "turkey animal", `query from the card + category (${await query.inputValue()})`);
  await box(0).getByTestId("photo-suggestions").waitFor({ timeout: 15000 });
  const thumbs = box(0).getByTestId("photo-suggestion");
  assert((await thumbs.count()) === 6, `six photos (${await thumbs.count()})`);
  const labels = await thumbs.evaluateAll((bs) => bs.map((b) => b.getAttribute("aria-label")));
  assert(labels.every((l) => !/cartoon|clipart|tiny/.test(l)), "cartoons, clip art and tiny files left out");
  assert(searches.at(-1) === "turkey animal", `searched on opening, with the category (${searches.at(-1)})`);
  assert((await box(0).getByTestId("google-images").count()) === 0, "no Open in Google Images link");
  assert((await box(0).getByTestId("google-missing").count()) === 0, "Google Images configured: no missing-setup note");

  // Typing «turkey»: the photos appear by themselves (no Enter, no button).
  await query.fill("");
  await query.pressSequentially("turkey", { delay: 40 });
  await p.waitForFunction(() => document.querySelectorAll("[data-testid=photo-suggestion]").length === 6 && [...document.querySelectorAll("[data-testid=photo-suggestion]")].every((b) => b.getAttribute("aria-label").startsWith("turkey photo")), null, { timeout: 15000 });
  assert(searches.at(-1) === "turkey", `typed query searched (${searches.at(-1)})`);

  // Editing the query: waits for typing to stop, the last term wins; no results → message + upload.
  const n0 = searches.length;
  await query.fill("");
  await query.pressSequentially("zzzz", { delay: 30 });
  await box(0).getByTestId("photo-none").waitFor({ timeout: 15000 });
  assert(await box(0).getByTestId("photo-upload").isVisible(), "upload stays visible with no results");
  assert(searches.slice(n0).length <= 2 && searches.at(-1) === "zzzz", `debounced search ${JSON.stringify(searches.slice(n0))}`);
  await query.fill("wild turkey");
  await box(0).getByTestId("photo-suggestions").waitFor({ timeout: 15000 });
  await thumbs.nth(1).click();
  assert((await thumbs.nth(1).getAttribute("aria-pressed")) === "true", "chosen photo marked");
  await box(0).getByTestId("photo-preview").waitFor();
  await shot(p, "pf1-search");

  // ── 2. Back slot: upload; Save ──
  await box(1).getByTestId("photo-upload").setInputFiles(fx("red-circle.png"));
  await box(1).getByTestId("photo-preview").waitFor({ timeout: 15000 });
  await form().getByTestId("photo-form-save").click();
  await form().waitFor({ state: "detached", timeout: 15000 });
  const it1 = await savedCard(gameId, (x) => x.imageAssetId && backOf(x).imageAssetId, "both photos saved");
  const front = await db.mediaAsset.findUniqueOrThrow({ where: { id: it1.imageAssetId } });
  assert(/wild turkey photo 2 — Google Images https:\/\/example\.org\/wild%20turkey%20photo%202/.test(front.originalName), `source kept: ${front.originalName}`);
  assert(it1.imageAssetId !== backOf(it1).imageAssetId, "each slot has its own photo");
  log("Google Images in the panel: photos appear while typing «turkey»; first slot searched, second uploaded, Save: two different photos, source kept");

  // ── 3. Cancel keeps everything ──
  await row().getByRole("button", { name: /^Edit: Back/ }).first().click();
  await p.getByRole("dialog", { name: "Edit" }).getByRole("button", { name: "Replace", exact: true }).click();
  await form().waitFor();
  await box(1).getByRole("button", { name: "Quitar imagen / Remove image" }).click();
  await form().getByTestId("photo-form-cancel").click();
  await form().waitFor({ state: "detached" });
  await p.waitForTimeout(1500);
  const itC = await item(gameId);
  assert(itC.imageAssetId === it1.imageAssetId && backOf(itC).imageAssetId === backOf(it1).imageAssetId, "Cancel keeps both photos");
  log("Cancel keeps the previous photos");

  // ── 4. Change only the second; reload ──
  await row().getByRole("button", { name: /^Edit: Back/ }).first().click();
  await p.getByRole("dialog", { name: "Edit" }).getByRole("button", { name: "Replace", exact: true }).click();
  await form().waitFor();
  assert(await box(0).getByTestId("photo-preview").isVisible() && await box(1).getByTestId("photo-preview").isVisible(), "existing photos shown in their boxes");
  await box(1).getByRole("button", { name: "Cambiar imagen / Change image" }).click();
  await box(1).getByTestId("photo-upload").setInputFiles(fx("cat.png"));
  await p.waitForTimeout(300);
  await shot(p, "pf2-change-second");
  await form().getByTestId("photo-form-save").click();
  await form().waitFor({ state: "detached", timeout: 15000 });
  const it2 = await savedCard(gameId, (x) => backOf(x).imageAssetId && backOf(x).imageAssetId !== backOf(it1).imageAssetId, "second photo changed");
  await p.reload();
  await row().getByRole("button", { name: /^Edit: Back/ }).first().waitFor();
  const it2b = await item(gameId);
  assert(it2b.imageAssetId === it1.imageAssetId, "the first photo stays the same after changing the second");
  assert(backOf(it2b).imageAssetId === backOf(it2).imageAssetId, "the second photo stays changed after reload");
  log("changing only the second photo leaves the first one as it was (after reload)");

  // ── 5. Remove the second: text, audio and first photo stay ──
  await row().getByRole("button", { name: /^Edit: Back/ }).first().click();
  await p.getByRole("dialog", { name: "Edit" }).getByRole("button", { name: "Replace", exact: true }).click();
  await form().waitFor();
  await box(1).getByRole("button", { name: "Quitar imagen / Remove image" }).click();
  await form().getByTestId("photo-form-save").click();
  await form().waitFor({ state: "detached", timeout: 15000 });
  const it3 = await savedCard(gameId, (x) => !backOf(x).imageAssetId, "second photo removed");
  await p.reload();
  await row().getByRole("button", { name: /^Edit: Front/ }).first().waitFor();
  const it3b = await item(gameId);
  assert(!backOf(it3b).imageAssetId && it3.id === it3b.id, "second photo gone");
  assert(it3b.imageAssetId === it1.imageAssetId, "first photo kept");
  assert(it3b.text === "pavo" && backOf(it3b).text === "turkey", `texts kept (${it3b.text} / ${backOf(it3b).text})`);
  assert(it3b.data?.audio?.text === "pavo", "audio kept");
  log("removing the second photo keeps the text, the audio and the first photo");

  // ── 6. Phone: the form and the search fit; two columns of photos ──
  await p.setViewportSize({ width: 390, height: 844 });
  await row().getByRole("button", { name: "Search the internet (Back)" }).click();
  await box(1).getByTestId("photo-suggestions").waitFor({ timeout: 15000 });
  const cols = await box(1).getByTestId("photo-suggestion").evaluateAll((bs) => new Set(bs.map((b) => Math.round(b.getBoundingClientRect().left))).size);
  assert(cols === 2, `two columns on a phone (${cols})`);
  await box(1).getByTestId("photo-suggestion").first().click();
  await shot(p, "pf3-phone");
  await form().getByTestId("photo-form-cancel").click();
  await p.setViewportSize({ width: 1366, height: 900 });
  log("phone: search in two columns, chosen photo marked");

  // ── 7. The player shows the saved photo, no editor controls ──
  await p.goto(`${BASE}/play/preview/${gameId}`);
  await p.waitForSelector("text=Teacher preview — answers are not saved");
  const start = p.getByRole("button", { name: /Start|Empezar/ }).first();
  if (await start.count()) await start.click();
  await p.waitForFunction((id) => [...document.images].some((i) => i.src.includes(`/api/media/${id}`) && i.complete && i.naturalWidth > 0), it1.imageAssetId, { timeout: 15000 });
  assert((await p.getByTestId("card-photo-form").count()) === 0 && (await p.getByTestId("google-images").count()) === 0, "no search controls in the player");
  log("player shows the saved photo without the editor's controls");

  assert(errors.length === 0, `page errors: ${errors.join(" | ")}`);
  console.log("• ALL PHOTO FORM CHECKS PASSED");
} catch (e) {
  console.error("FAIL", e.message);
  process.exitCode = 1;
} finally {
  await browser.close();
  fake.close();
  await db.$disconnect();
}
