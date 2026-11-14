import type { GradeBand, PrismaClient, ResourceKind } from "@prisma/client";
import { SEED_CHANT, SEED_TOPICS, SEED_VOCAB } from "./seed-data";
import { fileIdsOf } from "./types";

// Seeds the five original LextroSpeak topics with their activities as published library
// resources. A topic that already exists is left alone, so an administrator's edits, removals
// and reordering are never overwritten by a later deploy.

const CATEGORY: Record<string, string> = { greetings: "Everyday", numbers: "Math", shapes: "Math", colors: "Art", animals: "Science" };

export async function seedLibrary(db: PrismaClient) {
  let created = 0;
  for (const [i, t] of SEED_TOPICS.entries()) {
    if (await db.topic.findUnique({ where: { slug: t.id } })) continue;
    const words = SEED_VOCAB[t.id] ?? [];
    const art = (id: string) => ({ art: `${t.id}:${id}` });
    const pairs = words.map((w) => ({ es: w.es, en: w.en, image: art(w.id) }));
    const items: Array<{ kind: ResourceKind; title: string; description: string; grades: GradeBand[]; content: unknown }> = [
      {
        kind: "SONG",
        title: `${t.title} Chant`,
        description: "Canta y repite · an original chant to read and repeat.",
        grades: ["LOWER"],
        content: { file: null, lyrics: (SEED_CHANT[t.id] ?? []).map((l) => ({ es: `${l.q} ${l.a}`, en: l.en, art: `${t.id}:${l.art}` })) },
      },
      {
        kind: "FLASHCARDS",
        title: `${t.title} Flashcards`,
        description: "Tarjetas · tap to flip, listen to each word.",
        grades: ["LOWER", "UPPER"],
        content: { instructions: "Tap the card to see the English word. Tap the speaker to listen.", cards: words.map((w) => ({ front: w.es, back: w.en, image: art(w.id), audio: null })) },
      },
      {
        kind: "GAME",
        title: "Picture Match",
        description: "Une la imagen · match each picture with its Spanish word.",
        grades: ["LOWER", "UPPER"],
        content: { gameType: "MATCH", instructions: "Tap a picture, then tap its Spanish word.", pairs, questions: [] },
      },
      {
        kind: "GAME",
        title: "Memory Game",
        description: "Memoria · find each picture and its word.",
        grades: ["LOWER", "UPPER"],
        content: { gameType: "MEMORY", instructions: "Turn over two cards. Find the picture and its Spanish word.", pairs: pairs.slice(0, 6), questions: [] },
      },
      {
        kind: "GAME",
        title: "Listen & Find",
        description: "Escucha y busca · listen and tap the right picture.",
        grades: ["UPPER"],
        content: { gameType: "LISTEN", instructions: "Listen to the word and tap the right picture.", pairs, questions: [] },
      },
      {
        kind: "PRINTABLE",
        title: "Picture Dictionary",
        description: "Diccionario ilustrado · every word in Spanish and English.",
        grades: ["LOWER", "UPPER"],
        content: { file: null, sheet: { style: "dictionary", heading: `${t.es} · ${t.title}`, words: pairs } },
      },
      {
        kind: "PRINTABLE",
        title: "Connect & Color",
        description: "Une con una línea · draw a line from each picture to its word.",
        grades: ["LOWER"],
        content: { file: null, sheet: { style: "connect", heading: `${t.es} · Connect & Color`, words: pairs.slice(0, 6) } },
      },
      {
        kind: "WORKSHEET",
        title: "Write the Word",
        description: `Escribe la palabra · ${t.write[0]}`,
        grades: ["UPPER"],
        content: { file: null, sheet: { style: "write", heading: `${t.write[0]} · ${t.write[1]}`, words: pairs } },
      },
    ];

    await db.$transaction(async (tx) => {
      const topic = await tx.topic.create({
        data: { slug: t.id, titleEn: t.title, titleEs: t.es, category: CATEGORY[t.id] ?? "Vocabulary", color: t.color, art: `topic:${t.id}`, sortOrder: i, status: "PUBLISHED" },
      });
      for (const [pos, it] of items.entries()) {
        const r = await tx.libraryResource.create({ data: { kind: it.kind, title: it.title, description: it.description, grades: it.grades, status: "PUBLISHED", draft: it.content as object } });
        const v = await tx.resourceVersion.create({ data: { resourceId: r.id, number: 1, title: it.title, content: it.content as object, fileIds: fileIdsOf(it.content) } });
        await tx.libraryResource.update({ where: { id: r.id }, data: { currentVersionId: v.id } });
        await tx.topicResource.create({ data: { topicId: topic.id, resourceId: r.id, position: pos } });
      }
    });
    created++;
  }
  return created;
}
