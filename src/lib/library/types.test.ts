import { describe, expect, it } from "vitest";
import { KINDS, embedFor, fileIdsOf, parseContent, publicUrl, publishProblem, youtubeIdFrom, type AnyContent } from "./types";

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

describe("links (Add Link)", () => {
  it("accepts only public http(s) addresses", () => {
    expect(publicUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
    expect(publicUrl("http://example.org/page")).toBe("http://example.org/page");
    for (const bad of ["javascript:alert(1)", "ftp://example.org/x", "https://localhost/x", "http://127.0.0.1/", "https://user:pw@example.org/", "example.org", "", "https://intranet/"]) expect(publicUrl(bad)).toBeNull();
  });
  it("embeds YouTube, Vimeo and Google documents; other sites open in a new tab", () => {
    expect(embedFor("https://youtu.be/dQw4w9WgXcQ")?.src).toBe("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0");
    expect(embedFor("https://vimeo.com/76979871")?.src).toBe("https://player.vimeo.com/video/76979871");
    expect(embedFor("https://docs.google.com/document/d/1AbCdEfGhIjKlMnOp/edit")?.src).toBe("https://docs.google.com/document/d/1AbCdEfGhIjKlMnOp/preview");
    expect(embedFor("https://drive.google.com/file/d/1AbCdEfGhIjKlMnOp/view")?.src).toBe("https://drive.google.com/file/d/1AbCdEfGhIjKlMnOp/preview");
    expect(embedFor("https://wordwall.net/resource/123/animals")).toBeNull();
  });
  it("a link alone is publishable for every type", () => {
    for (const k of KINDS) expect(publishProblem(k, parseContent(k, { link: { url: "https://example.org/a" } }) as AnyContent)).toBeNull();
    expect(() => parseContent("VIDEO", { link: { url: "javascript:alert(1)" } })).toThrow();
  });
});
