// Montessori Intelligent Feedback Engine, end to end (no microphone needed).
//
// Server: npm run build && npx next start -p 3100 (same env as e2e/lextro.e2e.mjs; STT not required).
// Run:    BASE_URL=http://localhost:3100 node e2e/montessori.e2e.mjs
// Creates its own school, admin, teachers, class, student, voice activity and library game
// directly in the local database (DATABASE_URL), then checks through the real pages and API:
// server-side evidence (self-correction, technical failures not graded), skill records shared
// across activities, library game feedback, the teacher dashboard and level editing, admin
// settings (language), and access rules for every role.
import { chromium } from "playwright";
import { execFileSync } from "node:child_process";
import { writeFileSync, mkdtempSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import bcrypt from "bcryptjs";
import prismaPkg from "@prisma/client";

const { PrismaClient } = prismaPkg;
const db = new PrismaClient();
const BASE = process.env.BASE_URL ?? "http://localhost:3100";
const stamp = Date.now();
const log = (...a) => console.log("•", ...a);
const assert = (ok, msg) => { if (!ok) throw new Error(msg); };
const results = [];
async function check(name, fn) { await fn(); results.push(name); log("✓", name); }
const PASSWORD = "correct-horse-42";
// Message variants rotate; any version of "support.look_again" is fine.
const LOOK_EN = /Let's look at this one again\.|Take another look at this one\./;
const LOOK_ES = /Observemos este nuevamente\.|Mira este otra vez con calma\./;

async function makeTeacher(schoolId, role, label) {
  const email = `mont-${label}-${stamp}@lextro.test`;
  const user = await db.user.create({ data: { schoolId, role, email, displayName: `${label} teacher`, passwordHash: await bcrypt.hash(PASSWORD, 10), emailVerifiedAt: new Date() } });
  const teacher = await db.teacher.create({ data: { userId: user.id, schoolId } });
  return { user, teacher, email };
}

// ---------- data ----------
const schoolA = await db.school.create({ data: { name: `Montessori School ${stamp}` } });
const schoolB = await db.school.create({ data: { name: `Other School ${stamp}` } });
const admin = await makeTeacher(schoolA.id, "ADMIN", "admin");
const tA = await makeTeacher(schoolA.id, "TEACHER", "a");
const tB = await makeTeacher(schoolB.id, "TEACHER", "b");
const code = `MT${String(stamp).slice(-6)}`;
const classroom = await db.classroom.create({ data: { schoolId: schoolA.id, teacherId: tA.teacher.id, name: "Montessori 2", code } });
const level = await db.level.create({ data: { classroomId: classroom.id, name: "LE2" } });
const group = await db.group.create({ data: { levelId: level.id, name: "Group A" } });
const sUser = await db.user.create({ data: { schoolId: schoolA.id, role: "STUDENT", displayName: "Ana M" } });
const ana = await db.student.create({ data: { userId: sUser.id, schoolId: schoolA.id, classroomId: classroom.id, firstName: "Ana", lastInitial: "M", username: `ana${stamp}`, pinHash: await bcrypt.hash("2468", 10), memberships: { create: { groupId: group.id } } } });

// Voice activity: three animals (teacher's hint on "perro").
const game = await db.game.create({
  data: {
    schoolId: schoolA.id, teacherId: tA.teacher.id, templateKey: "SPEAK_AND_ANSWER", title: "Los animales", topic: "Animals", status: "PUBLISHED", publishedAt: new Date(),
    settings: { acceptShortAnswer: true, rate: 0.95, maxTries: 3 },
    items: {
      create: [
        ["perro", "Hace guau."], ["gato", ""], ["pato", ""],
      ].map(([w, hint], i) => ({ position: i, text: w, questions: { create: { prompt: "¿Qué animal es?", expectedAnswer: w, hint } } })),
    },
  },
  include: { items: { include: { questions: true } } },
});
const q = Object.fromEntries(game.items.map((it) => [it.text, it.questions[0].id]));
const gameAssignment = await db.assignment.create({ data: { schoolId: schoolA.id, teacherId: tA.teacher.id, gameId: game.id, recipients: { create: { type: "STUDENT", studentId: ana.id } } } });

// Library Listen & Find game in a topic task.
const resource = await db.libraryResource.create({ data: { kind: "GAME", title: `Listen: animales ${stamp}`, status: "PUBLISHED", grades: ["LOWER"] } });
const content = { gameType: "LISTEN", instructions: "", questions: [], pairs: [{ es: "perro", en: "dog", image: { art: "perro" } }, { es: "gato", en: "cat", image: { art: "gato" } }, { es: "pato", en: "duck", image: { art: "pato" } }] };
const version = await db.resourceVersion.create({ data: { resourceId: resource.id, number: 1, title: resource.title, content, fileIds: [] } });
await db.libraryResource.update({ where: { id: resource.id }, data: { currentVersionId: version.id, draft: content } });
const topic = await db.topic.create({ data: { slug: `mont-animals-${stamp}`, titleEn: "Animals", titleEs: "Los animales" } });
await db.topicResource.create({ data: { topicId: topic.id, resourceId: resource.id, position: 0 } });
const task = await db.assignment.create({ data: { schoolId: schoolA.id, teacherId: tA.teacher.id, topicId: topic.id, title: "Animals", recipients: { create: { type: "STUDENT", studentId: ana.id } }, activities: { create: { resourceId: resource.id, versionId: version.id, position: 0 } } } });
const activity = await db.assignmentActivity.findFirstOrThrow({ where: { assignmentId: task.id } });

// Default settings for this run (bilingual), restored at the end.
const before = await db.montessoriSettings.findUnique({ where: { id: "platform" } });
await db.montessoriSettings.deleteMany({ where: { id: "platform" } });

const browser = await chromium.launch();
const errors = [];
const watch = (p, who) => { p.on("pageerror", (e) => errors.push(`${who}: ${e.message}`)); return p; };
async function teacherPage(email) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const p = watch(await ctx.newPage(), email);
  await p.goto(`${BASE}/login`);
  await p.fill("#email", email);
  await p.fill("#password", PASSWORD);
  await p.click("button[type=submit]");
  await p.waitForURL(`${BASE}/teacher`);
  return p;
}
async function studentPage() {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const p = watch(await ctx.newPage(), "student");
  await p.goto(`${BASE}/student/${code}`);
  await p.click("button:has-text('Ana')");
  for (const d of "2468") await p.click(`button:text-is('${d}')`);
  await p.click("text=Go!");
  await p.waitForURL(`${BASE}/learn`);
  return p;
}

let exit = 0;
try {
  const s = await studentPage();
  const api = async (url, body) => {
    const r = await s.request.post(`${BASE}${url}`, { data: body });
    return { status: r.status(), json: await r.json() };
  };
  const turn = (questionId, text, support, tryNumber, extra = {}) => api(`/api/attempts/${attemptId}/responses`, { questionId, alternatives: text === null ? [] : [{ text, confidence: 0.95 }], tooQuiet: false, provider: "scripted-test", locale: "es-MX", support, tryNumber, input: "voice", ...extra });

  let attemptId;
  await check("1–4, 11–13 · voice answers: correct, self-correction, silence not graded, hint, resume", async () => {
    attemptId = (await api("/api/attempts", { assignmentId: gameAssignment.id })).json.attemptId;
    const r1 = await turn(q.perro, "perro", "NONE", 1);
    assert(r1.json.outcome === "CORRECT" && r1.json.selfCorrected === false, `perro ${JSON.stringify(r1.json)}`);
    const w = await turn(q.gato, "caballo", "NONE", 1);
    assert(w.json.outcome === "INCORRECT" && !w.json.endsQuestion, `gato wrong ${JSON.stringify(w.json)}`);
    const r2 = await turn(q.gato, "gato", "NONE", 2);
    assert(r2.json.outcome === "CORRECT" && r2.json.selfCorrected === true, "self-correction recorded by the server");
    const silent = await turn(q.pato, null, "NONE", 1);
    assert(silent.json.outcome === "UNCERTAIN", "silence is uncertain, never incorrect");
    // Closed and reopened: the same attempt continues.
    const again = await api("/api/attempts", { assignmentId: gameAssignment.id });
    assert(again.json.attemptId === attemptId && again.json.resumed === true, "attempt resumed");
    const r3 = await turn(q.pato, "pato", "HINT", 2);
    assert(r3.json.outcome === "CORRECT" && r3.json.selfCorrected === false, "correct after a hint is not a self-correction");
    const done = await api(`/api/attempts/${attemptId}/complete`, { durationMs: 30000, presented: 3 });
    assert(done.status === 200, `complete ${done.status}`);
    const rs = await db.studentResponse.findMany({ where: { attemptId }, orderBy: { createdAt: "asc" } });
    assert(rs.map((r) => r.errorKind).join(",") === ",vocabulary,,silence,", `error kinds ${rs.map((r) => r.errorKind)}`);
    assert(rs.filter((r) => r.selfCorrected).length === 1, "one self-correction");
  });

  await check("skill records: levels from evidence, never Proficient from one answer", async () => {
    const sk = await db.skillProgress.findMany({ where: { studentId: ana.id }, orderBy: { label: "asc" } });
    assert(sk.length === 3, `3 skills, got ${sk.length}`);
    const by = Object.fromEntries(sk.map((x) => [x.label, x]));
    assert(by.perro.independentCorrect === 1 && by.perro.level === "DEVELOPING", `perro ${by.perro.level}`);
    assert(by.gato.selfCorrections === 1 && by.gato.independentCorrect === 1, "gato self-corrected, independent");
    assert(by.pato.hintsUsed === 1 && by.pato.independentCorrect === 0 && by.pato.lastNeededHelpAt, "pato needed help");
    assert(sk.every((x) => x.topic === "Animals" && x.lastActivity === "Los animales"), "topic and activity");
    // Completing the same attempt again does not count twice.
    await api(`/api/attempts/${attemptId}/complete`, { durationMs: 30000, presented: 3 });
    assert((await db.skillProgress.findFirstOrThrow({ where: { studentId: ana.id, label: "perro" } })).attempts === 1, "no double counting");
  });

  await check("library Listen & Find: descriptive bilingual feedback, look again, summary, records shared with the voice activity", async () => {
    await s.goto(`${BASE}/learn/tasks/${task.id}/${activity.id}`);
    await s.waitForSelector("[data-testid=listen-again]");
    for (let n = 0; n < 3; n++) {
      const target = await s.locator("[data-testid=listen-again]").getAttribute("data-answer");
      if (n === 0) {
        const wrong = s.locator(`[data-testid=listen-option]:not([data-pair='${target}'])`).first();
        await wrong.click();
        await s.waitForSelector("[data-feedback-id='support.look_again']");
        const text = await s.locator("[data-feedback-id='support.look_again']").textContent();
        assert(LOOK_EN.test(text) && LOOK_ES.test(text), `bilingual lines: ${text}`);
      }
      await s.locator(`[data-testid=listen-option][data-pair='${target}']`).click();
      await s.waitForSelector("[data-feedback-id^='success.']");
      await s.waitForTimeout(1800);
    }
    await s.waitForSelector("[data-testid=celebrate] [data-feedback-id='success.completed']");
    assert(await s.locator("[data-testid=practice-missed]").count(), "practice the item that needed help");
    const recorded = await (async () => { for (let i = 0; i < 20; i++) { const x = await db.skillProgress.findMany({ where: { studentId: ana.id } }); if (x.every((y) => y.attempts >= 2)) return x; await new Promise((r) => setTimeout(r, 300)); } return null; })();
    assert(recorded, "library answers recorded on the same skills");
    assert(recorded.some((x) => x.contexts.length === 2), "independent in two activities (game + library)");
  });

  await check("14 · teacher dashboard: progress, recommendation, level edited by the teacher", async () => {
    const t = await teacherPage(tA.email);
    await t.goto(`${BASE}/teacher/progress?class=${classroom.id}&group=${group.id}`);
    await t.waitForSelector("[data-testid=progress-table] >> text=Ana M");
    await t.click("a:text-is('Ana M')");
    await t.waitForSelector("[data-testid=teacher-recommendation]");
    const rec = await t.locator("[data-testid=teacher-recommendation]").textContent();
    assert(/Ana/.test(rec) && !/\b(she|he|her|his)\b/i.test(rec), `recommendation: ${rec}`);
    const row = t.locator("[data-testid=skill-row]:has-text('pato')");
    await row.locator("[data-testid=level-select]").selectOption("PROGRESSING");
    await row.locator("input[placeholder^='Observation']").fill("Says it well in class.");
    await row.locator("[data-testid=level-save]").click();
    await row.locator("text=Saved").waitFor();
    const pato = await db.skillProgress.findFirstOrThrow({ where: { studentId: ana.id, label: "pato" } });
    assert(pato.teacherLevel === "PROGRESSING" && pato.teacherNote === "Says it well in class." && pato.teacherUpdatedById === tA.user.id, "teacher level saved");
    await t.reload();
    await t.locator("[data-testid=skill-row]:has-text('pato') [aria-label='set by the teacher']").waitFor();
    // Back to the computed level.
    await t.locator("[data-testid=skill-row]:has-text('pato') [data-testid=level-select]").selectOption("");
    await t.locator("[data-testid=skill-row]:has-text('pato') [data-testid=level-save]").click();
    await t.locator("[data-testid=skill-row]:has-text('pato') >> text=Saved").waitFor();
    assert((await db.skillProgress.findFirstOrThrow({ where: { id: pato.id } })).teacherLevel === null, "cleared");
    // A teacher can't open the admin settings.
    await t.goto(`${BASE}/admin/settings/montessori`);
    assert(!t.url().includes("/admin/settings"), `teacher redirected away from admin settings (${t.url()})`);
  });

  await check("permissions: other school's teacher and the student can't see the records", async () => {
    const b = await teacherPage(tB.email);
    const r = await b.goto(`${BASE}/teacher/progress/${ana.id}`);
    assert(r.status() === 404, `other teacher gets 404, got ${r.status()}`);
    await b.goto(`${BASE}/teacher/progress`);
    assert(!(await b.locator("text=Ana M").count()), "other teacher's list doesn't include Ana");
    await s.goto(`${BASE}/teacher/progress`);
    assert(!s.url().includes("/teacher/progress"), `student redirected (${s.url()})`);
    await s.goto(`${BASE}/admin/settings/montessori`);
    assert(!s.url().includes("/admin"), `student redirected from admin (${s.url()})`);
    // Server functions refuse records of another teacher's students (same checks as the actions).
    const dir = mkdtempSync(path.join(os.tmpdir(), "mont-"));
    const script = path.join(dir, "perm.ts");
    const skill = await db.skillProgress.findFirstOrThrow({ where: { studentId: ana.id } });
    writeFileSync(script, `
      import { setTeacherLevel, studentProgress, progressOverview } from "${path.resolve("src/lib/montessori/server.ts")}";
      (async () => {
      const out: string[] = [];
      try { await setTeacherLevel(${JSON.stringify(tB.teacher.id)}, ${JSON.stringify(tB.user.id)}, ${JSON.stringify(skill.id)}, { level: "EXTENDING", note: "x" }); out.push("set:allowed"); } catch (e) { out.push("set:" + (e as { status?: number }).status); }
      try { await studentProgress(${JSON.stringify(tB.teacher.id)}, ${JSON.stringify(ana.id)}); out.push("read:allowed"); } catch (e) { out.push("read:" + (e as { status?: number }).status); }
      const o = await progressOverview(${JSON.stringify(tB.teacher.id)}, {});
      out.push("list:" + o.students.length);
      console.log(out.join(","));
      process.exit(0);
      })();
    `);
    const res = execFileSync("npx", ["tsx", "--conditions=react-server", "--tsconfig", path.resolve("tsconfig.json"), script], { encoding: "utf8" }).trim().split("\n").at(-1);
    assert(res === "set:404,read:404,list:0", `server checks: ${res}`);
    assert((await db.skillProgress.findFirstOrThrow({ where: { id: skill.id } })).teacherLevel === null, "nothing changed");
  });

  await check("15 · admin changes the feedback language; students see it on their next activity", async () => {
    const a = await teacherPage(admin.email);
    await a.goto(`${BASE}/admin/settings/montessori`);
    await a.waitForSelector("text=Montessori Feedback");
    await a.click("[data-testid=message-support\\.look_again] summary");
    const preview = await a.locator("[data-testid='preview-text-support.look_again']").textContent();
    assert(preview.includes("Let's look at this one again.") && preview.includes("Observemos este nuevamente."), `preview ${preview}`);
    await a.check("[data-testid=language-en]");
    await a.click("[data-testid=save-montessori]");
    await a.waitForSelector("text=Saved.");
    const row = await db.montessoriSettings.findUniqueOrThrow({ where: { id: "platform" } });
    assert(row.config.language === "en" && row.updatedById === admin.user.id, "saved in the database");
    await s.goto(`${BASE}/learn/tasks/${task.id}/${activity.id}`);
    await s.waitForSelector("[data-testid=listen-again]");
    const target = await s.locator("[data-testid=listen-again]").getAttribute("data-answer");
    await s.locator(`[data-testid=listen-option]:not([data-pair='${target}'])`).first().click();
    await s.waitForSelector("[data-feedback-id='support.look_again']");
    const text = await s.locator("[data-feedback-id='support.look_again']").textContent();
    assert(LOOK_EN.test(text) && !LOOK_ES.test(text), `English only: ${text}`);
  });

  assert(errors.length === 0, `page errors: ${errors.join(" | ")}`);
  console.log(`\nMONTESSORI E2E PASSED (${results.length} checks)`);
} catch (e) {
  console.error("\nMONTESSORI E2E FAILED:", e.message);
  for (const p of browser.contexts().flatMap((c) => c.pages())) await p.screenshot({ path: `e2e/failure-m-${Math.random().toString(36).slice(2, 6)}.png`, fullPage: true }).catch(() => {});
  exit = 1;
} finally {
  await db.montessoriSettings.deleteMany({ where: { id: "platform" } });
  if (before) await db.montessoriSettings.create({ data: before });
  await browser.close();
  await db.$disconnect();
  process.exit(exit);
}
