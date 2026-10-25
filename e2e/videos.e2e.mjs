// End-to-end test of the video library (phase 2) in real Chromium:
// upload a WebM with subtitles, reject a fake file, save a YouTube link, build a collection,
// assign a video to a group, student watches (progress + resume), "Watch & Practice" with the
// fake microphone, and the teacher sees watching + practice results.
// Run: BASE_URL=http://localhost:3100 node e2e/videos.e2e.mjs  (server started with E2E_SCRIPTED_STT=1)
import { chromium } from "playwright";
import { writeFileSync } from "node:fs";
import path from "node:path";

const BASE = process.env.BASE_URL ?? "http://localhost:3100";
const SCRIPT = process.env.E2E_STT_SCRIPT_FILE;
const fx = (f) => path.resolve("e2e/fixtures", f);
const stamp = Date.now();
const log = (...a) => console.log("•", ...a);
const SHOTS = process.env.SCREENSHOTS;
const shot = async (p, name) => SHOTS && p.screenshot({ path: path.join(SHOTS, `${name}.png`) });

const browser = await chromium.launch({
  args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream", `--use-file-for-fake-audio-capture=${fx("answer.wav")}`, "--autoplay-policy=no-user-gesture-required"],
});
const ctx = await browser.newContext({ permissions: ["microphone"], viewport: { width: 1366, height: 768 } });
const page = await ctx.newPage();
page.on("pageerror", (e) => console.error("PAGE ERROR", e.message));

try {
  // 1. Teacher, class, LE2 Group A, one student
  await page.goto(`${BASE}/signup`);
  await page.fill("#displayName", "Ana Rivera");
  await page.fill("#schoolName", "Lincoln Elementary");
  await page.fill("#email", `video${stamp}@school.test`);
  await page.fill("#password", "correct-horse-42");
  await page.click("button[type=submit]");
  await page.waitForURL(`${BASE}/teacher`);
  await page.goto(`${BASE}/teacher/classes`);
  await page.fill("#name", "Spanish 2nd grade");
  await page.click("text=Create class");
  await page.click("text=Spanish 2nd grade");
  await page.waitForURL(/\/teacher\/classes\/.+/);
  const code = (await page.locator("span.font-mono").first().textContent()).trim();
  await page.fill('input[aria-label="New level"]', "LE2");
  await page.click("text=Add level");
  await page.fill('input[aria-label="New group in LE2"]', "Group A");
  await page.click("text=Add group");
  await page.waitForSelector("text=Group A");
  await page.fill('input[aria-label="First name"]', "Diego");
  await page.selectOption('select[aria-label="Group"]', { label: "LE2 · Group A" });
  await page.click("text=Add student");
  const pin = (await page.locator("[role=status]:has-text('Diego') .font-mono").textContent()).trim();
  log("class", code, "PIN", pin);

  // 2. Practice game (one question) for Watch & Practice
  await page.goto(`${BASE}/teacher/games/new`);
  await page.click("button[value=SPEAK_AND_ANSWER]");
  await page.waitForURL(/\/edit$/);
  await page.getByLabel("Activity title").fill("Practica: el perro");
  const q1 = page.locator("section[aria-label='Question 1']");
  await q1.locator("input[placeholder='¿Qué animal es?']").fill("¿Qué animal es?");
  await q1.locator("input[placeholder='Es un perro.']").fill("Es un perro.");
  await q1.locator("input[type=file]").setInputFiles(fx("dog.png"));
  await q1.locator("img").waitFor();
  await page.waitForSelector("text=All changes saved", { timeout: 15000 });
  await page.click("text=Publish");
  await page.waitForSelector("a:text('Assign')", { timeout: 20000 });
  log("practice game published");

  // 3. Upload: a fake ".mp4" is rejected by content sniffing
  await page.goto(`${BASE}/teacher/videos/new`);
  const fileInput = page.locator("input[type=file][accept^='video']");
  await fileInput.setInputFiles(fx("fake.mp4"));
  await page.waitForSelector("text=Only MP4 or WebM videos are allowed", { timeout: 10000 });
  log("fake video file rejected");

  // Real WebM + WebVTT subtitles + practice game → publish
  await fileInput.setInputFiles(fx("clip.webm"));
  await page.waitForSelector("video[src^='/api/media/']", { timeout: 20000 });
  await page.getByLabel("Title", { exact: true }).fill("El perro y el gato");
  await page.locator("input[type=file][accept^='.vtt']").setInputFiles(fx("captions.vtt"));
  await page.waitForSelector("text=captions.vtt", { timeout: 10000 });
  await page.fill("#lvl", "LE2");
  await page.fill("#kw", "animales, perro");
  await page.selectOption("#pg", { label: "Practica: el perro" });
  await page.waitForFunction(() => Number(document.querySelector("#dur")?.value) > 0, null, { timeout: 10000 });
  await shot(page, "v01-video-form");
  await page.click("button:text-is('Publish')");
  await page.waitForURL(`${BASE}/teacher/videos`);
  const assignHref = await page.locator("a:text-is('Assign')").first().getAttribute("href");
  const videoId = new URL(assignHref, BASE).searchParams.get("videoId");
  log("hosted video published", videoId);

  // Streaming with HTTP ranges (seeking needs 206 Partial Content)
  const watchPage = await page.goto(`${BASE}/teacher/videos/${videoId}`);
  if (watchPage.status() !== 200) throw new Error("Teacher watch page failed");
  const src = await page.locator("video").getAttribute("src");
  const range = await page.request.get(`${BASE}${src}`, { headers: { Range: "bytes=0-99" } });
  if (range.status() !== 206 || (await range.body()).length !== 100) throw new Error(`Range request got ${range.status()}`);
  const track = await page.locator("video track").getAttribute("src");
  if (!track) throw new Error("Subtitles track missing");
  log("range streaming 206 ok, subtitles track present");

  // 4. YouTube link: invalid link refused, valid one saved as a draft
  await page.goto(`${BASE}/teacher/videos/new`);
  await page.click("button[role=tab]:text('YouTube link')");
  await page.getByLabel("Title", { exact: true }).fill("Canción de los colores");
  await page.fill("#yt", "https://example.com/watch?v=nothing");
  await page.click("button:text-is('Save draft')");
  await page.waitForSelector("text=doesn't look like a YouTube link");
  await page.fill("#yt", "https://www.youtube.com/watch?v=M7lc1UVf-VE");
  await page.click("button:text-is('Save draft')");
  await page.waitForURL(`${BASE}/teacher/videos`);
  await page.waitForSelector("text=Canción de los colores");
  if (!(await page.locator("li:has-text('Canción de los colores') >> text=/draft/i").count())) throw new Error("YouTube video should be a draft");
  log("YouTube link saved as draft (invalid link refused)");
  await shot(page, "v02-video-library");

  // 5. Collection with the hosted video
  await page.goto(`${BASE}/teacher/videos/collections`);
  await page.fill('input[aria-label="Collection title"]', "Unidad 1: Animales");
  await page.click("text=Create collection");
  await page.waitForURL(/collections\/.+/);
  await page.selectOption('select[aria-label="Video to add"]', { label: "El perro y el gato" });
  await page.click("button:text-is('Add')");
  await page.waitForSelector("a:text('Assign collection')");
  log("collection created with 1 video");

  // 6. Assign the video to LE2 Group A
  await page.goto(`${BASE}${assignHref}`);
  await page.check("label:has-text('LE2 Group A') input");
  await page.click("text=Assign activity");
  await page.waitForURL(/\/teacher\/assignments\/(?!new)[^/?]+$/);
  const resultsUrl = page.url();
  log("video assigned →", resultsUrl);

  // Unauthenticated progress writes are refused
  const anon = await (await browser.newContext()).request.post(`${BASE}/api/videos/${videoId}/progress`, { data: { positionSec: 1, durationSec: 12, watchedDeltaSec: 1 } });
  if (anon.status() !== 401) throw new Error(`Anonymous progress got ${anon.status()}`);

  // 7. Student watches part of it, leaves, comes back and resumes
  const sctx = await browser.newContext({ permissions: ["microphone"], viewport: { width: 1366, height: 768 } });
  const s = await sctx.newPage();
  s.on("pageerror", (e) => console.error("STUDENT PAGE ERROR", e.message));
  if (process.env.DEBUG_PROGRESS) s.on("request", (r) => r.url().includes("/progress") && console.log("  progress", r.method(), r.postData()));
  await s.goto(`${BASE}/student/${code}`);
  await s.click("button:has-text('Diego')");
  for (const d of pin) await s.click(`button:text-is('${d}')`);
  await s.click("text=Go!");
  await s.waitForURL(`${BASE}/learn`);
  await s.click("nav >> text=My Videos");
  await s.waitForSelector("text=El perro y el gato");
  await s.click("text=El perro y el gato");
  await s.waitForURL(/\/learn\/videos\/.+\/.+/);
  await s.evaluate(() => { const v = document.querySelector("video"); v.muted = true; return v.play(); });
  await s.waitForFunction(() => document.querySelector("video").currentTime > 6, null, { timeout: 20000 });
  await s.evaluate(() => document.querySelector("video").pause());
  await s.waitForTimeout(800);
  await shot(s, "v03-student-watch");
  await s.reload();
  await s.waitForSelector("text=Continuing from", { timeout: 10000 });
  log("resume offered after reload");

  // Watch to the end (seeking ahead would not count, so it plays at 1.25×)
  await s.getByLabel("Speed").selectOption("1.25");
  await s.evaluate(() => { const v = document.querySelector("video"); v.muted = true; return v.play(); });
  await s.waitForSelector("text=Terminaste el video", { timeout: 30000 });
  log("video finished, Watch & Practice offered");

  // 8. Practice out loud with the microphone
  writeFileSync(SCRIPT, JSON.stringify([{ text: "Es un perro", confidence: 0.92 }]));
  await s.click("text=¡A practicar!");
  await s.waitForURL(/\/play\/.+\?video=/);
  await s.click("text=🎤 Start");
  await s.waitForSelector("text=¡Terminaste!", { timeout: 60000 });
  log("practice game finished");

  // 9. Teacher results: watched + practice
  await page.goto(resultsUrl);
  const row = (await page.locator("tr:has-text('Diego')").textContent()).replace(/\s+/g, " ");
  await shot(page, "v04-video-results");
  log("teacher row:", row);
  if (!/Watched(?! \d)/.test(row) || !row.includes("1/1 independent")) throw new Error("Results should show watched + 1/1 practice");

  console.log("\nVIDEO E2E PASSED");
} catch (e) {
  console.error("\nVIDEO E2E FAILED:", e.message);
  for (const p of browser.contexts().flatMap((c) => c.pages())) await p.screenshot({ path: `e2e/failure-v-${Math.random().toString(36).slice(2, 6)}.png` }).catch(() => {});
  process.exitCode = 1;
} finally {
  await browser.close();
}
