import { describe, expect, it } from "vitest";
import { applyAll, checkSpanish } from "./spanish-check";

describe("Spanish writing suggestions", () => {
  it("turns 'Como estas' into '¿Cómo estás?'", () => {
    expect(applyAll("Como estas", checkSpanish("Como estas"))).toBe("¿Cómo estás?");
  });
  it("fixes 'El nino esta feliz'", () => {
    expect(applyAll("El nino esta feliz", checkSpanish("El nino esta feliz"))).toBe("El niño está feliz.");
  });
  it("adds ¿ to questions and keeps correct text alone", () => {
    expect(applyAll("Que animal es?", checkSpanish("Que animal es?"))).toBe("¿Qué animal es?");
    expect(checkSpanish("¿Qué animal es?")).toEqual([]);
    expect(checkSpanish("Es un perro.")).toEqual([]);
  });
  it("adds ¡ to exclamations", () => {
    expect(applyAll("Muy bien!", checkSpanish("Muy bien!"))).toBe("¡Muy bien!");
  });
  it("respects the teacher's keep-list (names, invented words)", () => {
    expect(checkSpanish("Nino", ["nino"])).toEqual([]);
  });
  it("does not touch 'esta' as a demonstrative", () => {
    expect(checkSpanish("esta casa").length).toBe(0);
  });
  it("preserves capitalization", () => {
    expect(applyAll("ARBOL", checkSpanish("ARBOL"))).toBe("ÁRBOL");
  });
});
