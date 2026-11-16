import { describe, expect, it } from "vitest";
import es from "./accents-es.json";
import fr from "./accents-fr.json";
import { afterInput, detectLang, fixWord, onLeave } from "./autocorrect";

// Simulates typing `text` one character at a time, like a teacher on an English keyboard.
function type(text: string, lang: "es" | "en" | "fr", skip = new Set<string>()) {
  const map = lang === "es" ? es : lang === "fr" ? fr : {};
  let v = "";
  let caret = 0;
  for (const ch of text) {
    v = v.slice(0, caret) + ch + v.slice(caret);
    caret += 1;
    const r = afterInput(v, caret, ch, lang, map, skip);
    v = r.value;
    caret = r.caret;
  }
  return v;
}

describe("autocorrect", () => {
  it("adds Spanish accents, ñ and ¿ ¡", () => {
    expect(type("el nino ", "es")).toBe("el niño ");
    expect(type("Que color es este?", "es")).toBe("¿Qué color es este?");
    expect(type("como estas?", "es")).toBe("¿cómo estas?"); // only the question word: "estas" can mean "these"
    expect(type("que bien!", "es")).toBe("¡que bien!");
    expect(type("el pinguino come.", "es")).toBe("el pingüino come.");
  });

  it("leaves ambiguous words alone", () => {
    expect(type("esta casa esta aqui ", "es")).toBe("esta casa esta aquí ");
  });

  it("keeps capitals", () => {
    expect(fixWord("NINO", "es", es)).toBe("NIÑO");
    expect(fixWord("Arbol", "es", es)).toBe("Árbol");
  });

  it("French accents and the space before ? ! : ;", () => {
    expect(type("une ecole ", "fr")).toBe("une école ");
    expect(type("ca va?", "fr")).toBe("ça va ?");
  });

  it("English contractions and I", () => {
    expect(type("i dont know ", "en")).toBe("I don't know ");
    expect(type("nino ", "en")).toBe("nino ");
  });

  it("skips what the teacher undid", () => {
    expect(type("el nino ", "es", new Set(["nino"]))).toBe("el nino ");
    expect(type("que?", "es", new Set(["¿"]))).toBe("qué?");
  });

  it("corrects the last word when leaving the field", () => {
    expect(onLeave("la cancion", "es", es).value).toBe("la canción");
  });

  it("detects the language being written", () => {
    expect(detectLang("what is this", "es")).toBe("en");
    expect(detectLang("le chat est noir", "es")).toBe("fr");
    expect(detectLang("rojo", "es")).toBe("es");
    expect(detectLang("red", "en")).toBe("en");
  });
});
