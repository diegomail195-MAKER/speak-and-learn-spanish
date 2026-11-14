import { describe, expect, it } from "vitest";
import { fileIdsOf, parseContent, publishProblem, youtubeIdFrom } from "./types";

describe("library content", () => {
  it("collects every referenced file", () => {
    const c = parseContent("FLASHCARDS", { cards: [{ front: "el perro", back: "the dog", image: { fileId: "f1" }, audio: { fileId: "f2", name: "a.mp3", mime: "audio/mpeg" } }, { front: "la oveja", image: { art: "animals:oveja" } }] });
    expect(fileIdsOf(c).sort()).toEqual(["f1", "f2"]);
  });
  it("checks what a game needs before publishing", () => {
    expect(publishProblem("GAME", parseContent("GAME", { gameType: "MEMORY", pairs: [{ es: "uno", en: "one" }] }))).toMatch(/two pairs/);
    expect(publishProblem("GAME", parseContent("GAME", { gameType: "MEMORY", pairs: [{ es: "uno", en: "one" }, { es: "dos", en: "two" }] }))).toMatch(/pictures/);
    expect(publishProblem("GAME", parseContent("GAME", { gameType: "MATCH", pairs: [{ es: "uno", en: "one" }, { es: "dos", en: "two" }] }))).toBeNull();
    expect(publishProblem("VIDEO", parseContent("VIDEO", {}))).toMatch(/video/);
  });
  it("reads YouTube links", () => {
    expect(youtubeIdFrom("https://youtu.be/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    expect(youtubeIdFrom("https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=1")).toBe("dQw4w9WgXcQ");
    expect(youtubeIdFrom("https://evil.com/watch?v=dQw4w9WgXcQ")).toBeNull();
  });
});
