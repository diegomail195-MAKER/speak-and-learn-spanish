// End-to-end test of natural voice audio (real Chromium, server started with TTS_PROVIDER=test,
// which returns a short tone per text and logs every synthesis to E2E_TTS_LOG):
//  1. Flashcards editor: the "Audio" button on each face opens the panel; words that differ from
//     the visible text, language, voice (with a sample), speed, activity default; front and back
//     configured separately; changing the speed regenerates, going back reuses the cache;
//     duplicate keeps the audio. A word, a question and a sentence in Spanish, English and French.
//  2. Game: the front plays by itself after Start, the back when the card flips, the previous
//     clip stops when the card changes; saved audio survives a reload; autoplay off → only on
//     Listen; a browser that blocks autoplay gets the "Escuchar" button.
//  3. Open the Box / Spin the Wheel / Spell the Word use the same audio at their own moment.
//  4. Student view on a computer and on a phone.
// Run: BASE_URL=http://localhost:3100 E2E_TTS_LOG=/tmp/tts.log node e2e/voice.e2e.mjs
// (server: TTS_PROVIDER=test E2E_TTS_LOG=/tmp/tts.log; needs DATABASE_URL here too)
import { chromium, devices } from "playwright";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import prismaPkg from "@prisma/client";

const { PrismaClient } = prismaPkg;
const db = new PrismaClient();
const BASE = process.env.BASE_URL ?? "http://localhost:3100";
const TTS_LOG = process.env.E2E_TTS_LOG;
const SHOTS = process.env.SCREENSHOTS;
const stamp = Date.now();
const log = (...a) => console.log("•", ...a);
const shot = async (p, name) => SHOTS && p.screenshot({ path: path.join(SHOTS, `${name}.png`) });
const assert = (c, m) => {
  if (!c) throw new Error(m);
};
const ttsLog = () => (TTS_LOG && existsSync(TTS_LOG) ? readFileSync(TTS_LOG, "utf8").trim().split("\n").filter(Boolean).map((l) => JSON.parse(l)) : []);
if (TTS_LOG) writeFileSync(TTS_LOG, "");

// Records every clip the page plays (and stops). Optionally refuses clips that don't start from
// a real tap/keypress, like a browser with a strict autoplay policy.
const INIT = () => {
  window.__played = [];
  window.__paused = 0;
  window.__spoken = [];
  let gesture = 0;
  for (const ev of ["pointerdown", "keydown"]) addEventListener(ev, (e) => e.isTrusted && (gesture = Date.now()), true);
  HTMLMediaElement.prototype.play = function () {
    const src = this.src || "";
    if (src.startsWith("data:")) return Promise.resolve(); // the unlock clip
    if (window.__block && Date.now() - gesture > 1000) return Promise.reject(new DOMException("blocked", "NotAllowedError"));
    window.__played.push(src.replace(location.origin, ""));
    clearTimeout(this.__t);
    this.__t = setTimeout(() => this.onended && this.onended(), 120);
    return Promise.resolve();
  };
  HTMLMediaElement.prototype.pause = function () {
    window.__paused++;
    clearTimeout(this.__t);
  };
  Object.defineProperty(HTMLMediaElement.prototype, "paused", { get: () => true });
  const voices = ["es-MX", "en-US", "fr-FR"].map((lang) => ({ name: `T ${lang}`, lang, localService: true, default: false, voiceURI: lang }));
  window.SpeechSynthesisUtterance = class {
    constructor(text) {
      this.text = text;
    }
  };
  Object.defineProperty(window, "speechSynthesis", {
    value: { getVoices: () => voices, addEventListener() {}, cancel() {}, speak: (u) => (u.text && window.__spoken.push(u.text), setTimeout(() => u.onend?.(), 30)) },
  });
};

const browser = await chromium.launch({ args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream", `--use-file-for-fake-audio-capture=${path.resolve("e2e/fixtures/answer.wav")}`] });
const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 }, permissions: ["microphone"] });
await ctx.addInitScript(INIT);
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("dialog", (d) => d.accept());
const played = (p = page) => p.evaluate(() => window.__played.slice());
const clearPlayed = (p = page) => p.evaluate(() => (window.__played = []));
const waitSaved = () => page.waitForFunction(() => /Saved|Guardado/.test(document.querySelector("[data-testid=save-status]")?.textContent ?? ""), null, { timeout: 15000 });
const getGame = async (id) => (await page.request.get(`${BASE}/api/games/${id}`)).json();
const putGame = async (g) => {
  const r = await page.request.put(`${BASE}/api/games/${g.id}`, { data: g });
  assert(r.ok(), `save game ${r.status()} ${await r.text()}`);
};
const tts = async (text, language, voice, rate = 0.95) => {
  const r = await page.request.post(`${BASE}/api/tts`, { data: { text, language, voice, rate } });
  assert(r.ok(), `tts ${r.status()} ${await r.text()}`);
  return r.json();
};

try {
  // ── Teacher ──
  const email = `voice${stamp}@school.test`;
  await page.goto(`${BASE}/signup`);
  await page.fill("#displayName", "Ana Rivera");
  await page.fill("#schoolName", "Colegio Voces");
  await page.fill("#email", email);
  await page.fill("#password", "correct-horse-42");
  await page.click("button[type=submit]");
  await page.waitForURL(`${BASE}/teacher`);

  const cfg = await (await page.request.get(`${BASE}/api/tts`)).json();
  assert(cfg.provider === "test", `test voice provider (${cfg.provider})`);
  for (const l of ["es-419", "en-US", "fr-FR"]) assert(cfg.voices.some((v) => v.language === l && v.recommended), `a recommended ${l} voice`);
  log("voice service:", cfg.voices.length, "voices in", cfg.languages.length, "languages");

  // ── 1. Flashcards editor: Audio panel per face ──
  await page.goto(`${BASE}/teacher/games/new`);
  await page.click("button[value=FLASHCARDS]");
  await page.waitForURL(/\/edit$/);
  const gameId = page.url().split("/").at(-2);
  await page.getByRole("button", { name: "EN", exact: true }).click();
  await page.getByLabel("Activity Title").fill("Colores · Colors · Couleurs");
  const row1 = page.locator("ol > li").first();
  // A picture-only front that says "red"
  await row1.getByRole("button", { name: "Audio (Front)", exact: true }).click();
  let panel = page.getByTestId("audio-panel");
  await panel.getByTestId("tts-text").fill("red");
  await panel.getByTestId("tts-language").selectOption("en-US");
  const enVoices = cfg.voices.filter((v) => v.language === "en-US");
  const second = enVoices.find((v) => !v.recommended);
  await panel.getByRole("button", { name: `Play a sample: ${second.label}` }).click();
  await page.waitForFunction(() => window.__played.some((u) => u.startsWith("/api/media/")));
  await panel.getByRole("radio", { name: new RegExp(second.label) }).check();
  await panel.getByRole("radio", { name: "Slow" }).click();
  await panel.getByText("Use this language, voice and speed as the activity's default").click();
  await clearPlayed();
  await panel.getByTestId("tts-listen").click();
  await page.waitForFunction(() => window.__played.length > 0);
  await shot(page, "v01-audio-panel");
  await panel.getByTestId("audio-save").click();
  await panel.waitFor({ state: "detached" });
  // The back says "rojo", in Spanish, configured separately
  await row1.getByRole("button", { name: "Audio (Back)", exact: true }).click();
  panel = page.getByTestId("audio-panel");
  await panel.getByTestId("tts-text").fill("rojo");
  await panel.getByTestId("tts-language").selectOption("es-419");
  await panel.getByTestId("audio-save").click();
  await panel.waitFor({ state: "detached" });
  await waitSaved();
  let g = await getGame(gameId);
  let a = g.items[0].data.audio;
  const b = g.items[0].data.back.audio;
  assert(a.text === "red" && a.language === "en-US" && a.voice === second.id && a.rate === 0.8 && a.source === "tts" && a.mediaId, `front audio ${JSON.stringify(a)}`);
  assert(b.text === "rojo" && b.language === "es-419" && b.mediaId && b.mediaId !== a.mediaId, `back audio ${JSON.stringify(b)}`);
  assert(g.settings.voices?.["en-US"] === second.id && g.settings.rate === 0.8, `activity default saved ${JSON.stringify(g.settings)}`);
  log("front says 'red' (EN, chosen voice, slow), back says 'rojo' (ES); default saved for the activity");

  // Changing the speed regenerates; going back reuses the cached audio (no new synthesis)
  const n0 = ttsLog().length;
  await row1.getByRole("button", { name: "Replace: Audio (Front)" }).click();
  panel = page.getByTestId("audio-panel");
  await panel.getByRole("radio", { name: "Normal" }).click();
  await panel.getByText(/You changed the text, voice or speed/).waitFor();
  await panel.getByTestId("audio-save").click();
  await panel.waitFor({ state: "detached" });
  await waitSaved();
  g = await getGame(gameId);
  assert(g.items[0].data.audio.mediaId !== a.mediaId && g.items[0].data.audio.rate === 1, `new audio at normal speed ${JSON.stringify(g.items[0].data.audio)} was ${JSON.stringify(a)}`);
  assert(ttsLog().length === n0 + 1, "one new synthesis");
  await row1.getByRole("button", { name: "Replace: Audio (Front)" }).click();
  panel = page.getByTestId("audio-panel");
  await panel.getByRole("radio", { name: "Slow" }).click();
  await panel.getByTestId("audio-save").click();
  await panel.waitFor({ state: "detached" });
  await waitSaved();
  g = await getGame(gameId);
  assert(g.items[0].data.audio.mediaId === a.mediaId, "back to slow: the first audio again");
  assert(ttsLog().length === n0 + 1, "reused from the cache, not generated again");
  log("speed change regenerates; same text+voice+speed reuses the cache");

  // ── A word, a question and a sentence in three languages ──
  const LINES = [
    ["pingüino", "es-419"], ["¿Cuál es tu color favorito?", "es-419"], ["En el parque hay dieciséis pájaros.", "es-419"],
    ["apple", "en-US"], ["What is your favorite color?", "en-US"], ["We are going to read a story together.", "en-US"],
    ["écureuil", "fr-FR"], ["Comment tu t'appelles ?", "fr-FR"], ["Le chat dort sur le canapé.", "fr-FR"],
  ];
  const tpl = g.items[0];
  const extra = [];
  for (const [text, language] of LINES) {
    const r = await tts(text, language);
    const again = await tts(text, language);
    assert(again.cached && again.mediaId === r.mediaId, `cached on the second request: ${text}`);
    extra.push({ ...tpl, id: undefined, key: undefined, text, imageAssetId: null, data: { audio: { mediaId: r.mediaId, text, language, voice: null, rate: 0.95, source: "tts" }, back: { text: language, audio: null } } });
  }
  const sent = ttsLog().filter((l) => LINES.some(([t]) => t === l.text));
  assert(sent.length === LINES.length, `each line synthesized once (${sent.length})`);
  assert(sent.some((l) => l.text === "¿Cuál es tu color favorito?") && sent.some((l) => l.text === "Comment tu t'appelles ?"), "accents and punctuation kept");
  g.items = [g.items[0], ...extra];
  await putGame(g);
  log("9 lines (word, question, sentence × ES/EN/FR): generated once, then served from the cache");

  // Duplicate keeps the audio of both faces
  await page.reload();
  await page.getByRole("button", { name: "EN", exact: true }).click();
  await page.getByText("10 of 100").first().waitFor();
  await page.locator("ol > li").first().getByRole("button", { name: /Duplicate/ }).click();
  await waitSaved();
  g = await getGame(gameId);
  assert(g.items[1].data.audio?.mediaId === g.items[0].data.audio.mediaId && g.items[1].data.back?.audio?.mediaId === g.items[0].data.back.audio.mediaId, "duplicate keeps both audios");
  g.items.splice(1, 1);
  await putGame(g);

  // ── 2. Game ──
  const frontUrl = `/api/media/${g.items[0].data.audio.mediaId}`;
  const backUrl = `/api/media/${g.items[0].data.back.audio.mediaId}`;
  await page.goto(`${BASE}/play/preview/${gameId}`);
  await clearPlayed();
  await page.getByTestId("flashcards-stage").getByRole("button", { name: "Start" }).click();
  await page.waitForFunction((u) => window.__played.includes(u), frontUrl, { timeout: 5000 });
  log("Start: the first card's front plays by itself");
  await page.locator("[data-card]").click();
  await page.waitForFunction((u) => window.__played.includes(u), backUrl, { timeout: 5000 });
  log("flip: the back says its own word");
  const pausedBefore = await page.evaluate(() => window.__paused);
  await page.getByRole("button", { name: "Next card" }).click();
  await page.waitForFunction((u) => window.__played.at(-1) === u, `/api/media/${g.items[1].data.audio.mediaId}`, { timeout: 5000 });
  assert((await page.evaluate(() => window.__paused)) > pausedBefore, "the previous clip is stopped");
  await clearPlayed();
  await page.getByRole("button", { name: "Listen" }).click();
  await page.waitForFunction(() => window.__played.length === 1);
  await shot(page, "v02-game");
  log("next card: previous clip stopped, new one plays; Listen plays again");
  // Saved audio survives closing and reopening
  await page.reload();
  await clearPlayed();
  await page.getByTestId("flashcards-stage").getByRole("button", { name: "Start" }).click();
  await page.waitForFunction((u) => window.__played.includes(u), frontUrl, { timeout: 5000 });
  log("reopened: the saved audio plays");

  // Autoplay off: nothing plays until Listen
  g = await getGame(gameId);
  g.settings.options = { ...(g.settings.options ?? {}), autoplayAudio: false };
  await putGame(g);
  await page.goto(`${BASE}/play/preview/${gameId}`);
  await clearPlayed();
  await page.getByTestId("flashcards-stage").getByRole("button", { name: "Start" }).click();
  await page.waitForTimeout(1200);
  assert((await played()).length === 0, "autoplay off: nothing plays by itself");
  await page.getByRole("button", { name: "Listen" }).click();
  await page.waitForFunction((u) => window.__played.includes(u), frontUrl);
  log("autoplay off: the card waits for Listen");
  g.settings.options.autoplayAudio = true;
  await putGame(g);

  // A browser that blocks autoplay: the Escuchar button appears and plays the clip
  await page.goto(`${BASE}/play/preview/${gameId}`);
  await page.getByTestId("flashcards-stage").getByRole("button", { name: "Start" }).click();
  await page.waitForTimeout(400);
  await page.evaluate(() => (window.__block = true));
  await page.waitForTimeout(1200);
  await clearPlayed();
  await page.evaluate(() => document.querySelector("[aria-label='Next card']").click()); // not a real tap
  await page.getByTestId("audio-blocked").waitFor({ timeout: 5000 });
  assert((await played()).length === 0, "blocked clip not played");
  await page.getByTestId("audio-blocked").click();
  await page.waitForFunction(() => window.__played.length === 1);
  await page.evaluate(() => (window.__block = false));
  log("autoplay blocked: Escuchar button shown, one tap plays it");
  assert(!(await page.evaluate(() => window.__spoken.length)), `no robotic device voice was used (${await page.evaluate(() => window.__spoken.join(" | "))})`);

  // ── 3. Other games: the same audio at their own moment ──
  async function newGame(key, title, items) {
    await page.goto(`${BASE}/teacher/games/new`);
    await page.click(`button[value=${key}]`);
    await page.waitForURL(/\/edit$/);
    const id = page.url().split("/").at(-2);
    const gg = await getGame(id);
    gg.title = title;
    gg.items = items.map((it) => ({
      imageAssetId: null,
      text: it.text ?? "",
      difficulty: 1,
      data: { audio: it.audio },
      question: { prompt: it.prompt ?? "", promptAudioId: null, expectedAnswer: it.answer, accepted: [], hint: "", supportText: "", supportLanguage: "es-419", supportAudioId: null, evaluationMode: it.mode ?? "PHRASE", answerLanguage: null },
    }));
    await putGame(gg);
    return id;
  }
  const clip = async (text, language = "es-419") => ({ mediaId: (await tts(text, language)).mediaId, text, language, voice: null, rate: 0.95, source: "tts" });
  const startVoice = async (id) => {
    await page.goto(`${BASE}/play/preview/${id}`);
    await clearPlayed();
    await page.click("text=🎤 Start");
  };

  const boxAudio = await clip("el gato");
  const boxId = await newGame("OPEN_THE_BOX", "Cajas", [{ text: "", audio: boxAudio, answer: "gato" }, { text: "", audio: await clip("el perro"), answer: "perro" }]);
  await startVoice(boxId);
  await page.waitForTimeout(800);
  assert(!(await played()).includes(`/api/media/${boxAudio.mediaId}`), "box audio waits for the box to open");
  await page.click("button[aria-label='Box 1']");
  await page.waitForFunction((u) => window.__played.includes(u), `/api/media/${boxAudio.mediaId}`, { timeout: 8000 });
  await page.getByTestId("item-listen").waitFor();
  log("Open the Box: the box's audio plays when it opens; Escuchar available");

  const wheelAudio = await clip("amarillo");
  const wheelId = await newGame("SPIN_THE_WHEEL", "Ruleta", [{ text: "Amarillo", audio: wheelAudio, answer: "amarillo" }]);
  await startVoice(wheelId);
  await page.click("button:has-text('Spin!')");
  await page.waitForTimeout(2000);
  assert(!(await played()).includes(`/api/media/${wheelAudio.mediaId}`), "slice audio not before the wheel stops");
  await page.waitForFunction((u) => window.__played.includes(u), `/api/media/${wheelAudio.mediaId}`, { timeout: 8000 });
  log("Spin the Wheel: the slice's audio plays when the wheel stops");

  const spellAudio = await clip("mariposa");
  const spellId = await newGame("SPELL_THE_WORD", "Deletrea", [{ text: "", audio: spellAudio, answer: "mariposa", mode: "LETTERS" }]);
  g = await getGame(spellId);
  g.settings.options = { ...(g.settings.options ?? {}), autoplayAudio: false };
  await putGame(g);
  await startVoice(spellId);
  await page.waitForTimeout(1500);
  assert(!(await played()).includes(`/api/media/${spellAudio.mediaId}`), "Spell, autoplay off: the word waits for the student");
  assert(!(await page.locator("main").textContent()).includes("mariposa"), "the word is not shown before spelling");
  await page.click("button:has-text('Hear the word')");
  await page.waitForFunction((u) => window.__played.includes(u), `/api/media/${spellAudio.mediaId}`, { timeout: 8000 });
  log("Spell the Word: per the setting, the word plays only on Hear the word, never shown");

  // ── 4. Student view: computer and phone ──
  await page.goto(`${BASE}/teacher/classes`);
  await page.fill("#name", "Voces 3");
  await page.click("text=Create class");
  await page.click("text=Voces 3");
  await page.waitForURL(/\/teacher\/classes\/.+/);
  const code = (await page.locator("span.font-mono").first().textContent()).trim();
  const classId = page.url().split("/").at(-1);
  await page.goto(`${BASE}/teacher/classes/${classId}/students/new`);
  await page.fill('input[aria-label="First name"]', "Lucía");
  await page.fill('input[aria-label="Last initial"]', "R");
  await page.click("button:text-is('Add student')");
  const pin = (await page.locator("[role=status]:has-text('Lucía') [data-testid=new-secret]").textContent()).trim();
  await page.goto(`${BASE}/teacher/games/${gameId}/edit`);
  await page.getByRole("button", { name: "EN", exact: true }).click();
  await page.click("button:text-is('Publish')").catch(() => {});
  const pub = await page.request.post(`${BASE}/api/games/${gameId}/publish`);
  assert(pub.ok(), `publish ${pub.status()}`);
  const user = await db.user.findUnique({ where: { email }, include: { teacher: true } });
  const assignment = await db.assignment.create({ data: { schoolId: user.schoolId, teacherId: user.teacher.id, gameId, title: "Colores", recipients: { create: { type: "CLASSROOM", classroomId: classId } } } });

  for (const [label, opts] of [["computer", { viewport: { width: 1280, height: 800 } }], ["phone", { ...devices["iPhone 13"] }]]) {
    const sctx = await browser.newContext({ ...opts, permissions: ["microphone"] });
    await sctx.addInitScript(INIT);
    const s = await sctx.newPage();
    s.on("pageerror", (e) => errors.push(`${label}: ${e.message}`));
    await s.goto(`${BASE}/student/${code}`);
    await s.click("button:has-text('Lucía')");
    for (const d of pin) await s.click(`button:text-is('${d}')`);
    await s.click("text=Go!");
    await s.waitForURL(`${BASE}/learn`);
    await s.goto(`${BASE}/play/${assignment.id}`);
    await s.getByTestId("flashcards-stage").getByRole("button", { name: "Start" }).click();
    await s.waitForFunction((u) => window.__played.includes(u), frontUrl, { timeout: 8000 });
    if (label === "phone") await s.locator("[data-card]").tap();
    else await s.locator("[data-card]").click();
    await s.waitForFunction((u) => window.__played.includes(u), backUrl, { timeout: 8000 });
    await shot(s, `v03-student-${label}`);
    log(`student on a ${label}: front plays at the start, back on flip`);
    await sctx.close();
  }

  assert(errors.length === 0, `page errors: ${errors.join(" | ")}`);
  console.log("\nVOICE E2E PASSED");
} catch (e) {
  console.error("\nVOICE E2E FAILED:", e.message);
  await shot(page, "v-fail");
  process.exitCode = 1;
} finally {
  await browser.close();
  await db.$disconnect();
}
