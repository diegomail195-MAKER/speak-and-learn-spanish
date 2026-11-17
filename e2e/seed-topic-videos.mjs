// Local test data for the Topic page: short hosted videos (made with ffmpeg) added as published
// VIDEO resources to «Los animales» (1 video) and «Los saludos» (6 videos). Local database only.
// Run: set -a; . ./.env; set +a; node e2e/seed-topic-videos.mjs
import { PrismaClient } from "@prisma/client";
import { execFileSync } from "node:child_process";
import { mkdirSync, statSync } from "node:fs";
import path from "node:path";

const db = new PrismaClient();
const dir = path.resolve(process.env.STORAGE_DIR ?? "./storage", "library/e2e-hero");
mkdirSync(dir, { recursive: true });
const plan = {
  animals: [["Mi animal favorito", "orange"]],
  greetings: [["¡Buenos días, amigos!", "teal"], ["¿Cómo te llamas?", "purple"], ["Buenas tardes (afrobeat)", "red"], ["Hola, ¿cómo estás? (rock)", "navy"], ["Buenas noches (canción)", "green"], ["Me presento en español", "maroon"]],
};
for (const [slug, vids] of Object.entries(plan)) {
  const topic = await db.topic.findUnique({ where: { slug } });
  if (!topic) continue;
  for (const [i, [title, color]] of vids.entries()) {
    const exists = await db.libraryResource.findFirst({ where: { title, kind: "VIDEO", topics: { some: { topicId: topic.id } } } });
    if (exists) continue;
    const key = `library/e2e-hero/${slug}-${i}.mp4`;
    const file = path.resolve(process.env.STORAGE_DIR ?? "./storage", key);
    execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-f", "lavfi", "-i", `color=c=${color}:s=640x360:d=${8 + i * 3}`, "-f", "lavfi", "-i", `sine=frequency=${300 + i * 60}:duration=${8 + i * 3}`, "-vf", `drawtext=text='${slug} ${i + 1}':fontsize=64:fontcolor=white:x=(w-text_w)/2:y=(h-text_h)/2`, "-shortest", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "aac", "-movflags", "+faststart", file]);
    const lf = await db.libraryFile.create({ data: { storageKey: key, mimeType: "video/mp4", sizeBytes: statSync(file).size, originalName: `${title}.mp4`, ready: true } });
    const content = { file: { fileId: lf.id, name: `${title}.mp4`, mime: "video/mp4" }, captions: "" };
    const r = await db.libraryResource.create({ data: { kind: "VIDEO", title, status: "PUBLISHED", grades: ["LOWER", "UPPER"], draft: content } });
    const v = await db.resourceVersion.create({ data: { resourceId: r.id, number: 1, title, content, fileIds: [lf.id] } });
    await db.libraryResource.update({ where: { id: r.id }, data: { currentVersionId: v.id } });
    await db.topicResource.create({ data: { topicId: topic.id, resourceId: r.id, position: i - 10 } });
  }
}
console.log("seeded");
await db.$disconnect();
