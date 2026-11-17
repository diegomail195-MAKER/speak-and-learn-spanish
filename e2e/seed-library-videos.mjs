// Local test data for Library › Videos: the same topics and video titles as the Preview library
// (short hosted clips made with ffmpeg, plus one YouTube link). Local database only.
// Run: set -a; . ./.env; set +a; node e2e/seed-library-videos.mjs
import { PrismaClient } from "@prisma/client";
import { execFileSync } from "node:child_process";
import { mkdirSync, statSync } from "node:fs";
import path from "node:path";

const db = new PrismaClient();
const root = process.env.STORAGE_DIR ?? "./storage";
const dir = path.resolve(root, "library/e2e-gallery");
mkdirSync(dir, { recursive: true });

const topics = [
  ["greetings", "Los saludos", "Greetings", "Everyday", 0],
  ["numbers", "Los números", "Numbers", "Math", 1],
  ["colors", "Los colores", "Colors", "Art", 2],
  ["shapes", "Las figuras", "Shapes", "Math", 3],
  ["animals", "Los animales", "Animals", "Science", 4],
  ["escuchamos-con-respeto", "WE LISTEN WITH RESPECT", "ESCUCHAMOS CON RESPETO", "Grace & Courtesy", 5],
  ["telling-time", "La hora", "Telling Time", "Vocabulary", 6],
  ["songs-and-movement", "Canciones y movimiento", "Songs and Movement", "Vocabulary", 13],
];
const videos = {
  greetings: ["¡Buenos días, amigos!", "¿Cómo te llamas?", "Buenas noches (canción)", "Buenas tardes (afrobeat)", "Buenas tardes (trap)", "Buenos días (merengue)", "Estoy bien (trap)", "Hola, ¿cómo estás? (rock)", "Me presento en español"],
  numbers: ["Contemos del 0 al 10 en español", "De 10 en 10 hasta 100 en español", "Los números del 0 al 100 en español", "Números del 20 al 1 (al revés)", "Vamos todos a cantar los números del 1 al 20", "Vamos todos a cantar los números del 1 al 100"],
  colors: ["Colores: ¿Qué color ves?", "Los colores con Piña"],
  shapes: ["Las formas (canción)", "Las formas en español (canción)"],
  animals: ["Mi animal favorito (canción)"],
  "escuchamos-con-respeto": ["We Listen with Respect", "En la fila me quedaré", { title: "WE LISTEN WITH RESPECT", youtubeId: "1WhKIrWBWT0" }],
  "telling-time": ["¿Qué hora es?", "La hora en punto", "La hora en punto: ruleta", "Ruleta de la hora: horas y minutos"],
  "songs-and-movement": ["Abajo, arriba (merengue)", "Es viernes", "Me lo merezco (letra para practicar)"],
};
const colors = ["teal", "purple", "orange", "navy", "maroon", "darkgreen", "crimson", "steelblue", "olive", "indigo"];

let n = 0;
for (const [slug, titleEs, titleEn, category, sortOrder] of topics) {
  const topic = await db.topic.upsert({ where: { slug }, update: { category, sortOrder }, create: { slug, titleEs, titleEn, category, sortOrder, status: "PUBLISHED" } });
  for (const [i, v] of (videos[slug] ?? []).entries()) {
    const title = typeof v === "string" ? v : v.title;
    if (await db.libraryResource.findFirst({ where: { title, kind: "VIDEO", topics: { some: { topicId: topic.id } } } })) continue;
    let content;
    let fileIds = [];
    if (typeof v === "string") {
      const key = `library/e2e-gallery/${slug}-${i}.mp4`;
      const file = path.resolve(root, key);
      const secs = 6 + ((n * 7) % 40);
      const color = colors[n % colors.length];
      execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-f", "lavfi", "-i", `color=c=${color}:s=640x360:d=${secs}`, "-f", "lavfi", "-i", `sine=frequency=${300 + (n % 9) * 50}:duration=${secs}`, "-vf", `drawtext=text='${slug} ${i + 1}':fontsize=56:fontcolor=white:x=(w-text_w)/2:y=(h-text_h)/2`, "-shortest", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "aac", "-movflags", "+faststart", file]);
      const lf = await db.libraryFile.create({ data: { storageKey: key, mimeType: "video/mp4", sizeBytes: statSync(file).size, originalName: `${title}.mp4`, ready: true } });
      content = { file: { fileId: lf.id, name: `${title}.mp4`, mime: "video/mp4" }, captions: "" };
      fileIds = [lf.id];
    } else {
      content = { link: { url: `https://youtu.be/${v.youtubeId}` }, youtubeId: v.youtubeId, captions: "" };
    }
    const r = await db.libraryResource.create({ data: { kind: "VIDEO", title, status: "PUBLISHED", grades: ["LOWER", "UPPER"], draft: content } });
    const ver = await db.resourceVersion.create({ data: { resourceId: r.id, number: 1, title, content, fileIds } });
    await db.libraryResource.update({ where: { id: r.id }, data: { currentVersionId: ver.id } });
    await db.topicResource.create({ data: { topicId: topic.id, resourceId: r.id, position: i - 50 } });
    n++;
  }
}
console.log(`seeded ${n} videos`);
await db.$disconnect();
