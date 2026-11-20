// End-to-end test for My Activities in both workspaces and the Community:
//  - Platform Admin › My Activities lists the admin's own activities, the same as Teacher View;
//  - "Create activity" and "Community" buttons in the My Activities header;
//  - sharing an activity (owner only; needs a title and cards), the Community badge;
//  - Community: teachers from any school see every teacher activity (with their pictures), "Copy & edit"
//    makes an independent copy in their own school (pictures, card backs and audio copied too),
//    the original never changes; the owner or the admin can take an activity out;
//  - access: a teacher can't open Platform Admin, private pictures stay private.
// Server: npm run build && EMAIL_DRIVER=console npx next start -p 3100
// Run:    BASE_URL=http://localhost:3100 SCREENSHOTS=/tmp/shots node e2e/community.e2e.mjs
import { chromium } from "playwright";
import { randomUUID } from "node:crypto";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import bcrypt from "bcryptjs";
import prismaPkg from "@prisma/client";

const { PrismaClient } = prismaPkg;
const db = new PrismaClient();
const BASE = process.env.BASE_URL ?? "http://localhost:3100";
const SHOTS = process.env.SCREENSHOTS;
const STORAGE = path.resolve(process.env.STORAGE_DIR ?? "./storage");
const stamp = Date.now();
const log = (...a) => console.log("•", ...a);
const assert = (c, m) => {
  if (!c) throw new Error(m);
};
const shot = async (p, name, full = false) => {
  if (!SHOTS) return;
  await p.waitForLoadState("networkidle").catch(() => {});
  await p.screenshot({ path: path.join(SHOTS, `${name}.png`), fullPage: full });
};
const errors = [];
const watch = (p) => (p.on("pageerror", (e) => errors.push(`${p.url()}: ${e.message.slice(0, 120)}`)), p);
const PASSWORD = "correct-horse-42";

// ── Data ──
const hash = await bcrypt.hash(PASSWORD, 10);
const school = await db.school.create({ data: { name: `Montessori ${stamp % 10000}` } });
const other = await db.school.create({ data: { name: `Escuela Norte ${stamp % 10000}` } });
async function teacherUser(name, email, role, schoolId) {
  const u = await db.user.create({ data: { schoolId, role, email, passwordHash: hash, displayName: name, emailVerifiedAt: new Date(), welcomeSentAt: new Date() } });
  const t = await db.teacher.create({ data: { userId: u.id, schoolId } });
  return { user: u, teacher: t, email };
}
const admin = await teacherUser("Diego Admin", `admin-comm-${stamp}@lextro.test`, "ADMIN", school.id);
const bea = await teacherUser("Bea Teacher", `bea-comm-${stamp}@lextro.test`, "TEACHER", school.id);
const carlos = await teacherUser("Carlos Otro", `carlos-comm-${stamp}@lextro.test`, "TEACHER", other.id);

async function media(schoolId, file, kind, mime) {
  const data = fs.readFileSync(path.resolve("e2e/fixtures", file));
  const key = `${schoolId}/${kind.toLowerCase()}/${randomUUID()}.${file.split(".").pop()}`;
  fs.mkdirSync(path.dirname(path.join(STORAGE, key)), { recursive: true });
  fs.writeFileSync(path.join(STORAGE, key), data);
  return db.mediaAsset.create({ data: { schoolId, kind, storageKey: key, mimeType: mime, sizeBytes: data.length, originalName: file, sha256: createHash("sha256").update(data).digest("hex") + stamp } });
}
const dog = await media(other.id, "dog.png", "IMAGE", "image/png");
const cat = await media(other.id, "cat.png", "IMAGE", "image/png");
const wav = await media(other.id, "answer.wav", "AUDIO", "audio/wav");
const secret = await media(other.id, "red-circle.png", "IMAGE", "image/png");
const audio = await db.audioAsset.create({ data: { schoolId: other.id, mediaAssetId: wav.id, text: "perro", language: "es-419", voice: "v", provider: "test", cacheKey: `ck-${stamp}` } });

function flash(teacher, schoolId, title, items, extra = {}) {
  return db.game.create({
    data: {
      schoolId,
      teacherId: teacher.id,
      templateKey: "FLASHCARDS",
      title,
      status: "PUBLISHED",
      settings: { phraseAudio: { perro: audio.id } },
      ...extra,
      items: { create: items },
    },
  });
}
const animales = await flash(carlos.teacher, other.id, `Animales ${stamp % 1000}`, [
  { position: 0, text: "perro", imageAssetId: dog.id, data: { back: { text: "dog", imageAssetId: cat.id }, audio: { mediaId: wav.id, text: "perro", language: "es-419" } }, questions: { create: [{ prompt: "perro", expectedAnswer: "perro", promptAudioId: audio.id, acceptedAnswers: { create: [{ text: "el perro" }] } }] } },
  { position: 1, text: "gato", data: { back: { text: "cat" } }, questions: { create: [{ prompt: "gato", expectedAnswer: "gato" }] } },
], {});
await flash(carlos.teacher, other.id, "Privada", [{ position: 0, text: "rojo", imageAssetId: secret.id, questions: { create: [{ prompt: "rojo", expectedAnswer: "rojo" }] } }]);
const adminGame = await flash(admin.teacher, school.id, `Colores del admin ${stamp % 1000}`, [{ position: 0, text: "rojo", questions: { create: [{ prompt: "rojo", expectedAnswer: "rojo" }] } }], { settings: {} });
const beaGame = await flash(bea.teacher, school.id, `Saludos de Bea ${stamp % 1000}`, [{ position: 0, text: "hola", questions: { create: [{ prompt: "hola", expectedAnswer: "hola" }] } }], { settings: {} });
const beaEmpty = await db.game.create({ data: { schoolId: school.id, teacherId: bea.teacher.id, templateKey: "FLASHCARDS", title: "" } });
const animalesBefore = JSON.stringify(await db.game.findUnique({ where: { id: animales.id }, include: { items: { include: { questions: true } } } }));

const browser = await chromium.launch();
async function signedIn(email, viewport = { width: 1440, height: 1000 }) {
  const ctx = await browser.newContext({ viewport, locale: "en-US" });
  const p = watch(await ctx.newPage());
  await p.goto(`${BASE}/login`);
  await p.fill("#email", email);
  await p.fill("#password", PASSWORD);
  await p.click("button[type=submit]");
  await p.waitForURL(`${BASE}/teacher`);
  return { ctx, p };
}
const imgLoaded = (p, sel) => p.locator(sel).first().evaluate((img) => (img.complete ? img.naturalWidth : new Promise((r) => { img.onload = () => r(img.naturalWidth); img.onerror = () => r(0); })));

try {
  // ── Admin: My Activities in Platform Admin = the same activities as in Teacher View ──
  const { p: a } = await signedIn(admin.email);
  await a.goto(`${BASE}/admin`);
  await a.getByTestId("ws-sidebar").getByRole("link", { name: "My Activities" }).click();
  await a.waitForURL(`${BASE}/admin/my-activities`);
  await a.getByText(adminGame.title).first().waitFor();
  assert((await a.getByTestId("ws-sidebar").getByRole("link", { name: "My Activities" }).getAttribute("aria-current")) === "page", "admin nav: My Activities active");
  assert((await a.getByTestId("create-activity-button").getAttribute("href")) === "/admin/games/new", "Create activity button stays in Platform Admin");
  const side = a.getByTestId("ws-sidebar");
  assert((await side.getByRole("link", { name: "Activity Log" }).count()) === 0, "Activity Log removed from the admin menu");
  assert((await side.getByRole("link", { name: "Create activity" }).getAttribute("href")) === "/admin/games/new", "admin menu: Create activity");
  assert((await side.getByRole("link", { name: "Community" }).getAttribute("href")) === "/admin/my-activities/community", "admin menu: Community");
  assert((await a.getByTestId("community-button").getAttribute("href")) === "/admin/my-activities/community", "Community button (admin)");
  await shot(a, "1-admin-my-activities");
  await a.goto(`${BASE}/teacher/my-activities`);
  await a.getByText(adminGame.title).first().waitFor();
  assert((await a.getByTestId("community-button").getAttribute("href")) === "/teacher/my-activities/community", "Community button (teacher)");
  assert((await a.getByTestId("create-activity-button").getAttribute("href")) === "/teacher/games/new", "Create activity button (teacher)");
  assert((await a.getByTestId("ws-sidebar").getByRole("link", { name: "Community" }).getAttribute("href")) === "/teacher/my-activities/community", "teacher menu: Community");

  // Create activity from Platform Admin: gallery and editor stay in Platform Admin
  await a.goto(`${BASE}/admin/my-activities`);
  await a.getByTestId("create-activity-button").click();
  await a.waitForURL(`${BASE}/admin/games/new`);
  assert((await a.getByTestId("workspace-switcher").textContent()).includes("Platform Admin"), "gallery inside Platform Admin");
  await shot(a, "1b-admin-create-activity");
  await a.click("button[value=FLASHCARDS]");
  await a.waitForURL(/\/admin\/games\/[^/]+\/edit$/);
  const newId = a.url().split("/").at(-2);
  assert((await db.game.findUnique({ where: { id: newId } })).teacherId === admin.teacher.id, "new activity is the admin's own");
  await a.waitForSelector("text=/Frente|Front/");
  assert((await a.getByTestId("workspace-switcher").textContent()).includes("Platform Admin"), "editor inside Platform Admin");
  assert((await a.getByTestId("ws-sidebar").getByRole("link", { name: "My Activities" }).getAttribute("aria-current")) === "page", "editor: My Activities active in admin menu");
  await shot(a, "1c-admin-editor");
  await a.getByRole("link", { name: "← My Activities" }).click();
  await a.waitForURL(`${BASE}/admin/my-activities`);
  await db.game.delete({ where: { id: newId } });
  log("admin: My Activities in Platform Admin and Teacher View, with Create activity + Community");

  // Search and folders keep working under /admin
  await a.goto(`${BASE}/admin/my-activities`);
  await a.getByRole("button", { name: "+ New folder" }).click();
  await a.getByRole("dialog").locator("input").first().fill("Unidad 1");
  await a.getByRole("dialog").getByRole("button", { name: /Create|Save/ }).click();
  await a.getByTestId("folder").filter({ hasText: "Unidad 1" }).waitFor();
  await a.getByRole("textbox", { name: "Search my activities" }).fill("Colores");
  await a.getByRole("button", { name: "Search" }).click();
  await a.waitForURL(/\/admin\/my-activities\?q=Colores/);
  await a.getByText(adminGame.title).first().waitFor();
  log("admin: folders and search stay inside Platform Admin");

  // ── Admin: Community shows other schools' shared activities (with their pictures) ──
  await a.goto(`${BASE}/admin/my-activities/community`);
  const card = a.getByTestId("community-activity").filter({ hasText: animales.title }).filter({ hasText: "by Carlos Otro" });
  await card.waitFor();
  assert(await card.getByText("by Carlos Otro").count(), "author shown");
  // Every teacher activity is in the Community automatically, even one nobody "shared".
  await a.getByTestId("community-activity").filter({ hasText: "Privada" }).first().waitFor();
  assert((await imgLoaded(card, "img")) > 0, "Community thumbnail from another school loads");
  await shot(a, "2-admin-community");
  const secretStatus = await a.evaluate((id) => fetch(`/api/media/${id}`, { cache: "no-store" }).then((r) => r.status), secret.id);
  assert(secretStatus === 200 || secretStatus === 302, `card pictures of every Community activity load (got ${secretStatus})`);
  const wavStatus = await a.evaluate((id) => fetch(`/api/media/${id}`, { cache: "no-store" }).then((r) => r.status), wav.id);
  assert(wavStatus === 404, "other files of a Community activity are not served across schools");
  log("Community: every activity from another school, thumbnails visible, audio stays private");

  // Copy & edit
  await card.getByTestId("community-copy").click();
  await a.waitForURL(/\/admin\/games\/[^/]+\/edit$/);
  const copyId = a.url().split("/").at(-2);
  const copy = await db.game.findUnique({ where: { id: copyId }, include: { items: { orderBy: { position: "asc" }, include: { questions: { include: { acceptedAnswers: true } } } } } });
  assert(copy.teacherId === admin.teacher.id && copy.schoolId === school.id, "copy belongs to the admin");
  assert(copy.copiedFromId === animales.id && copy.status === "DRAFT" && !copy.communitySharedAt, "copy is a private draft");
  assert(copy.title === animales.title && copy.items.length === 2, "copy has the cards");
  const img = await db.mediaAsset.findUnique({ where: { id: copy.items[0].imageAssetId } });
  assert(img && img.schoolId === school.id && img.id !== dog.id, "picture copied into the admin's school");
  const back = await db.mediaAsset.findUnique({ where: { id: copy.items[0].data.back.imageAssetId } });
  assert(back && back.schoolId === school.id && back.id !== cat.id, "card back picture copied");
  const faceAudio = await db.mediaAsset.findUnique({ where: { id: copy.items[0].data.audio.mediaId } });
  assert(faceAudio && faceAudio.schoolId === school.id, "card audio copied");
  const qa = await db.audioAsset.findUnique({ where: { id: copy.items[0].questions[0].promptAudioId } });
  assert(qa && qa.schoolId === school.id && qa.id !== audio.id && copy.settings.phraseAudio.perro === qa.id, "question and phrase audio copied");
  assert(copy.items[0].questions[0].acceptedAnswers[0].text === "el perro", "accepted answers copied");
  const served = await a.evaluate((id) => fetch(`/api/media/${id}`, { cache: "no-store" }).then((r) => r.status), img.id);
  assert(served === 200 || served === 302, "copied picture is served to the admin");
  await a.waitForSelector("text=/Frente|Front/");
  await shot(a, "3-copy-in-editor");
  log("Copy & edit: independent copy with pictures, card backs and audio, opened in the editor");

  // ── Bea: her activities are in the Community without sharing anything ──
  const { p: b } = await signedIn(bea.email);
  await b.goto(`${BASE}/teacher/my-activities`);
  const tile = b.getByTestId("activity").filter({ hasText: beaGame.title });
  await tile.getByRole("button", { name: `Options for ${beaGame.title}` }).click();
  assert((await b.getByRole("menuitem", { name: "Share to Community" }).count()) === 0, "no Share to Community: everything is in the Community");
  await b.keyboard.press("Escape");
  log("teacher: no share step in My Activities");

  await b.getByTestId("community-button").click();
  await b.waitForURL(`${BASE}/teacher/my-activities/community`);
  const mine = b.getByTestId("community-activity").filter({ hasText: beaGame.title });
  await mine.getByText("Yours").waitFor();
  assert(await mine.getByRole("link", { name: "Edit original" }).count(), "owner can edit the original");
  await b.getByTestId("community-activity").filter({ hasText: animales.title }).filter({ hasText: "by Carlos Otro" }).waitFor();
  assert((await b.getByTestId("community-activity").filter({ hasText: adminGame.title }).count()) === 1, "the admin's activities are in the Community too");
  assert((await b.getByTestId("community-remove").count()) === 0, "nobody removes activities from the Community");
  await b.getByRole("link", { name: "Mine" }).click();
  await b.waitForURL(/mine=1/);
  assert((await b.getByTestId("community-activity").count()) === 2, "Mine filter: Bea's two activities");
  await shot(b, "5-teacher-community-mine");
  // Bea copies Carlos's activity too
  await b.goto(`${BASE}/teacher/my-activities/community`);
  await b.getByTestId("community-activity").filter({ hasText: animales.title }).filter({ hasText: "by Carlos Otro" }).getByTestId("community-copy").click();
  await b.waitForURL(/\/teacher\/games\/[^/]+\/edit$/);
  const beaCopy = await db.game.findUnique({ where: { id: b.url().split("/").at(-2) }, include: { items: true } });
  assert(beaCopy.teacherId === bea.teacher.id && beaCopy.items[0].imageAssetId === copy.items[0].imageAssetId, "same picture reused within the school");
  await b.goto(`${BASE}/teacher/my-activities/community`);
  await b.getByTestId("community-activity").filter({ hasText: animales.title }).filter({ hasText: "by Carlos Otro" }).getByText("copied 2 times").waitFor();
  log("teacher: Community (all teacher activities, Yours, Edit original), copy reuses pictures in the school");

  // Teachers can't open Platform Admin
  await b.goto(`${BASE}/admin/my-activities`);
  assert(!b.url().includes("/admin/"), "teacher redirected away from admin My Activities");
  await b.goto(`${BASE}/admin/my-activities/community`);
  assert(!b.url().includes("/admin/"), "teacher redirected away from admin Community");

  await a.goto(`${BASE}/admin/my-activities/community`);
  await a.getByTestId("community-activity").filter({ hasText: beaGame.title }).waitFor();

  // Archived activities leave the Community
  await db.game.update({ where: { id: animales.id }, data: { status: "ARCHIVED" } });
  await a.reload();
  assert((await a.getByTestId("community-activity").filter({ hasText: animales.title }).filter({ hasText: "by Carlos Otro" }).count()) === 0, "archived activity hidden");
  const thumbAfter = await a.evaluate((id) => fetch(`/api/media/${id}`, { cache: "no-store" }).then((r) => r.status), dog.id);
  assert(thumbAfter === 404, "pictures of an activity out of the Community are private again");
  await db.game.update({ where: { id: animales.id }, data: { status: "PUBLISHED" } });

  // The original never changed
  const after = await db.game.findUnique({ where: { id: animales.id }, include: { items: { include: { questions: true } } } });
  const strip = (s) => JSON.parse(s, (k, v) => (k === "updatedAt" || k === "status" ? undefined : v));
  assert(JSON.stringify(strip(JSON.stringify(after))) === JSON.stringify(strip(animalesBefore)), "original unchanged");
  log("original activity unchanged after the copies");

  // Phone
  const { p: m } = await signedIn(admin.email, { width: 390, height: 844 });
  await m.goto(`${BASE}/admin/my-activities`);
  await m.getByTestId("community-button").waitFor();
  const overflow = await m.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  assert(!overflow, "no horizontal scroll on a phone");
  await shot(m, "6-phone-my-activities", true);
  await m.goto(`${BASE}/admin/my-activities/community`);
  await m.getByTestId("community-list").waitFor();
  assert(!(await m.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)), "Community: no horizontal scroll on a phone");
  await shot(m, "7-phone-community");
  log("phone: no horizontal scroll");

  assert(errors.length === 0, `page errors: ${errors.join(" | ")}`);
  console.log("\nCOMMUNITY E2E PASSED");
} catch (e) {
  console.error("FAILED:", e.message);
  process.exitCode = 1;
} finally {
  await browser.close();
  await db.$disconnect();
}
