// Seeds global, non-tenant reference data (game templates). Safe to run repeatedly.
import { PrismaClient } from "@prisma/client";
import { TEMPLATES } from "../src/lib/games/templates";

const db = new PrismaClient();

async function main() {
  for (const t of TEMPLATES) {
    await db.gameTemplate.upsert({
      where: { key: t.key },
      create: { key: t.key, name: t.name, description: t.description, available: t.available },
      update: { name: t.name, description: t.description, available: t.available },
    });
  }
  console.log(`Seeded ${TEMPLATES.length} game templates.`);
}

main().finally(() => db.$disconnect());
