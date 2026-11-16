// Printables that read like a teacher made them, from a deck like a real one: every front says
// "¿Qué color es este?" with a colour circle, every back has the same circle and the colour word.
// The shared question is said once at the top, the student looks at the picture and answers with
// the word (no repeated question, no repeated picture, no picture that gives the answer away).
// Run: BASE_URL=http://localhost:3100 node e2e/printables-teacher.e2e.mjs
import { chromium } from "playwright";
import path from "node:path";
import prismaPkg from "@prisma/client";

const db = new prismaPkg.PrismaClient();
const BASE = process.env.BASE_URL ?? "http://localhost:3100";
const SHOTS = process.env.SCREENSHOTS;
const stamp = Date.now();
const log = (...a) => console.log("•", ...a);
const assert = (c, m) => {
  if (!c) throw new Error(m);
};
const COLORS = [["rojo", "#ff0000"], ["amarillo", "#f8d117"], ["azul", "#0b7bc2"], ["verde", "#3fab3f"], ["morado", "#aa12ff"], ["rosado", "#ff5ca2"], ["anaranjado", "#ff7a0e"], ["café", "#7f3d10"]];
const Q = "¿Qué color es este?";

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 }, locale: "es-MX", deviceScaleFactor: SHOTS ? 2 : 1 });
const page = await ctx.newPage();
try {
  const email = `pt${stamp}@school.test`;
  await page.goto(`${BASE}/signup`);
  await page.fill("#displayName", "Ana Rivera");
  await page.fill("#schoolName", "Colegio Colores");
  await page.fill("#email", email);
  await page.fill("#password", "correct-horse-42");
  await page.click("button[type=submit]");
  await page.waitForURL(`${BASE}/teacher`);
  await db.user.update({ where: { email }, data: { emailVerifiedAt: new Date() } });

  await page.goto(`${BASE}/teacher/games/new`);
  await page.click("button[value=FLASHCARDS]");
  await page.waitForURL(/\/edit$/);
  const gameId = page.url().split("/").at(-2);
  await page.getByRole("textbox", { name: "Frente: Texto" }).first().fill("x");
  await page.waitForFunction(() => /Guardado|Saved/.test(document.querySelector("[data-testid=save-status]")?.textContent ?? ""), null, { timeout: 15000 });
  const ids = [];
  for (const [name, color] of COLORS) {
    ids.push(
      await page.evaluate(
        async ([color, name]) => {
          const c = document.createElement("canvas");
          c.width = c.height = 200;
          const g = c.getContext("2d");
          g.fillStyle = color;
          g.beginPath();
          g.arc(100, 100, 92, 0, Math.PI * 2);
          g.fill();
          const blob = await new Promise((r) => c.toBlob(r, "image/png"));
          const fd = new FormData();
          fd.append("file", new File([blob], `${name}.png`, { type: "image/png" }));
          return (await (await fetch("/api/media", { method: "POST", body: fd })).json()).id;
        },
        [color, name],
      ),
    );
  }
  const g = await (await page.request.get(`${BASE}/api/games/${gameId}`)).json();
  const tpl = g.items[0];
  const items = COLORS.map(([name], i) => ({
    ...tpl,
    id: undefined,
    key: undefined,
    text: Q,
    imageAssetId: ids[i],
    data: { back: { text: name, imageAssetId: ids[i] } },
    question: { ...tpl.question, id: undefined, expectedAnswer: "" },
  }));
  const r = await page.request.put(`${BASE}/api/games/${gameId}`, { data: { ...g, title: "Los colores - Colors", items } });
  assert(r.ok(), `cards saved (${r.status()})`);

  await page.goto(`${BASE}/play/preview/${gameId}`);
  await page.getByTestId("activity-strip").getByRole("button", { name: /Printables/ }).click();
  const viewer = page.getByRole("dialog", { name: "Printables" });
  const preview = page.getByTestId("printable-preview");
  const first = preview.locator("[data-print-page]").first();
  const shot = async (name) => SHOTS && first.screenshot({ path: path.join(SHOTS, `${name}.png`) });
  const count = (re) => first.getByText(re).count();

  // Flash cards table: the question once at the top, picture | word on each row
  await first.getByText("rojo", { exact: true }).waitFor();
  assert((await count(Q)) === 1, `table says the question once (${await count(Q)})`);
  await shot("pt1-table");
  log("table: question once, picture | word");

  await viewer.getByRole("button", { name: /Match up/ }).click();
  await first.getByText("Une con una línea cada imagen con su palabra.").waitFor();
  assert((await count(Q)) === 1, "match says the question once");
  const imgs = await first.locator("img").count();
  assert(imgs === COLORS.length, `match: pictures only on the left (${imgs})`);
  await shot("pt2-match");
  log("match: question once, pictures on the left, words on the right, Spanish instruction");

  await viewer.getByRole("button", { name: /^Quiz/ }).click();
  await first.getByText("Marca la respuesta correcta.").waitFor();
  assert((await count(Q)) === 1, "quiz says the question once");
  const qImgs = await first.locator("img").count();
  const items1 = await first.getByText(/^\d+\.$/).count();
  assert(qImgs === items1, `quiz: one picture per question, words as choices (${qImgs} pictures, ${items1} questions)`);
  await shot("pt3-quiz");
  log("quiz: picture per question, word choices");

  await viewer.getByRole("button", { name: /Spin the wheel/ }).click();
  await first.locator("svg").first().waitFor();
  await shot("pt4-wheel");
  log("ALL TEACHER PRINTABLES CHECKS PASSED");
} catch (e) {
  console.error("FAILED:", e.message);
  process.exitCode = 1;
} finally {
  await browser.close();
  await db.$disconnect();
}
