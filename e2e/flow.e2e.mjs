// End-to-end test of the section 19 flow in real Chromium with a fake microphone that plays
// a generated Spanish voice ("Es un perro.", espeak-ng es-419, repeating every ~6.5 s) through the real capture → VAD → WAV → /api/stt path.
// Recognition text comes from the scripted test recognizer (no cloud keys in CI).
// Run: BASE_URL=http://localhost:3100 node e2e/flow.e2e.mjs
import { chromium } from "playwright";
import { writeFileSync } from "node:fs";
import path from "node:path";

const BASE = process.env.BASE_URL ?? "http://localhost:3100";
const SCRIPT = process.env.E2E_STT_SCRIPT_FILE;
const fx = (f) => path.resolve("e2e/fixtures", f);
const stamp = Date.now();
const email = `teacher${stamp}@school.test`;
const log = (...a) => console.log("•", ...a);
const SHOTS = process.env.SCREENSHOTS; // optional folder for screenshots of each step
const shot = async (p, name) => SHOTS && p.screenshot({ path: path.join(SHOTS, `${name}.png`) });

function script(items) {
  writeFileSync(SCRIPT, JSON.stringify(items));
}

const browser = await chromium.launch({
  args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream", `--use-file-for-fake-audio-capture=${fx("answer.wav")}`, "--autoplay-policy=no-user-gesture-required"],
});
const ctx = await browser.newContext({ permissions: ["microphone"], viewport: { width: 1366, height: 768 } }); // Chromebook size
const page = await ctx.newPage();
page.on("pageerror", (e) => console.error("PAGE ERROR", e.message));

try {
  await page.goto(BASE);
  await shot(page, "01-home");
  // 1. Teacher account
  await page.goto(`${BASE}/signup`);
  await page.fill("#displayName", "Ana Rivera");
  await page.fill("#schoolName", "Lincoln Elementary");
  await page.fill("#email", email);
  await page.fill("#password", "correct-horse-42");
  await page.click("button[type=submit]");
  await page.waitForURL(`${BASE}/teacher`);
  log("teacher signed up");

  // 2. Class, level LE2, Group A, student in that group
  await page.goto(`${BASE}/teacher/classes`);
  await page.fill("#name", "Spanish 2nd grade");
  await page.click("text=Create class");
  await page.click("text=Spanish 2nd grade");
  await page.waitForURL(/\/teacher\/classes\/.+/);
  const classUrl = page.url();
  const code = (await page.locator("span.font-mono").first().textContent()).trim();
  await page.fill('input[aria-label="New level"]', "LE2");
  await page.click("text=Add level");
  await page.fill('input[aria-label="New group in LE2"]', "Group A");
  await page.click("text=Add group");
  await page.waitForSelector("text=Group A");
  await page.fill('input[aria-label="First name"]', "Diego");
  await page.fill('input[aria-label="Last initial"]', "P");
  await page.selectOption('select[aria-label="Group"]', { label: "LE2 · Group A" });
  await page.click("text=Add student");
  const pinText = await page.locator("[role=status]:has-text('Diego') .font-mono").textContent();
  const pin = pinText.trim();
  log("class", code, "student PIN", pin);
  // A second student in another group must NOT see the activity
  await page.fill('input[aria-label="New level"]', "UE1");
  await page.click("text=Add level");
  await page.fill('input[aria-label="New group in UE1"]', "Group B");
  await page.locator("form:has(input[aria-label='New group in UE1']) button").click();
  await page.waitForSelector("text=Group B");
  await page.fill('input[aria-label="First name"]', "Sofía");
  await page.selectOption('select[aria-label="Group"]', { label: "UE1 · Group B" });
  await page.click("text=Add student");
  const pin2 = (await page.locator("[role=status]:has-text('Sofía') .font-mono").textContent()).trim();

  // 3. Create game: Speak & Answer
  await page.goto(`${BASE}/teacher/games/new`);
  await page.click("button[value=SPEAK_AND_ANSWER]");
  await page.waitForURL(/\/edit$/);
  const editUrl = page.url();
  const gameId = editUrl.split("/").at(-2);
  await page.getByLabel("Activity title").fill("Los animales");

  // Question typed with the Spanish character bar (US keyboard): "¿Qué animal es?"
  const q1 = page.locator("section[aria-label='Question 1']");
  const qInput = q1.locator("input[placeholder='¿Qué animal es?']");
  await qInput.click();
  await page.locator("[role=toolbar] button[aria-label='Insert ¿']").first().click();
  await qInput.pressSequentially("Qu");
  await qInput.press("Alt+e"); // keyboard shortcut → é
  await qInput.pressSequentially(" animal es?");
  const typed = await qInput.inputValue();
  if (typed !== "¿Qué animal es?") throw new Error(`Character bar/shortcut produced "${typed}"`);
  log("typed with char bar + Alt shortcut:", typed);
  await q1.locator("input[placeholder='Es un perro.']").fill("Es un perro.");
  await q1.locator("input[type=file]").setInputFiles(fx("dog.png"));
  await q1.locator("img").waitFor();

  // Spell checker suggestion: Hint "El nino esta feliz" → accept
  const hint = q1.locator("input[placeholder='Hace “guau, guau”.']");
  await hint.fill("El nino esta feliz");
  await q1.locator("button:text('Check spelling')").last().click();
  await q1.locator("button:text-is('Accept')").first().waitFor();
  while (await q1.locator("button:text-is('Accept')").count()) await q1.locator("button:text-is('Accept')").first().click();
  const fixed = await hint.inputValue();
  if (fixed !== "El niño está feliz.") throw new Error(`Spell suggestions produced "${fixed}"`);
  await hint.fill("Hace guau, guau.");
  log("spell suggestions accepted:", fixed);

  // Question 2: cat
  await page.click("text=+ Add question");
  const q2 = page.locator("section[aria-label='Question 2']");
  await q2.locator("input[placeholder='¿Qué animal es?']").fill("¿Qué animal es?");
  await q2.locator("input[placeholder='Es un perro.']").fill("Es un gato.");
  await q2.locator("input[placeholder='Hace “guau, guau”.']").fill("Hace miau.");
  await q2.locator("input[type=file]").setInputFiles(fx("cat.png"));
  await q2.locator("img").waitFor();

  // Generate Audio (no TTS key configured in CI → browser-voice preview path is offered)
  const audioCtl = q1.locator("text=/Generate audio|Preview \\(browser voice\\)/").first();
  log("audio control:", await audioCtl.textContent());

  await page.waitForSelector("text=All changes saved", { timeout: 15000 });
  await page.evaluate(() => window.scrollTo(0, 0));
  await shot(page, "02-game-editor");
  await page.click("text=Publish");
  await page.waitForSelector("a:text('Assign')", { timeout: 20000 });
  log("published");

  // 4. Assign to LE2 Group A
  await page.click("a:text('Assign')");
  await page.waitForURL(/assignments\/new/);
  await page.check("label:has-text('LE2 Group A') input");
  await page.click("text=Assign activity");
  await page.waitForURL(/\/teacher\/assignments\/(?!new)[^/?]+$/);
  const resultsUrl = page.url();
  log("assigned →", resultsUrl);

  // 5. Student signs in with class code + PIN and finds it
  const sctx = await browser.newContext({ permissions: ["microphone"], viewport: { width: 1366, height: 768 } });
  const s = await sctx.newPage();
  s.on("pageerror", (e) => console.error("STUDENT PAGE ERROR", e.message));
  s.on("console", (m) => m.type() === "error" && console.error("console:", m.text()));
  await s.goto(`${BASE}/student`);
  await s.fill("#code", code);
  await s.click("text=Next");
  await s.click("button:has-text('Diego')");
  for (const d of pin) await s.click(`button:text-is('${d}')`);
  await s.click("text=Go!");
  await s.waitForURL(`${BASE}/learn`);
  await s.waitForSelector("text=Los animales");
  log("student sees the activity");
  await shot(s, "03-student-portal");

  // 6. Play. Q1: says "Es un perro" → CORRECT, automatic advance.
  //    Q2: first says "es un perro" (wrong) → hint → then "un gato" → CORRECT (guided).
  script([{ text: "Es un perro", confidence: 0.92 }, { text: "es un perro", confidence: 0.9 }, { text: "un gato", confidence: 0.88 }]);
  await s.click("text=Los animales");
  await s.waitForURL(/\/play\//);
  await s.click("text=🎤 Start");
  await s.waitForSelector("text=Te escucho", { timeout: 15000 });
  log("microphone open, listening without any click");
  await shot(s, "04-student-activity");
  await s.waitForSelector("text=/¡Muy bien!|¡Lo lograste!|¡Excelente!|¡Así se dice!|¡Perfecto!/", { timeout: 40000 });
  log("Q1 correct");
  await s.waitForSelector("text=Hace miau.", { timeout: 60000 });
  log("Q2 wrong answer → hint shown");
  await s.waitForSelector("text=¡Terminaste!", { timeout: 60000 });
  const summary = await s.locator("main").textContent();
  log("finished:", summary.replace(/\s+/g, " ").trim());
  if (!summary.includes("1 of 2 on your own")) throw new Error("Expected 1 of 2 independent");

  // 7. Teacher sees real results
  await page.goto(resultsUrl);
  await page.waitForSelector("tr:has-text('Diego') >> text=completed");
  const row = (await page.locator("tr:has-text('Diego')").textContent()).replace(/\s+/g, " ");
  await shot(page, "05-teacher-results");
  log("teacher results row:", row);
  if (!row.includes("1/2")) throw new Error("Results should show 1/2 independent");
  if (!/Diego P\.completed1\/2 \(50%\)1/.test(row)) throw new Error("Expected 1 independent and 1 guided");

  // 8. Permissions: Sofía (other group) must not see or open it
  const o = await browser.newContext();
  const op = await o.newPage();
  await op.goto(`${BASE}/student/${code}`);
  await op.click("button:has-text('Sofía')");
  for (const d of pin2) await op.click(`button:text-is('${d}')`);
  await op.click("text=Go!");
  await op.waitForURL(`${BASE}/learn`);
  if (await op.locator("text=Los animales").count()) throw new Error("Student from another group can see the activity");
  const direct = await op.goto(resultsUrl.replace("/teacher/assignments/", "/play/"));
  if (direct.status() !== 404) throw new Error(`Other student opening the assignment got ${direct.status()}`);
  const api = await op.request.get(`${BASE}/api/games/${gameId}`);
  if (api.status() !== 401) throw new Error(`Student calling teacher API got ${api.status()}`);
  log("permissions: other group blocked (404), teacher API blocked for students (401)");

  // 9. Another school's teacher cannot read this school's game, results or images
  const other = await browser.newContext();
  const t2 = await other.newPage();
  await t2.goto(`${BASE}/signup`);
  await t2.fill("#displayName", "Other Teacher");
  await t2.fill("#schoolName", "Other School");
  await t2.fill("#email", `other${stamp}@school.test`);
  await t2.fill("#password", "another-pass-99");
  await t2.click("button[type=submit]");
  await t2.waitForURL(`${BASE}/teacher`);
  const g2 = await t2.request.get(`${BASE}/api/games/${gameId}`);
  const r2 = await t2.goto(resultsUrl);
  const imgs = await t2.request.get(`${BASE}/api/media`);
  if (g2.status() !== 404 || r2.status() !== 404 || (await imgs.json()).assets.length !== 0) throw new Error("Cross-school data leak");
  log("permissions: other school cannot see game (404), results (404) or media library (empty)");

  // 10. Teacher preview renders with the diagnostics panel
  await page.goto(`${BASE}/teacher/games/${gameId}/preview`);
  await page.waitForSelector("text=Teacher preview — answers are not saved");
  await page.waitForSelector("text=Teacher diagnostics");
  await shot(page, "06-teacher-preview");
  log("teacher preview + diagnostics panel render");

  console.log("\nE2E PASSED");
} catch (e) {
  console.error("\nE2E FAILED:", e.message);
  await page.screenshot({ path: "e2e/failure-teacher.png", fullPage: true }).catch(() => {});
  for (const p of browser.contexts().flatMap((c) => c.pages())) await p.screenshot({ path: `e2e/failure-${Math.random().toString(36).slice(2, 6)}.png` }).catch(() => {});
  process.exitCode = 1;
} finally {
  await browser.close();
}
