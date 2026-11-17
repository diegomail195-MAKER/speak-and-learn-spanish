import { describe, expect, it } from "vitest";
import { HERO_CATEGORIES, buildHero } from "./topicHero";
import { LESSON, lessonClips, spokenTitle, stepLine } from "./lesson";

describe("guided lesson lines", () => {
  it("uses the teacher's title in the opening line", () => {
    expect(LESSON.start("Los saludos")).toEqual({ es: "Vamos a aprender sobre Los saludos.", en: "Let's learn about Los saludos." });
    expect(spokenTitle("Los saludos · Greetings")).toBe("Los saludos");
    expect(spokenTitle("Mi lección")).toBe("Mi lección");
  });
  it("presents each type with its line, the rest with the general transition", () => {
    expect(stepLine("FLASHCARDS").es).toBe("Ahora vamos a practicar con las tarjetas.");
    expect(stepLine("GAME").en).toBe("Now let's play a game.");
    expect(stepLine("SPEAKING").es).toBe("Ahora vamos a practicar hablando.");
    expect(stepLine("VIDEO")).toBe(LESSON.next);
    expect(stepLine("SONG")).toBe(LESSON.next);
  });
  it("creates a Spanish and an English clip for every line", () => {
    const clips = lessonClips("Los animales");
    expect(clips).toHaveLength(14);
    expect(clips.filter((c) => c.language === "es-419")).toHaveLength(7);
    expect(clips[0]).toEqual({ text: "Vamos a aprender sobre Los animales.", language: "es-419" });
  });
});

describe("topic categories", () => {
  it("keeps the five icons in their fixed order and puts Speaking activities in Speaking", () => {
    expect(HERO_CATEGORIES.map((c) => c.key)).toEqual(["videos", "games", "flashcards", "music", "speaking"]);
    const hero = buildHero([
      { id: "g:1", kind: "SPEAKING", title: "Hola", content: null, href: "/x" },
      { id: "r:1", kind: "FLASHCARDS", title: "Tarjetas", content: {}, href: "/y" },
    ]);
    expect(hero.items.speaking.map((i) => i.id)).toEqual(["g:1"]);
    expect(hero.items.flashcards.map((i) => i.id)).toEqual(["r:1"]);
  });
});
