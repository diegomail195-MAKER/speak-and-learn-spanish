import { describe, expect, it } from "vitest";
import { maskTagged, parseSegments, plainText, proposeTags, speechSegments, tagRange } from "./segments";

const apply = (text: string, base: "es-419" | "en-US" | "fr-FR") => {
  let t = text;
  for (const p of proposeTags(t, base).reverse()) t = tagRange(t, p.start, p.end, p.language, base);
  return t;
};

describe("language segments", () => {
  it("splits a Spanish question with an English word", () => {
    const t = "¿Cómo se dice en español, [en]love[/en]?";
    expect(plainText(t)).toBe("¿Cómo se dice en español, love?");
    expect(parseSegments(t, "es-419")).toEqual([
      { text: "¿Cómo se dice en español, ", language: "es-419" },
      { text: "love", language: "en-US" },
      { text: "?", language: "es-419" },
    ]);
    // punctuation is not a separate spoken run
    expect(speechSegments(t, "es-419")).toEqual([
      { text: "¿Cómo se dice en español,", language: "es-419" },
      { text: "love?", language: "en-US" },
    ]);
  });

  it("switches language several times in one sentence", () => {
    const t = "[en]How do you say[/en] manzana [en]in English?[/en]";
    expect(speechSegments(t, "es-419").map((s) => [s.language, s.text])).toEqual([
      ["en-US", "How do you say"],
      ["es-419", "manzana"],
      ["en-US", "in English?"],
    ]);
  });

  it("proposes LOVE as English and BONJOUR as French, never applying them itself", () => {
    expect(proposeTags("¿Cómo se dice en español, LOVE?", "es-419")).toMatchObject([{ word: "LOVE", language: "en-US", why: "capitals" }]);
    expect(proposeTags("¿Cómo se dice en español, BONJOUR?", "es-419")).toMatchObject([{ word: "BONJOUR", language: "fr-FR" }]);
    expect(proposeTags("Como se dice en espanol love", "es-419")).toMatchObject([{ word: "love", language: "en-US" }]);
    expect(proposeTags("¿Cómo se dice “gracias” en francés? Se dice «merci».", "es-419")).toMatchObject([{ word: "merci", language: "fr-FR", why: "quoted" }]);
  });

  it("keeps phrases together and tags Spanish inside an English sentence", () => {
    expect(apply("How do you say MANZANA in English?", "en-US")).toBe("How do you say [es]MANZANA[/es] in English?");
    expect(apply("How do you say MANZANA in English?", "es-419")).toBe("[en]How do you say[/en] MANZANA [en]in English[/en]?");
  });

  it("does not propose Spanish words that look English", () => {
    expect(proposeTags("El perro come pan y no tiene red.", "es-419")).toEqual([]);
  });

  it("masks tagged text for the spell checker with the same length", () => {
    const t = "Como se dice [en]love[/en]";
    expect(maskTagged(t)).toHaveLength(t.length);
    expect(maskTagged(t)).not.toContain("love");
  });
});
