// End-to-end tests for Create Activity: the template gallery, the universal editor, the new
// boards (Flashcards, Spell the Word, Label the Diagram, Spin the Wheel, Open the Box,
// Match & Speak), multilingual prompts and the alphabet page. Real Chromium, a fake microphone
// playing real speech through capture → VAD → WAV → /api/stt; transcripts come from the
// scripted test recognizer, which also logs the recognition locale of every answer.
//
// The browser's speechSynthesis is replaced by a recorder (headless Chromium has no voices), so
// the test can check which language each part of a prompt is read in. Real voices still need a
// manual check on a Chromebook, and natural joined audio needs a TTS key (see docs/STATUS.md).
//
// Run: BASE_URL=http://localhost:3100 E2E_STT_SCRIPT_FILE=/tmp/stt.json E2E_STT_LOG=/tmp/stt.log node e2e/templates.e2e.mjs
import { chromium } from "playwright";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const BASE = process.env.BASE_URL ?? "http://localhost:3100";
const SCRIPT = process.env.E2E_STT_SCRIPT_FILE;
const STT_LOG = process.env.E2E_STT_LOG;
const fx = (f) => path.resolve("e2e/fixtures", f);
const stamp = Date.now();
const log = (...a) => console.log("•", ...a);
const SHOTS = process.env.SCREENSHOTS;
const shot = async (p, name) => SHOTS && p.screenshot({ path: path.join(SHOTS, `${name}.png`) });
const script = (items) => writeFileSync(SCRIPT, JSON.stringify(items));
const sttLog = () => (STT_LOG ? readFileSync(STT_LOG, "utf8").trim().split("\n").filter(Boolean).map((l) => JSON.parse(l)) : []);
const clearSttLog = () => STT_LOG && writeFileSync(STT_LOG, "");
const assert = (ok, msg) => {
  if (!ok) throw new Error(msg);
};
const CORRECT = "text=/¡Muy bien!|¡Lo lograste!|¡Excelente!|¡Buen trabajo!|¡Así se dice!|¡Perfecto!/";

// Fake browser voices that record what is spoken, in which language; counts microphone opens.
const INIT = () => {
  window.__spoken = [];
  window.__gum = 0;
  const voices = ["es-MX", "en-US", "fr-FR"].map((lang) => ({ name: `Test ${lang}`, lang, localService: true, default: false, voiceURI: lang }));
  class Utt {
    constructor(text) {
      this.text = text;
    }
  }
  window.SpeechSynthesisUtterance = Utt;
  Object.defineProperty(window, "speechSynthesis", {
    value: {
      getVoices: () => voices,
      addEventListener() {},
      cancel() {},
      speak(u) {
        window.__spoken.push({ lang: u.lang, text: u.text });
        setTimeout(() => u.onend?.(), 40);
      },
    },
  });
  const gum = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
  navigator.mediaDevices.getUserMedia = (c) => {
    if (c?.audio) window.__gum++;
    return gum(c);
  };
};

const browser = await chromium.launch({
  args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream", `--use-file-for-fake-audio-capture=${fx("answer.wav")}`, "--autoplay-policy=no-user-gesture-required"],
});
const ctx = await browser.newContext({ permissions: ["microphone"], viewport: { width: 1366, height: 768 } });
await ctx.addInitScript(INIT);
const page = await ctx.newPage();
page.on("pageerror", (e) => console.error("PAGE ERROR", e.message));
page.on("dialog", (d) => d.accept());

async function newActivity(key, title) {
  await page.goto(`${BASE}/teacher/games/new`);
  await page.click(`button[value=${key}]`);
  await page.waitForURL(/\/edit$/);
  await page.getByLabel("Activity title").fill(title);
  return page.url().split("/").at(-2);
}
async function saved() {
  await page.waitForSelector("text=/All changes saved|Saved \\d/", { timeout: 15000 });
}
async function publish() {
  await saved();
  await page.click("button:text-is('Publish')");
  await page.waitForSelector("button:text-is('Update published')", { timeout: 20000 });
}
async function preview(gameId) {
  await page.goto(`${BASE}/play/preview/${gameId}`);
  await page.waitForSelector("text=Teacher preview — answers are not saved");
}
const field = (section, label) => section.getByLabel(label, { exact: true });

try {
  // ── Teacher, class, group and student ─────────────────────────────────────────────
  await page.goto(`${BASE}/signup`);
  await page.fill("#displayName", "Marta Gómez");
  await page.fill("#schoolName", "Roosevelt Elementary");
  await page.fill("#email", `tpl${stamp}@school.test`);
  await page.fill("#password", "correct-horse-42");
  await page.click("button[type=submit]");
  await page.waitForURL(`${BASE}/teacher`);
  await page.goto(`${BASE}/teacher/classes`);
  await page.fill("#name", "Spanish 3rd grade");
  await page.click("text=Create class");
  await page.click("text=Spanish 3rd grade");
  await page.waitForURL(/\/teacher\/classes\/.+/);
  const code = (await page.locator("span.font-mono").first().textContent()).trim();
  await page.fill('input[aria-label="New level"]', "LE3");
  await page.click("text=Add level");
  await page.fill('input[aria-label="New group in LE3"]', "Group A");
  await page.click("text=Add group");
  await page.waitForSelector("text=Group A");
  await page.fill('input[aria-label="First name"]', "Lucía");
  await page.fill('input[aria-label="Last initial"]', "R");
  await page.selectOption('select[aria-label="Group"]', { label: "LE3 · Group A" });
  await page.click("text=Add student");
  const pin = (await page.locator("[role=status]:has-text('Lucía') .font-mono").textContent()).trim();
  log("class", code, "student PIN", pin);

  // ── Test 1: dashboard button → template gallery with filters and oral indicator ────
  await page.goto(`${BASE}/teacher`);
  await page.click("a:text-is('+ Create Activity')");
  await page.waitForSelector("h1:text-is('Choose an Activity Template')");
  const cards = page.locator("article");
  assert((await cards.count()) === 8, `gallery shows ${await cards.count()} templates, expected 8`);
  for (const name of ["Flashcards", "Spell the Word", "Spin the Wheel", "Label the Diagram", "Open the Box", "Listen & Repeat", "Image & Speak", "Match & Speak"]) {
    assert(await page.locator(`article h2:has-text("${name}")`).count(), `gallery is missing ${name}`);
  }
  assert((await page.locator("article svg").count()) >= 8, "each template card has an illustrated preview");
  assert(await page.locator("article:has-text('Spell the Word') >> text=Out loud or typed — you choose").count(), "Spell the Word oral indicator");
  assert(await page.locator("article:has-text('Match & Speak') >> text=Speaking optional — you choose").count(), "Match & Speak oral indicator");
  await shot(page, "t01-gallery");
  await page.click("button[aria-pressed]:text-is('Spelling')");
  const spellingNames = await page.locator("article h2").allTextContents();
  assert(spellingNames.some((n) => n.includes("Spell the Word")) && !spellingNames.some((n) => n.includes("Flashcards")), `Spelling filter shows: ${spellingNames.join(", ")}`);
  await page.click("button[aria-pressed]:text-is('All')");
  log("Test 1 gallery: 8 illustrated templates, filters and oral indicators work");

  // ── Tests 2, 6, 7, 8, 9, 12: Flashcards with a multilingual prompt, assigned and played ─
  const fcId = await newActivity("FLASHCARDS", "El amor y las frutas");
  const c1 = page.locator("section[aria-label='Card 1']");
  const prompt1 = c1.locator("input[placeholder='¿Qué fruta es?']");
  await prompt1.fill("¿Cómo se dice en español, LOVE?");
  // The app only proposes; the teacher confirms.
  await c1.locator("text=looks like English").waitFor();
  assert((await prompt1.inputValue()) === "¿Cómo se dice en español, LOVE?", "the prompt must not change before the teacher confirms");
  await c1.locator("p:has-text('looks like English') button:text-is('Yes')").click();
  const tagged = await prompt1.inputValue();
  assert(tagged === "¿Cómo se dice en español, [en]LOVE[/en]?", `marked prompt is "${tagged}"`);
  const readAs = (await c1.locator("[aria-label='How it will be read']").first().textContent()).replace(/\s+/g, " ");
  assert(/ES¿Cómo se dice en español,.*ENLOVE/.test(readAs), `Read as: ${readAs}`);
  // The Spanish spell checker must leave the English word alone.
  await prompt1.focus();
  await c1.locator("button:text('Check spelling')").first().click();
  await page.waitForTimeout(1500);
  const sugg = await c1.locator("del").allTextContents();
  assert(!sugg.some((t) => /love/i.test(t)), `spell checker flagged LOVE: ${sugg.join(", ")}`);
  assert((await prompt1.inputValue()) === tagged, "spell check changed the prompt");
  await c1.locator("input[placeholder='La manzana.']").fill("amor");
  await c1.locator("select[aria-label='Answer language']").selectOption("es-419");
  await c1.locator("input[placeholder='the apple']").fill("love");
  await page.click("text=+ Add card");
  const c2 = page.locator("section[aria-label='Card 2']");
  await c2.locator("input[placeholder='¿Qué fruta es?']").fill("¿Qué fruta es?");
  await c2.locator("input[placeholder='La manzana.']").fill("La manzana.");
  await c2.locator("input[type=file]").setInputFiles(fx("dog.png"));
  await c2.locator("img").waitFor();
  await saved();
  await shot(page, "t02-flashcards-editor");
  // Assign straight from the draft: publishes, then opens the assignment form.
  await page.click("button:text-is('Assign')");
  await page.waitForURL(/assignments\/new/, { timeout: 20000 });
  await page.check("label:has-text('LE3 Group A') input");
  await page.click("text=Assign activity");
  await page.waitForURL(/\/teacher\/assignments\/(?!new)[^/?]+$/);
  const resultsUrl = page.url();
  log("Test 2 flashcards created with a marked English word, published and assigned from the editor");

  const sctx = await browser.newContext({ permissions: ["microphone"], viewport: { width: 1366, height: 768 } });
  await sctx.addInitScript(INIT);
  const s = await sctx.newPage();
  s.on("pageerror", (e) => console.error("STUDENT PAGE ERROR", e.message));
  await s.goto(`${BASE}/student`);
  await s.fill("#code", code);
  await s.click("text=Next");
  await s.click("button:has-text('Lucía')");
  for (const d of pin) await s.click(`button:text-is('${d}')`);
  await s.click("text=Go!");
  await s.waitForURL(`${BASE}/learn`);
  clearSttLog();
  // Card 1: first a low-confidence "amor" (UNCERTAIN, must not count as a miss), then "amor".
  script([{ text: "amor", confidence: 0.1 }, { text: "amor", confidence: 0.93 }, { text: "la manzana", confidence: 0.9 }]);
  await s.click("text=El amor y las frutas");
  await s.waitForURL(/\/play\//);
  await s.click("text=🎤 Start");
  await s.waitForSelector("text=Te escucho", { timeout: 15000 });
  await s.waitForSelector("text=/No te escuché bien|Habla un poquito más fuerte/", { timeout: 40000 });
  log("Test 12 low-confidence answer → “didn't hear you well” (uncertain, not incorrect)");
  await s.waitForSelector(CORRECT, { timeout: 40000 });
  await shot(s, "t03-flashcard-correct");
  await s.waitForSelector("text=¡Terminaste!", { timeout: 60000 });
  const fcSummary = (await s.locator("main").textContent()).replace(/\s+/g, " ");
  assert(fcSummary.includes("2 of 2 on your own"), `flashcards summary: ${fcSummary}`);
  const spoken = await s.evaluate(() => window.__spoken);
  const iLove = spoken.findIndex((x) => /^LOVE\b/.test(x.text));
  assert(iLove > 0 && spoken[iLove].lang === "en-US", `LOVE should be read by the English voice: ${JSON.stringify(spoken.slice(0, 6))}`);
  assert(spoken[iLove - 1].lang === "es-MX" && spoken[iLove - 1].text.startsWith("¿Cómo se dice en español"), "the Spanish part is read by the Spanish voice");
  log("Tests 6/7 prompt read in two voices:", spoken.slice(iLove - 1, iLove + 2).map((x) => `${x.lang}: ${x.text}`).join(" | "));
  const locales = sttLog();
  assert(locales.length >= 3 && locales.every((l) => l.locale === "es-MX"), `recognition locales: ${JSON.stringify(locales)}`);
  log("Test 8 “amor” recognized with es-MX (never switched to English):", locales.map((l) => `${l.text}@${l.locale}`).join(", "));
  const gum = await s.evaluate(() => window.__gum);
  assert(gum === 1, `microphone opened ${gum} times`);
  log("Test 9 the microphone was opened once for the whole activity (3 answers, 2 cards)");
  await page.goto(resultsUrl);
  await page.waitForSelector("tr:has-text('Lucía') >> text=completed");
  const row = (await page.locator("tr:has-text('Lucía')").textContent()).replace(/\s+/g, " ");
  assert(row.includes("2/2"), `teacher results row: ${row}`);
  log("teacher results:", row);

  // ── Tests 3, 11: Spell the Word by voice (letter names in several breaths) ───────────
  const spId = await newActivity("SPELL_THE_WORD", "Deletrea");
  const w1 = page.locator("section[aria-label='Word 1']");
  await w1.locator("input[placeholder='mariposa']").fill("ñandú");
  await page.click("text=+ Add word");
  const w2 = page.locator("section[aria-label='Word 2']");
  await w2.locator("input[placeholder='mariposa']").fill("vaca");
  await publish();
  clearSttLog();
  script([{ text: "eñe a ene", confidence: 0.9 }, { text: "de u", confidence: 0.9 }, { text: "ve corta a", confidence: 0.9 }, { text: "ce a", confidence: 0.9 }]);
  await preview(spId);
  await page.click("text=🎤 Start");
  await page.waitForSelector("text=Te escucho", { timeout: 15000 });
  await page.waitForSelector("text=¡Terminaste!", { timeout: 90000 });
  const spSummary = (await page.locator("main").textContent()).replace(/\s+/g, " ");
  assert(spSummary.includes("2 of 2 on your own"), `spelling summary: ${spSummary}`);
  assert(sttLog().every((l) => l.mode === "LETTERS"), "spelling answers are recognized in letters mode");
  log("Test 11 spelled “ñandú” (eñe a ene … de u) and “vaca” (ve corta a … ce a) by voice");

  // ── Spell the Word, typing mode: precise feedback, no microphone ─────────────────────
  const tyId = await newActivity("SPELL_THE_WORD", "Escribe");
  await page.getByLabel("How students spell").selectOption("type");
  await page.locator("section[aria-label='Word 1'] input[placeholder='mariposa']").fill("árbol");
  await publish();
  await preview(tyId);
  const gumBefore = await page.evaluate(() => window.__gum);
  await page.click("button:has-text('Start')");
  const box = page.locator("input[aria-label='Type the word']");
  await box.waitFor();
  await box.fill("arbol");
  await page.click("button:text-is('Check')");
  await page.waitForSelector("text=Revisa la tilde.", { timeout: 10000 });
  await box.fill("árbol");
  await page.click("button:text-is('Check')");
  await page.waitForSelector("text=¡Terminaste!", { timeout: 20000 });
  assert((await page.evaluate(() => window.__gum)) === gumBefore, "typing mode must not open the microphone");
  log("Test 4 typed spelling: “arbol” → missing-accent feedback, “árbol” → correct; microphone never opened");

  // ── Test 5: Label the Diagram (tap a label, then its point) ──────────────────────────
  const dgId = await newActivity("LABEL_THE_DIAGRAM", "El perro");
  await page.getByLabel("How students label").selectOption("drag");
  await page.locator("section[aria-label='Picture to label'] input[type=file]").setInputFiles(fx("dog.png"));
  const editorPic = page.locator("[data-testid=diagram-editor]");
  await editorPic.waitFor();
  const p1 = page.locator("section[aria-label='Point 1']");
  const p2 = page.locator("section[aria-label='Point 2']");
  await field(p1, "Label").fill("la cabeza");
  await p1.locator("input[placeholder='La cabeza.']").fill("la cabeza");
  await field(p2, "Label").fill("la cola");
  await p2.locator("input[placeholder='La cabeza.']").fill("la cola");
  await p1.locator("button:has-text('Not placed')").click().catch(() => {});
  await editorPic.click({ position: { x: 60, y: 50 } });
  await editorPic.click({ position: { x: 220, y: 150 } });
  assert((await page.locator("section[aria-label='Point 2'] >> text=/Placed|Placing/").count()) > 0, "point 2 placed");
  await publish();
  await preview(dgId);
  await page.click("button:has-text('Start')");
  await page.locator("[aria-label=Labels] button:text-is('la cola')").click();
  await page.click("button[aria-label='Point 1']");
  await page.waitForTimeout(400);
  assert((await page.locator("[aria-label=Labels] button:text-is('la cola')").count()) === 1, "a wrong label must not be placed");
  await page.locator("[aria-label=Labels] button:text-is('la cabeza'):not([disabled])").click();
  await page.click("button[aria-label='Point 1']");
  await page.locator("[aria-label=Labels] button:text-is('la cola'):not([disabled])").click();
  await page.click("button[aria-label='Point 2']");
  await page.waitForSelector("text=¡Terminaste!", { timeout: 20000 });
  log("Test 5 diagram: points placed by clicking the picture; wrong label rejected, both labels placed");

  // ── Spin the Wheel ───────────────────────────────────────────────────────────────────
  const whId = await newActivity("SPIN_THE_WHEEL", "La ruleta de colores");
  for (const [i, [slice, q, a]] of [["Rojo", "¿De qué color es la fresa?", "roja"], ["Amarillo", "¿De qué color es el sol?", "amarillo"]].entries()) {
    // these templates start with two items
    const sec = page.locator(`section[aria-label='Slice ${i + 1}']`);
    await field(sec, "Text on the wheel").fill(slice);
    await sec.locator("input[placeholder='¿De qué color es el sol?']").fill(q);
    await sec.locator("input[placeholder='Amarillo.']").fill(a);
  }
  await publish();
  await preview(whId);
  await page.click("text=🎤 Start");
  for (let k = 0; k < 2; k++) {
    await page.click("button:has-text('Spin!')");
    await page.waitForTimeout(4500);
    const qText = await page.locator("main").textContent();
    script([{ text: qText.includes("fresa") ? "roja" : "amarillo", confidence: 0.92 }]);
    await page.waitForSelector(CORRECT, { timeout: 30000 });
    await page.waitForTimeout(1200);
  }
  await page.waitForSelector("text=¡Terminaste!", { timeout: 20000 });
  log("Spin the Wheel: two spins answered by voice, completed slices removed");

  // ── Open the Box ─────────────────────────────────────────────────────────────────────
  const bxId = await newActivity("OPEN_THE_BOX", "Las cajas");
  for (const [i, [q, a]] of [["¿Cómo te llamas?", "me llamo Lucía"], ["¿Cuántos años tienes?", "tengo ocho años"]].entries()) {
    // these templates start with two items
    const sec = page.locator(`section[aria-label='Box ${i + 1}']`);
    await sec.locator("input[placeholder='¿Qué es?']").fill(q);
    await sec.locator("input[placeholder='Es un gato.']").fill(a);
  }
  await page.getByLabel("Box order").selectOption("sequential");
  await publish();
  await preview(bxId);
  await page.click("text=🎤 Start");
  assert(await page.locator("button[aria-label='Box 2']").isDisabled(), "sequential order: box 2 is locked first");
  script([{ text: "me llamo Lucía", confidence: 0.9 }, { text: "tengo ocho años", confidence: 0.9 }]);
  await page.click("button[aria-label='Box 1']");
  await page.waitForSelector(CORRECT, { timeout: 30000 });
  await page.waitForSelector("button[aria-label='Box 2']:not([disabled])", { timeout: 15000 });
  await page.click("button[aria-label='Box 2']");
  await page.waitForSelector("text=¡Terminaste!", { timeout: 40000 });
  log("Open the Box: sequential order enforced, both boxes answered by voice");

  // ── Match & Speak ────────────────────────────────────────────────────────────────────
  const mtId = await newActivity("MATCH_AND_SPEAK", "Animales");
  for (const [i, [img, w]] of [["dog.png", "el perro"], ["cat.png", "el gato"]].entries()) {
    // these templates start with two items
    const sec = page.locator(`section[aria-label='Pair ${i + 1}']`);
    await sec.locator("input[type=file]").setInputFiles(fx(img));
    await sec.locator("img").waitFor();
    await sec.locator("input[placeholder='el perro']").fill(w);
  }
  await publish();
  await preview(mtId);
  await page.click("text=🎤 Start");
  script([{ text: "el perro", confidence: 0.9 }, { text: "el gato", confidence: 0.9 }]);
  const pics = page.locator("[aria-label='Picture — drop a word here']");
  // Pictures are in editor order: dog, cat.
  await page.locator("[aria-label=Words] button:text-is('el perro')").click();
  await pics.nth(0).click();
  await page.waitForSelector("text=Di:", { timeout: 10000 });
  await page.waitForSelector(CORRECT, { timeout: 30000 });
  await page.waitForSelector("[aria-label=Words] button:text-is('el gato'):not([disabled])", { timeout: 15000 });
  await page.locator("[aria-label=Words] button:text-is('el gato')").click();
  await page.locator("[aria-label='Picture — drop a word here']").first().click();
  await page.waitForSelector("text=¡Terminaste!", { timeout: 40000 });
  log("Match & Speak: matched by tapping, then each word said out loud");

  // ── Alphabet page: Ñ, Listen and Repeat ──────────────────────────────────────────────
  await page.goto(`${BASE}/teacher/alphabet`);
  assert((await page.locator("[role=listbox] [role=option]").count()) === 27, "27 letters");
  await page.click("[role=option][aria-label^='Ñ']");
  await page.evaluate(() => (window.__spoken = []));
  await page.click("button:has-text('🔊 Listen')");
  await page.waitForFunction(() => window.__spoken.some((x) => x.text === "eñe" && x.lang === "es-MX"));
  script([{ text: "eñe", confidence: 0.9 }]);
  await page.click("button:has-text('🎤 Repeat')");
  await page.waitForSelector(CORRECT, { timeout: 30000 });
  await shot(page, "t04-alphabet");
  log("Alphabet: Ñ “eñe” played by the Spanish voice and repeated by voice");

  console.log("\nTEMPLATES E2E PASSED");
} catch (e) {
  console.error("\nTEMPLATES E2E FAILED:", e.message);
  for (const p of browser.contexts().flatMap((c) => c.pages())) await p.screenshot({ path: `e2e/failure-t-${Math.random().toString(36).slice(2, 6)}.png`, fullPage: true }).catch(() => {});
  process.exitCode = 1;
} finally {
  await browser.close();
}
