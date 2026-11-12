import { describe, expect, it } from "vitest";
import { hasBlockedWords, isSafeAnnotation } from "./safety";

describe("image search safety", () => {
  it("blocks sexual, violent and drug words in English and Spanish, with or without accents", () => {
    for (const q of ["sexy girl", "Desnúdo", "PORNO", "pistola", "sangre en la calle", "dead body", "cerveza fría", "nsfw art", "mujer en bikini"]) {
      expect(hasBlockedWords(q), q).toBe(true);
    }
  });
  it("lets normal vocabulary through", () => {
    for (const q of ["manzana", "el perro", "classroom", "la familia", "árbol de Navidad", "bus escolar", "assessment", "zapatos", "el pez"]) {
      expect(hasBlockedWords(q), q).toBe(false);
    }
  });
  it("uses strict, fail-closed SafeSearch thresholds", () => {
    const clean = { adult: "VERY_UNLIKELY", violence: "VERY_UNLIKELY", racy: "UNLIKELY", medical: "UNLIKELY" } as const;
    expect(isSafeAnnotation(clean)).toBe(true);
    expect(isSafeAnnotation({ ...clean, adult: "POSSIBLE" })).toBe(false);
    expect(isSafeAnnotation({ ...clean, violence: "LIKELY" })).toBe(false);
    expect(isSafeAnnotation({ ...clean, racy: "POSSIBLE" })).toBe(false);
    expect(isSafeAnnotation({ ...clean, medical: "LIKELY" })).toBe(false);
    expect(isSafeAnnotation(null)).toBe(false);
  });
});
