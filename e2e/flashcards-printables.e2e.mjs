// End-to-end test of the redesigned Flashcards in real Chromium:
// a deck of 11 colour circles ("¿Cuál es tu color favorito?") built in the compact editor
// (Activity settings link, Add from Library in the bar, Double/Single sided, Swap Columns, Done), then the
// game (start screen, one large card, turn with click and Space, I knew it / Practice again,
// round results, practise the missed cards), the activity strip (Edit Content + Printables) and
// the four printables (preview, options, A4/Letter, card selection, quiz fill-in, PDF download).
// Also: an edit shows up in the game and the PDF, a one-sided deck, a 100-card deck and a phone.
// Run: BASE_URL=http://localhost:3100 node e2e/flashcards-printables.e2e.mjs
// (writes only through the app and to the user it creates; use a local or Preview database)
import { chromium } from "playwright";
import { mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import prismaPkg from "@prisma/client";

const { PrismaClient } = prismaPkg;
const db = new PrismaClient();
const BASE = process.env.BASE_URL ?? "http://localhost:3100";
const SHOTS = process.env.SCREENSHOTS;
const DL = process.env.DOWNLOADS ?? "/tmp/fc-e2e-downloads";
mkdirSync(DL, { recursive: true });
if (SHOTS) mkdirSync(SHOTS, { recursive: true });
const stamp = Date.now();
const log = (...a) => console.log("•", ...a);
const shot = async (p, name) => SHOTS && p.screenshot({ path: path.join(SHOTS, `${name}.png`) });
const assert = (c, m) => {
  if (!c) throw new Error(m);
};

const COLORS = [
  ["rojo", "#e53935"], ["azul", "#1e6fd9"], ["amarillo", "#fdd835"], ["verde", "#43a047"], ["naranja", "#fb8c00"], ["morado", "#8e24aa"],
  ["rosado", "#f06292"], ["café", "#6d4c41"], ["negro", "#111111"], ["gris", "#9e9e9e"], ["blanco", "#ffffff"],
];

const voiceStub = () => {
  window.__spoken = [];
  const voices = [
    { name: "Fake es", lang: "es-MX", default: false, localService: true, voiceURI: "es" },
    { name: "Fake en", lang: "en-US", default: true, localService: true, voiceURI: "en" },
  ];
  window.SpeechSynthesisUtterance = class {
    constructor(text) {
      this.text = text;
      this.lang = "";
    }
  };
  Object.defineProperty(window, "speechSynthesis", {
    value: { getVoices: () => voices, speak: (u) => (window.__spoken.push({ text: u.text, lang: u.lang }), setTimeout(() => u.onend && u.onend(), 10)), cancel: () => {}, addEventListener: () => {} },
  });
};

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 }, locale: "en-US", acceptDownloads: true });
await ctx.addInitScript(voiceStub);
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
const waitSaved = (p = page) => p.waitForFunction(() => /Saved|Guardado/.test(document.querySelector("[data-testid=save-status]")?.textContent ?? ""), null, { timeout: 15000 });

/** Draws a colour circle in the page and uploads it as a picture; returns the asset id. */
const uploadCircle = (p, color, name) =>
  p.evaluate(
    async ([color, name]) => {
      const c = document.createElement("canvas");
      c.width = c.height = 200;
      const g = c.getContext("2d");
      g.fillStyle = color;
      g.beginPath();
      g.arc(100, 100, 90, 0, Math.PI * 2);
      g.fill();
      g.strokeStyle = "#bbbbbb";
      g.lineWidth = 2;
      g.stroke();
      const blob = await new Promise((r) => c.toBlob(r, "image/png"));
      const fd = new FormData();
      fd.append("file", new File([blob], `${name}.png`, { type: "image/png" }));
      const res = await fetch("/api/media", { method: "POST", body: fd });
      return (await res.json()).id;
    },
    [color, name],
  );

async function download(p, trigger) {
  const [dl] = await Promise.all([p.waitForEvent("download", { timeout: 60000 }), trigger()]);
  const file = path.join(DL, `${stamp}-${dl.suggestedFilename()}`);
  await dl.saveAs(file);
  return file;
}
const pdfPages = (file) => (readFileSync(file, "latin1").match(/\/Type\s*\/Page[^s]/g) ?? []).length;

try {
  // ── Teacher (administrator, so Add from Library shows in the editor bar) ──
  const email = `fc${stamp}@school.test`;
  await page.goto(`${BASE}/signup`);
  await page.fill("#displayName", "Ana Rivera");
  await page.fill("#schoolName", "Colegio Colores");
  await page.fill("#email", email);
  await page.fill("#password", "correct-horse-42");
  await page.click("button[type=submit]");
  await page.waitForURL(`${BASE}/teacher`);
  await db.user.update({ where: { email }, data: { role: "ADMIN", emailVerifiedAt: new Date() } });

  // ── 1. New activity: compact editor, first row ready ──
  await page.goto(`${BASE}/teacher/games/new`);
  await page.click("button[value=FLASHCARDS]");
  await page.waitForURL(/\/edit$/);
  const editUrl = page.url();
  const gameId = editUrl.split("/").at(-2);
  await page.getByRole("button", { name: "EN", exact: true }).click(); // editor labels in English
  await page.getByLabel("Activity Title").waitFor();
  assert((await page.locator("ol > li").count()) === 1, "a new activity starts with one editable row");
  assert(await page.locator("ol > li").first().getByRole("textbox", { name: "Front: Text" }).isVisible(), "first row editable");
  assert(!(await page.getByText("Voice & answers").isVisible()), "settings are folded away");
  // The settings live in Activity settings (under the activity's actions); the editor links there.
  await page.getByTestId("open-activity-settings").waitFor();
  assert(await page.getByTestId("add-from-library").isVisible(), "Add from Library in the editor bar");
  await page.getByRole("heading", { name: "Library resources" }).waitFor();
  const tableWidth = await page.locator("ol").evaluate((el) => el.getBoundingClientRect().width);
  assert(tableWidth > 1000, `the card table takes the main width (${Math.round(tableWidth)}px)`);
  await page.getByText("+ Add an item").waitFor();
  await page.getByText("1 of 100").first().waitFor();
  log("compact editor: one row, Activity settings link, Add from Library in the bar, table", Math.round(tableWidth), "px wide");

  await page.getByLabel("Activity Title").fill("¿Cuál es tu color favorito?");
  await page.click("text=+ Add Instruction");
  await page.getByLabel("Instructions for students").fill("Mira el color y di su nombre.");
  await waitSaved();
  await shot(page, "p01-editor-new");

  // ── 2. Eleven colours: picture on both faces, Spanish word on the back ──
  const ids = [];
  for (const [name, color] of COLORS) ids.push(await uploadCircle(page, color, name));
  const g = await (await page.request.get(`${BASE}/api/games/${gameId}`)).json();
  const tpl = g.items[0];
  const items = COLORS.map(([name], i) => ({
    ...tpl,
    id: undefined,
    key: undefined,
    text: "",
    imageAssetId: ids[i],
    data: { imageAlt: `círculo ${name}`, back: { text: name, imageAssetId: ids[i], imageAlt: `círculo ${name}`, audio: { text: name, language: "es-419", source: "browser" } } },
    question: { ...tpl.question, id: undefined, expectedAnswer: "" },
  }));
  let r = await page.request.put(`${BASE}/api/games/${gameId}`, { data: { ...g, items } });
  assert(r.ok(), `11 cards saved (${r.status()})`);
  await page.reload();
  await page.getByRole("button", { name: "EN", exact: true }).click();
  await page.getByText("11 of 100").first().waitFor();
  assert((await page.locator("ol > li").first().locator("img").count()) === 2, "pictures on both faces");
  await shot(page, "p02-editor-11");

  // Edit one card in the editor: card 1's back text "rojo" → "rojo vivo"
  const row1 = page.locator("ol > li").first();
  await row1.getByRole("textbox", { name: "Back: Text" }).fill("rojo vivo");
  await waitSaved();
  // Swap Columns moves text, picture and audio together, and back again
  await page.getByRole("button", { name: /Swap Columns/ }).click();
  assert((await row1.getByRole("textbox", { name: "Front: Text" }).inputValue()) === "rojo vivo", "text moved to the front");
  assert(/rojo/.test(await row1.getByRole("button", { name: "Listen (Front)" }).textContent()), "audio moved to the front");
  await page.getByRole("button", { name: /Swap Columns/ }).click();
  assert((await row1.getByRole("textbox", { name: "Back: Text" }).inputValue()) === "rojo vivo", "swapped back");
  // Single sided keeps the backs
  await page.getByLabel("Single sided").check();
  assert(!(await row1.getByRole("textbox", { name: "Back: Text" }).isVisible()), "back hidden in single sided");
  await page.getByLabel("Double sided").check();
  assert((await row1.getByRole("textbox", { name: "Back: Text" }).inputValue()) === "rojo vivo", "back kept after single → double");
  await waitSaved();
  log("edited card 1, swap columns ×2, single ↔ double sided keeps the back");

  // Done stays visible with a long list, then opens the activity
  const doneBox = await page.getByTestId("editor-done").boundingBox();
  assert(doneBox && doneBox.y + doneBox.height <= 900, "Done visible without scrolling");
  await page.getByTestId("editor-done").click();
  await page.waitForURL(`${BASE}/play/preview/${gameId}`);

  // ── 3. Game: start screen, one big card, turn, I knew it / Practice again ──
  const stage = page.getByTestId("flashcards-stage");
  await stage.getByText("Flashcards", { exact: true }).waitFor();
  await stage.getByRole("heading", { name: "¿Cuál es tu color favorito?" }).waitFor();
  await stage.getByText("Mira el color y di su nombre.").waitFor();
  await stage.getByRole("button", { name: /Sound on/ }).waitFor();
  await stage.getByRole("button", { name: "Full screen" }).waitFor();
  const strip = page.getByTestId("activity-strip");
  await strip.getByRole("link", { name: /Edit Content/ }).waitFor();
  await strip.getByRole("button", { name: /Print Worksheet/ }).waitFor();
  await shot(page, "p03-start");
  await stage.getByRole("button", { name: "Start" }).click();
  const at = (t) => page.getByTestId("card-counter").filter({ hasText: new RegExp(`^${t}$`) }).waitFor();
  await at("1 of 11");
  await page.getByTestId("game-clock").waitFor();
  await page.getByTestId("known-count").filter({ hasText: "✓ 0" }).waitFor();
  const cardBtn = page.locator("[data-card]");
  const img = cardBtn.locator("img").first();
  const ib = await img.boundingBox();
  assert(ib && ib.height > 160, `the picture is the main element (${ib && Math.round(ib.height)}px)`);
  assert(!(await page.getByTestId("mark-knew").isVisible()), "no ✓/✗ before flipping");
  await page.getByTestId("turn-card").filter({ hasText: "Flip" }).waitFor();
  await shot(page, "p04-card-front");
  await cardBtn.click(); // click flips it
  await page.getByTestId("mark-knew").waitFor();
  await page.waitForTimeout(600);
  await page.getByRole("button", { name: "Listen" }).click();
  await page.waitForTimeout(200);
  const said = await page.evaluate(() => window.__spoken.map((x) => x.text));
  assert(said.includes("rojo"), `back audio played: ${said}`);
  await shot(page, "p05-card-back");
  await page.getByTestId("mark-knew").click();
  await page.getByTestId("mark-overlay").waitFor();
  await at("2 of 11");
  await page.getByTestId("known-count").filter({ hasText: "✓ 1" }).waitFor();
  await page.keyboard.press("Space"); // Space flips it too
  await page.getByTestId("mark-again").click();
  for (let i = 3; i <= 11; i++) {
    await at(`${i} of 11`);
    await page.getByTestId("turn-card").click(); // the Flip button
    await page.getByTestId(i % 4 === 0 ? "mark-again" : "mark-knew").click();
  }
  // The cards marked ✗ come round again until every card is ✓
  const missedCount = 1 + [4, 8].length;
  await at(`1 of ${missedCount}`);
  for (let i = 1; i <= missedCount; i++) {
    await at(`${i} of ${missedCount}`);
    await page.locator("[data-card]").click();
    await page.getByTestId("mark-knew").click();
  }
  const results = page.getByTestId("round-results");
  await results.waitFor();
  await results.getByText("Game complete").waitFor();
  const finalScore = await page.getByTestId("final-score").textContent();
  assert(finalScore === `${11 - missedCount}/11`, `score counts ✓ on the first try: ${finalScore}`);
  await shot(page, "p06-results");
  await results.getByRole("button", { name: "Show answers" }).click();
  const answers = page.getByTestId("answers-list");
  assert((await answers.locator("li").count()) === 11, "every card in the answers");
  assert((await answers.getByLabel("Not on the first try").count()) === missedCount, "✗ on the first try marked");
  await shot(page, "p06b-answers");
  await answers.getByRole("button", { name: /Back/ }).click();
  await page.getByRole("button", { name: "Finish" }).click();
  await page.getByText("¡Terminaste!").waitFor();
  log("game: start screen, top bar, Flip/click/Space, ✓/✗ with overlay, the", missedCount, "✗ cards came round again, Game complete", finalScore, ", answers, finish");

  // Sound off and on
  await page.reload();
  await stage.getByRole("button", { name: /Sound on/ }).click();
  await stage.getByRole("button", { name: /Sound off/ }).waitFor();

  // ── 4. Printables from the same activity ──
  await strip.getByRole("button", { name: /Print Worksheet/ }).click();
  const viewer = page.getByRole("dialog", { name: "Printables" });
  await viewer.getByRole("button", { name: /Print worksheet/ }).waitFor();
  await viewer.getByRole("button", { name: /Download PDF/ }).waitFor();
  await viewer.getByRole("button", { name: /Options/ }).waitFor();
  await viewer.getByRole("button", { name: "Close" }).waitFor();
  const preview = page.getByTestId("printable-preview");
  const pageCount = async () => Number((await preview.locator("p").filter({ hasText: /pages? ·/ }).textContent()).match(/\d+/)[0]);
  // Flash cards: front | back table, 8 per page → 2 pages
  assert((await pageCount()) === 2, `flash cards table pages: ${await pageCount()}`);
  assert((await preview.getByText("rojo vivo").count()) >= 1, "the edited back is in the table");
  await preview.getByText("Name:").first().waitFor();
  await shot(page, "p07-print-flashcards");
  let pdf = await download(page, () => viewer.getByRole("button", { name: /Download PDF/ }).click());
  assert(pdfPages(pdf) === 2, `flash cards PDF pages: ${pdfPages(pdf)}`);
  // Cut-out cards, front + back: 11 cards → 2 sheets × 2 sides
  await viewer.getByRole("button", { name: /Options/ }).click();
  const optsPanel = viewer.getByRole("region", { name: "Print options" });
  await optsPanel.getByLabel("Cut-out cards").check();
  assert((await pageCount()) === 4, `cut-out duplex pages: ${await pageCount()}`);
  await shot(page, "p07b-print-cutout");
  pdf = await download(page, () => viewer.getByRole("button", { name: /Download PDF/ }).click());
  assert(pdfPages(pdf) === 4, `cut-out PDF pages: ${pdfPages(pdf)}`);
  await optsPanel.getByLabel("Front | back table").check();
  await optsPanel.getByLabel("Per page").selectOption("4");
  assert((await pageCount()) === 3, `table with 4 per page: ${await pageCount()}`);
  await optsPanel.getByLabel("Per page").selectOption("8");
  await viewer.getByRole("button", { name: /Options/ }).click();
  log("flash cards: table 2 pages (4 per page → 3), cut-out duplex 4 pages; PDFs agree");

  await viewer.getByRole("button", { name: /Match up/ }).click();
  assert((await pageCount()) === 2, `match pages: ${await pageCount()}`);
  await preview.getByText("Name:").first().waitFor();
  await preview.getByText("Date:").first().waitFor();
  await shot(page, "p08-print-match");
  pdf = await download(page, () => viewer.getByRole("button", { name: /Download PDF/ }).click());
  assert(pdfPages(pdf) === 2, `match PDF pages: ${pdfPages(pdf)}`);

  await viewer.getByRole("button", { name: /^Quiz/ }).click();
  let quizPagesN = await pageCount();
  assert(quizPagesN >= 1, `quiz pages: ${quizPagesN}`);
  assert((await preview.getByText("rojo vivo").count()) >= 1, "edited back is a quiz choice");
  await viewer.getByRole("button", { name: /Options/ }).click();
  await optsPanel.getByLabel("Answers", { exact: true }).check();
  await optsPanel.getByLabel("Add an answer key page").check();
  assert((await pageCount()) === quizPagesN + 1, "answer key page added");
  quizPagesN += 1;
  await preview.getByText("Answer key").first().waitFor();
  await viewer.getByRole("button", { name: /Options/ }).click();
  await shot(page, "p09-print-quiz");
  pdf = await download(page, () => viewer.getByRole("button", { name: /Download PDF/ }).click());
  assert(pdfPages(pdf) === quizPagesN, `quiz PDF pages ${pdfPages(pdf)} vs ${quizPagesN}`);

  await viewer.getByRole("button", { name: /Spin the wheel/ }).click();
  assert((await pageCount()) === 1, `wheel pages: ${await pageCount()}`);
  await shot(page, "p10-print-wheel");
  pdf = await download(page, () => viewer.getByRole("button", { name: /Download PDF/ }).click());
  assert(pdfPages(pdf) === 1, `wheel PDF pages: ${pdfPages(pdf)}`);
  // Options shared by the worksheets: instruction, orientation, show
  await viewer.getByRole("button", { name: /Options/ }).click();
  await optsPanel.getByLabel("Instruction").fill("Gira la rueda y di el color.");
  await preview.getByText("Gira la rueda y di el color.").first().waitFor();
  await optsPanel.getByLabel("Orientation").selectOption("landscape");
  const land = await page.locator("#ls-print-root [data-print-page]").first().evaluate((el) => [el.offsetWidth, el.offsetHeight]);
  assert(land[0] === 1056 && land[1] === 816, `landscape page ${land}`);
  await optsPanel.getByLabel("Name", { exact: true }).uncheck();
  assert((await preview.getByText("Name:").count()) === 0, "Name line hidden");
  await shot(page, "p10b-print-wheel-landscape");
  await optsPanel.getByLabel("Name", { exact: true }).check();
  await optsPanel.getByLabel("Orientation").selectOption("portrait");
  await viewer.getByRole("button", { name: /Options/ }).click();
  log("match (2 pages), quiz (", quizPagesN, "pages with key), wheel (1): previews and PDFs agree");

  // Options: A4, only three cards → quiz needs fill-ins
  await viewer.getByRole("button", { name: /Options/ }).click();
  await viewer.getByLabel("A4").check();
  await viewer.getByRole("button", { name: "None", exact: true }).click();
  await preview.getByText("Choose at least one card").waitFor();
  const opts = viewer.getByRole("region", { name: "Print options" });
  for (const i of [0, 1]) await opts.locator("ul input[type=checkbox]").nth(i).check();
  await viewer.getByRole("button", { name: /^Quiz/ }).click();
  await viewer.getByRole("button", { name: /Options/ }).click();
  const fill = preview.getByRole("region", { name: "Complete the quiz options" });
  await fill.waitFor();
  const blanks = fill.locator("input");
  assert((await blanks.count()) === 4, `2 questions × 2 blank choices (${await blanks.count()})`);
  await blanks.first().fill("violeta");
  await preview.getByText("violeta").first().waitFor();
  await preview.getByText("A4").first().waitFor();
  await shot(page, "p11-print-quiz-fill");
  const a4 = await page.locator("#ls-print-root [data-print-page]").first().evaluate((el) => [el.offsetWidth, el.offsetHeight]);
  assert(a4[0] === 794 && a4[1] === 1123, `A4 page size ${a4}`);
  // Print worksheet only prints the pages
  await page.emulateMedia({ media: "print" });
  await page.evaluate(() => document.body.classList.add("ls-printing"));
  const visible = await page.evaluate(() => [...document.body.children].filter((el) => getComputedStyle(el).display !== "none").map((el) => el.id));
  assert(visible.length === 1 && visible[0] === "ls-print-root", `only the printable is printed: ${visible}`);
  await page.evaluate(() => document.body.classList.remove("ls-printing"));
  await page.emulateMedia({ media: "screen" });
  await viewer.getByRole("button", { name: "Close" }).click();
  log("options: A4 (794×1123), card selection, quiz fill-in shows in the preview; print shows only the pages");

  // ── 5. One-sided deck ──
  const g2 = await (await page.request.get(`${BASE}/api/games/${gameId}`)).json();
  r = await page.request.put(`${BASE}/api/games/${gameId}`, { data: { ...g2, settings: { ...g2.settings, options: { ...(g2.settings.options ?? {}), sides: "one" } } } });
  assert(r.ok(), "single sided saved");
  await page.reload();
  await stage.getByRole("button", { name: "Start" }).click();
  await page.getByTestId("card-counter").filter({ hasText: /^1 of 11$/ }).waitFor();
  await page.getByTestId("mark-knew").waitFor(); // no turning in single sided
  assert((await page.getByTestId("turn-card").count()) === 0, "no Flip button in single sided");
  await page.getByTestId("mark-knew").click();
  await page.getByTestId("card-counter").filter({ hasText: /^2 of 11$/ }).waitFor();
  await strip.getByRole("button", { name: /Print Worksheet/ }).click();
  assert((await pageCount()) === 2, `single sided flash cards: fronts only (${await pageCount()})`);
  await viewer.getByRole("button", { name: "Close" }).click();
  log("single sided: advances without the back, printables print fronts only");
  r = await page.request.put(`${BASE}/api/games/${gameId}`, { data: g2 });
  assert(r.ok(), "back to double sided");

  // ── 6. Reload the editor: everything kept ──
  await page.goto(editUrl);
  await page.getByRole("button", { name: "EN", exact: true }).click();
  await page.getByText("11 of 100").first().waitFor();
  assert((await page.locator("ol > li").first().getByRole("textbox", { name: "Back: Text" }).inputValue()) === "rojo vivo", "edit kept after reload");

  // ── 7. 100 cards ──
  const big = { ...g2, items: Array.from({ length: 100 }, (_, i) => ({ ...items[i % 11], data: { ...items[i % 11].data, back: { ...items[i % 11].data.back, text: `${COLORS[i % 11][0]} ${i + 1}` } } })) };
  r = await page.request.put(`${BASE}/api/games/${gameId}`, { data: big });
  assert(r.ok(), `100 cards saved (${r.status()})`);
  await page.reload();
  await page.getByText("100 of 100").first().waitFor();
  assert(await page.getByRole("button", { name: /\+ Add an item/ }).isDisabled(), "Add an item disabled at 100");
  const done100 = await page.getByTestId("editor-done").boundingBox();
  assert(done100 && done100.y + done100.height <= 900, "Done still visible with 100 cards");
  await page.goto(`${BASE}/play/preview/${gameId}`);
  await stage.getByRole("button", { name: "Start" }).click();
  await page.getByTestId("card-counter").filter({ hasText: /^1 of 100$/ }).waitFor();
  await strip.getByRole("button", { name: /Print Worksheet/ }).click();
  assert((await pageCount()) === 13, `100 cards → 13 table pages (${await pageCount()})`);
  await viewer.getByRole("button", { name: /Options/ }).click();
  await viewer.getByRole("region", { name: "Print options" }).getByLabel("Cut-out cards").check();
  assert((await pageCount()) === 26, `100 cards → 13 sheets × 2 (${await pageCount()})`);
  await viewer.getByRole("button", { name: /Options/ }).click();
  await viewer.getByRole("button", { name: /Spin the wheel/ }).click();
  assert((await pageCount()) === 9, `100 cards → 9 wheels (${await pageCount()})`);
  pdf = await download(page, () => viewer.getByRole("button", { name: /Download PDF/ }).click());
  assert(pdfPages(pdf) === 9, `wheel PDF 100 cards: ${pdfPages(pdf)}`);
  await shot(page, "p12-print-wheel-100");
  await viewer.getByRole("button", { name: "Close" }).click();
  r = await page.request.put(`${BASE}/api/games/${gameId}`, { data: g2 });
  log("100 cards: editor limit, game, 13 table pages / 26 cut-out pages, 9 wheels (PDF 9 pages)");

  // ── 8. Phone ──
  const phone = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, locale: "en-US", storageState: await ctx.storageState() });
  await phone.addInitScript(voiceStub);
  const m = await phone.newPage();
  m.on("pageerror", (e) => errors.push(`phone: ${e.message}`));
  await m.goto(editUrl);
  await m.locator("ol > li").first().waitFor();
  let overflow = await m.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  assert(overflow <= 1, `editor: no sideways scroll on a phone (${overflow}px)`);
  const f = await m.locator("ol > li").first().getByRole("textbox", { name: /^(Front|Frente)/ }).first().boundingBox();
  const b = await m.locator("ol > li").first().getByRole("textbox", { name: /^(Back|Reverso)/ }).first().boundingBox();
  assert(b.y > f.y + 10, "faces stacked in the row on a phone");
  await shot(m, "p13-phone-editor");
  await m.goto(`${BASE}/play/preview/${gameId}`);
  await m.getByTestId("flashcards-stage").getByRole("button", { name: "Start" }).tap();
  await m.getByTestId("card-counter").filter({ hasText: /^1 of 11$/ }).waitFor();
  await m.locator("[data-card]").tap();
  await m.getByTestId("mark-knew").waitFor();
  overflow = await m.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  assert(overflow <= 1, `game: no sideways scroll (${overflow}px)`);
  await shot(m, "p14-phone-game");
  await m.getByTestId("activity-strip").getByRole("button", { name: /Print Worksheet/ }).tap();
  const nav = await m.getByRole("navigation", { name: "Printable templates" }).boundingBox();
  const pv = await m.getByTestId("printable-preview").boundingBox();
  assert(nav.y + nav.height <= pv.y + 1, "template picker above the preview on a phone");
  await shot(m, "p15-phone-printables");
  await phone.close();
  log("phone: stacked faces, tap to turn, picker above the preview, no sideways scroll");

  assert(errors.length === 0, `page errors: ${errors.join(" | ")}`);
  log("ALL FLASHCARDS + PRINTABLES CHECKS PASSED");
} catch (e) {
  await shot(page, "p99-failure");
  console.error("FAILED:", e.message);
  process.exitCode = 1;
} finally {
  await browser.close();
  await db.$disconnect();
}
