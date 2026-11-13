// Seeds global, non-tenant reference data (game templates, LaxtroSpeak starter library). Safe to run repeatedly.
import { PrismaClient } from "@prisma/client";
import { TEMPLATES } from "../src/lib/games/templates";
import { seedLibrary } from "../src/lib/library/seed";

// Use the direct (session) connection when available: the transaction pooler (port 6543)
// can fail with "prepared statement already exists" during builds.
const db = new PrismaClient({
  datasourceUrl: process.env.DIRECT_URL || process.env.DATABASE_URL,
});

async function main() {
  for (const t of TEMPLATES) {
    await db.gameTemplate.upsert({
      where: { key: t.key },
      create: { key: t.key, name: t.name, description: t.description, available: t.available },
      update: { name: t.name, description: t.description, available: t.available },
    });
  }
  console.log(`Seeded ${TEMPLATES.length} game templates.`);
  const topics = await seedLibrary(db);
  console.log(`LaxtroSpeak library: ${topics} new topic(s) seeded.`);
}

main().finally(() => db.$disconnect());
