// End-to-end test of the flashcard editor in real Chromium:
// "¿Cuál es tu color favorito?" with a red circle on both faces, audio "red" (English) on the front
// and "rojo" (Spanish) on the back; save, reopen, swap, student preview and play; 99/100/101 cards;
// keyboard reordering; a small screen; a failed save; undo delete.
// Device voices are stubbed so the test can see which words and language would be spoken.
// Run: BASE_URL=http://localhost:3100 node e2e/flashcards.e2e.mjs
import { chromium } from "playwright";
import path from "node:path";

const BASE = process.env.BASE_URL ?? "http://localhost:3100";
const fx = (f) => path.resolve("e2e/fixtures", f);
const stamp = Date.now();
const log = (...a) => console.log("•", ...a);
const SHOTS = process.env.SCREENSHOTS;
const shot = async (p, name) => SHOTS && p.screenshot({ path: path.join(SHOTS, `${name}.png`) });
const assert = (c, m) => {
  if (!c) throw new Error(m);
};

// Fake speechSynthesis: records what is spoken (text + language) and ends immediately.
const voiceStub = () => {
  window.__spoken = [];
  const voices = [
    { name: "Fake es", lang: "es-MX", default: false, localService: true, voiceURI: "es" },
    { name: "Fake en", lang: "en-US", default: true, localService: true, voiceURI: "en" },
  ];
  class U {
    constructor(text) {
      this.text = text;
      this.lang = "";
      this.voice = null;
      this.rate = 1;
    }
  }
  window.SpeechSynthesisUtterance = U;
  Object.defineProperty(window, "speechSynthesis", {
    value: {
      getVoices: () => voices,
      speak: (u) => {
        window.__spoken.push({ text: u.text, lang: u.lang });
        setTimeout(() => u.onend && u.onend(), 10);
      },
      cancel: () => {},
      addEventListener: () => {},
    },
  });
};

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 }, locale: "es-MX" });
await ctx.addInitScript(voiceStub);
const page = await ctx.newPage();
page.on("pageerror", (e) => console.error("PAGE ERROR", e.message));
const spoken = () => page.evaluate(() => window.__spoken.splice(0));
const status = () => page.getByTestId("save-status").textContent();
const waitSaved = () => page.waitForFunction(() => /Guardado|Saved/.test(document.querySelector("[data-testid=save-status]")?.textContent ?? ""), null, { timeout: 15000 });

try {
  await page.goto(`${BASE}/signup`);
  await page.fill("#displayName", "Ana Rivera");
  await page.fill("#schoolName", "Colegio Colores");
  await page.fill("#email", `cards${stamp}@school.test`);
  await page.fill("#password", "correct-horse-42");
  await page.click("button[type=submit]");
  await page.waitForURL(`${BASE}/teacher`);

  await page.goto(`${BASE}/teacher/games/new`);
  await page.click("button[value=FLASHCARDS]");
  await page.waitForURL(/\/edit$/);
  const editUrl = page.url();
  const gameId = editUrl.split("/").at(-2);
  await page.waitForSelector("text=Frente"); // Spanish labels (browser in Spanish)
  await page.getByLabel("Título de la actividad").fill("¿Cuál es tu color favorito?");
  await page.click("text=+ Añadir instrucciones");
  await page.getByLabel("Instrucciones para los estudiantes").fill("Escucha y di el color.");

  const row1 = page.locator("ol > li").first();
  // Front picture: "Añadir imagen" → search is not configured here → upload tab → edit → apply
  async function addPicture(face) {
    await row1.getByRole("button", { name: `Añadir imagen (${face})` }).click();
    const dlg = page.getByRole("dialog", { name: "Añadir imagen" });
    await dlg.getByText("La búsqueda en internet aún no está activada").waitFor();
    await dlg.locator("input[type=file]").setInputFiles(fx("red-circle.png"));
    const ed = page.getByRole("dialog", { name: "Editar" });
    await ed.locator("canvas").waitFor();
    await ed.getByRole("button", { name: "Girar a la derecha" }).click();
    await ed.getByRole("button", { name: "Voltear horizontal" }).click();
    await ed.getByRole("button", { name: "Deshacer", exact: true }).click(); // undo the flip, keep the rotation
    await ed.getByRole("button", { name: "Aplicar" }).click();
    await ed.waitFor({ state: "detached" });
    await row1.getByRole("textbox", { name: `Texto alternativo (${face})` }).fill(face === "Frente" ? "Círculo rojo" : "Círculo rojo (reverso)");
  }
  async function addTts(face, text, langLabel) {
    await row1.getByRole("button", { name: `Audio (${face})` }).click();
    const dlg = page.getByRole("dialog", { name: "Audio" });
    await dlg.getByRole("tab", { name: /Texto a voz/ }).click();
    await dlg.locator("select").first().selectOption({ label: langLabel });
    await dlg.getByPlaceholder(/red|rojo/).fill(text);
    await dlg.getByRole("button", { name: /Escuchar/ }).click();
    await dlg.getByRole("button", { name: "Guardar" }).click();
    await dlg.waitFor({ state: "detached" });
  }
  await addPicture("Frente");
  await addTts("Frente", "red", "Inglés (Estados Unidos)");
  const heardFront = await spoken();
  assert(heardFront.some((s) => s.text === "red" && s.lang.startsWith("en")), `front preview spoke ${JSON.stringify(heardFront)}`);
  await addPicture("Reverso");
  await addTts("Reverso", "rojo", "Español (Latinoamérica)");
  await waitSaved();
  await shot(page, "f01-editor");
  log("card 1: picture both sides, audio red (EN) / rojo (ES), saved");

  // Reopen: everything is still there
  await page.reload();
  await row1.waitFor();
  assert(await row1.getByRole("button", { name: "Escuchar (Frente)" }).textContent().then((t) => /red.*EN/.test(t)), "front audio after reload");
  assert(await row1.getByRole("button", { name: "Escuchar (Reverso)" }).textContent().then((t) => /rojo.*ES/.test(t)), "back audio after reload");
  assert((await row1.locator("img").count()) === 2, "both pictures after reload");
  assert((await row1.getByRole("textbox", { name: "Texto alternativo (Frente)" }).inputValue()) === "Círculo rojo", "alt text after reload");
  log("reopened: pictures, alt text and audio kept");

  // Swap front and back: audio moves with its face
  await page.getByRole("button", { name: /Intercambiar frente y reverso/ }).click();
  assert(/rojo.*ES/.test(await row1.getByRole("button", { name: "Escuchar (Frente)" }).textContent()), "front is rojo after swap");
  assert((await row1.getByRole("textbox", { name: "Texto alternativo (Frente)" }).inputValue()) === "Círculo rojo (reverso)", "alt text moved with the swap");
  await waitSaved();
  log("swapped: front now says rojo");

  // Student preview (editor): front audio, flip, back audio
  await page.getByRole("button", { name: /Vista previa/ }).click();
  await page.getByTestId("preview-play").click();
  await page.getByRole("button", { name: /Voltear/ }).last().click();
  await page.getByTestId("preview-play").click();
  const heard = await spoken();
  assert(heard[0]?.text === "rojo" && heard[0].lang.startsWith("es") && heard[1]?.text === "red" && heard[1].lang.startsWith("en"), `preview spoke ${JSON.stringify(heard)}`);
  await shot(page, "f02-preview");
  await page.getByRole("button", { name: "Cerrar" }).click();
  log("preview: front → rojo (es), back → red (en)");

  // Publish and play as a student would (no spoken answer → no microphone needed)
  await page.getByRole("button", { name: "Publish" }).click();
  await page.waitForSelector("text=Update published", { timeout: 20000 });
  const play = await ctx.newPage();
  await play.goto(`${BASE}/play/preview/${gameId}`);
  await play.getByRole("button", { name: /Start|Empezar|Comenzar/ }).first().click();
  await play.getByText("Card 1 of 1").waitFor();
  await play.getByRole("button", { name: "🔊 Listen" }).click();
  await play.getByRole("button", { name: "↻ Flip" }).click();
  await play.waitForTimeout(600);
  await play.getByRole("button", { name: "🔊 Listen" }).click();
  await play.waitForTimeout(300);
  const playHeard = await play.evaluate(() => window.__spoken.map((s) => `${s.text}/${s.lang.slice(0, 2)}`));
  assert(playHeard.includes("rojo/es") && playHeard.includes("red/en") && playHeard.indexOf("rojo/es") < playHeard.indexOf("red/en"), `player spoke ${playHeard}`);
  await shot(play, "f03-player-back");
  await play.close();
  log("player: visible face audio only →", playHeard.join(", "));

  // Keyboard reordering: add a second card "azul", move it up with the arrow key on its handle
  await page.getByRole("button", { name: /\+ Añadir tarjeta/ }).click();
  const row2 = page.locator("ol > li").nth(1);
  await row2.getByRole("textbox", { name: "Frente: Texto" }).fill("azul");
  await page.locator("[data-row-handle='1']").focus();
  await page.keyboard.press("ArrowUp");
  assert((await page.locator("ol > li").first().getByRole("textbox", { name: "Frente: Texto" }).inputValue()) === "azul", "keyboard move up");
  await page.getByRole("button", { name: "Bajar (1)" }).click();
  assert((await page.locator("ol > li").nth(1).getByRole("textbox", { name: "Frente: Texto" }).inputValue()) === "azul", "move down button");
  log("reorder with keyboard and buttons");

  // Delete + undo
  await page.getByRole("button", { name: "Eliminar (2)" }).click();
  assert((await page.locator("ol > li").count()) === 1, "deleted");
  await page.getByRole("button", { name: "Deshacer" }).click();
  assert((await page.locator("ol > li").count()) === 2, "undo delete");
  log("delete + undo");

  // One side: back hidden for students but kept in the editor
  await page.getByLabel("Una cara").check();
  assert((await page.getByText("Modo una cara").count()) === 1, "one-side note");
  await page.getByLabel("Dos caras").check();
  assert(/red.*EN/.test(await row1.getByRole("button", { name: "Escuchar (Reverso)" }).textContent()), "back kept after one → two sides");
  log("one side ↔ two sides keeps the backs");

  // A failed save shows "Error al guardar", then retry works
  await page.route(`**/api/games/${gameId}`, (r) => (r.request().method() === "PUT" ? r.fulfill({ status: 500, json: { error: "boom" } }) : r.continue()));
  await page.getByLabel("Título de la actividad").fill("¿Cuál es tu color favorito? (2)");
  await page.waitForFunction(() => /Error al guardar/.test(document.querySelector("[data-testid=save-status]")?.textContent ?? ""), null, { timeout: 15000 });
  await shot(page, "f04-save-error");
  await page.unroute(`**/api/games/${gameId}`);
  await page.getByRole("button", { name: "Reintentar" }).click();
  await waitSaved();
  log("save error shown, retry saved:", await status());

  // 99 → 100 → 101 cards
  const g = await (await page.request.get(`${BASE}/api/games/${gameId}`)).json();
  const blank = (i) => ({ ...g.items[1], id: undefined, text: `carta ${i}`, question: { ...g.items[1].question, id: undefined } });
  const items99 = [...g.items, ...Array.from({ length: 97 }, (_, i) => blank(i + 3))];
  let r = await page.request.put(`${BASE}/api/games/${gameId}`, { data: { ...g, items: items99 } });
  assert(r.ok(), `99 cards saved (${r.status()})`);
  r = await page.request.put(`${BASE}/api/games/${gameId}`, { data: { ...g, items: [...items99, blank(100), blank(101)] } });
  assert(r.status() === 400, `101 cards refused by the server (${r.status()})`);
  await page.reload();
  await page.getByText("99 de 100").waitFor();
  await page.getByRole("button", { name: /\+ Añadir tarjeta/ }).click();
  await page.getByText("100 de 100").waitFor();
  assert(await page.getByRole("button", { name: /\+ Añadir tarjeta/ }).isDisabled(), "add disabled at 100");
  assert(await page.getByRole("button", { name: "Duplicar (1)" }).isDisabled(), "duplicate disabled at 100");
  await waitSaved();
  const saved = await (await page.request.get(`${BASE}/api/games/${gameId}`)).json();
  assert(saved.items.length === 100, `100 cards stored (${saved.items.length})`);
  log("99 ok, 100 ok (add/duplicate disabled), 101 refused");

  // Small screen: both faces stacked in the card, no sideways scroll
  const phone = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, locale: "es-MX", storageState: await ctx.storageState() });
  const m = await phone.newPage();
  await m.goto(editUrl);
  await m.locator("ol > li").first().waitFor();
  const overflow = await m.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  assert(overflow <= 1, `no horizontal scroll on a phone (${overflow}px)`);
  await m.locator("ol > li").first().getByRole("textbox", { name: "Reverso: Texto" }).fill("rojo");
  await m.waitForFunction(() => /Guardado|Saved/.test(document.querySelector("[data-testid=save-status]")?.textContent ?? ""), null, { timeout: 15000 });
  if (SHOTS) await m.screenshot({ path: path.join(SHOTS, "f05-phone.png") });
  await phone.close();
  log("phone: stacked faces, edited and saved");

  log("ALL FLASHCARD CHECKS PASSED");
} catch (e) {
  await shot(page, "f99-failure");
  console.error("FAILED:", e.message);
  process.exitCode = 1;
} finally {
  await browser.close();
}
