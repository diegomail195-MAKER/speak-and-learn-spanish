import { describe, expect, it } from "vitest";
import { evaluateAnswer } from "./evaluate";
import { parseSpokenLetters } from "./letters";
import { normalizeText, phoneticKey } from "./normalize";

const perro = { expected: "Es un perro.", accepted: ["un perro", "el perro"], acceptShortAnswer: true };

describe("normalization", () => {
  it("strips punctuation, case and fillers; spells digits", () => {
    expect(normalizeText("¿Cómo estás?")).toBe("cómo estás");
    expect(normalizeText("Eh... tengo 7 años")).toBe("tengo siete años");
    expect(normalizeText("Tengo 25")).toBe("tengo veinticinco");
  });
  it("treats seseo, b/v, ll/y and silent h as the same sound", () => {
    expect(phoneticKey("cebra")).toBe(phoneticKey("zebra"));
    expect(phoneticKey("vaca")).toBe(phoneticKey("baca"));
    expect(phoneticKey("pollo")).toBe(phoneticKey("poyo"));
    expect(phoneticKey("hola")).toBe(phoneticKey("ola"));
    expect(phoneticKey("perro")).toBe(phoneticKey("pero"));
    expect(phoneticKey("gato")).not.toBe(phoneticKey("pato"));
  });
});

describe("phrase answers", () => {
  it("accepts the exact answer regardless of accents/case/punctuation", () => {
    expect(evaluateAnswer([{ text: "es un perro" }], perro).outcome).toBe("CORRECT");
    expect(evaluateAnswer([{ text: "Es un perro", confidence: 0.92 }], perro).outcome).toBe("CORRECT");
  });
  it("accepts accepted alternatives and the short answer", () => {
    expect(evaluateAnswer([{ text: "un perro" }], perro).outcome).toBe("CORRECT");
    expect(evaluateAnswer([{ text: "perro" }], perro).outcome).toBe("CORRECT");
  });
  it("does not accept the short answer when the teacher disallows it", () => {
    const strict = { ...perro, accepted: [], acceptShortAnswer: false };
    expect(evaluateAnswer([{ text: "perro", confidence: 0.9 }], strict).outcome).not.toBe("CORRECT");
  });
  it("tolerates typical transcription slips (pero/perro, accents)", () => {
    expect(evaluateAnswer([{ text: "es un pero" }], perro).outcome).toBe("CORRECT");
    expect(evaluateAnswer([{ text: "como estas" }], { expected: "¿Cómo estás?" }).outcome).toBe("CORRECT");
  });
  it("accepts the answer embedded in a little extra speech", () => {
    expect(evaluateAnswer([{ text: "mmm es un perro" }], perro).outcome).toBe("CORRECT");
    expect(evaluateAnswer([{ text: "creo que es un perro" }], perro).outcome).toBe("CORRECT");
  });
  it("rejects a clearly different answer", () => {
    const r = evaluateAnswer([{ text: "es un gato", confidence: 0.9 }], perro);
    expect(r.outcome).toBe("INCORRECT");
    expect(evaluateAnswer([{ text: "es una vaca", confidence: 0.85 }], perro).outcome).toBe("INCORRECT");
    expect(evaluateAnswer([{ text: "gato" }], perro).outcome).toBe("INCORRECT");
  });
  it("does not let a long contradicting sentence pass", () => {
    expect(evaluateAnswer([{ text: "no no no es un gato grande y bonito no es un perro", confidence: 0.9 }], { ...perro, acceptShortAnswer: false, accepted: [] }).outcome).not.toBe("CORRECT");
  });
  it("detects English answers", () => {
    const r = evaluateAnswer([{ text: "it's a dog", confidence: 0.9 }], perro);
    expect(r.outcome).toBe("INCORRECT");
    expect(r.reason).toBe("english_answer");
  });
  it("returns UNCERTAIN for silence, empty or very low-confidence audio (no penalty)", () => {
    expect(evaluateAnswer([], perro).outcome).toBe("UNCERTAIN");
    expect(evaluateAnswer([{ text: "  " }], perro).outcome).toBe("UNCERTAIN");
    expect(evaluateAnswer([{ text: "es un perro", confidence: 0.1 }], perro).outcome).toBe("UNCERTAIN");
    expect(evaluateAnswer([{ text: "eh" }], perro).outcome).toBe("UNCERTAIN");
    expect(evaluateAnswer([{ text: "e" }], perro).outcome).toBe("UNCERTAIN");
  });
  it("uses any of the engine's alternatives", () => {
    const r = evaluateAnswer([{ text: "es un pedo", confidence: 0.5 }, { text: "es un perro", confidence: 0.4 }], perro);
    expect(r.outcome).toBe("CORRECT");
  });
  it("handles conversation answers", () => {
    const spec = { expected: "Me llamo Diego", accepted: ["Mi nombre es Diego", "Soy Diego"], acceptShortAnswer: true };
    expect(evaluateAnswer([{ text: "me llamo diego" }], spec).outcome).toBe("CORRECT");
    expect(evaluateAnswer([{ text: "mi nombre es Diego" }], spec).outcome).toBe("CORRECT");
    expect(evaluateAnswer([{ text: "Diego" }], spec).outcome).toBe("CORRECT");
  });
  it("handles numbers written as digits", () => {
    expect(evaluateAnswer([{ text: "Tengo 8 años" }], { expected: "Tengo ocho años" }).outcome).toBe("CORRECT");
  });
});

describe("letter spelling", () => {
  it("parses Spanish letter names", () => {
    expect(parseSpokenLetters("de i e ge o").letters).toEqual(["D", "I", "E", "G", "O"]);
    expect(parseSpokenLetters("i griega o ele a ene de a").letters).toEqual(["Y", "O", "L", "A", "N", "D", "A"]);
    expect(parseSpokenLetters("doble ve a ele te e erre").letters).toEqual(["W", "A", "L", "T", "E", "R"]);
    expect(parseSpokenLetters("ene u eñe e zeta").letters).toEqual(["N", "U", "Ñ", "E", "Z"]);
  });
  it("scores correct spelling, including lead-ins and single-letter transcripts", () => {
    expect(evaluateAnswer([{ text: "de i e ge o" }], { expected: "Diego", mode: "LETTERS" }).outcome).toBe("CORRECT");
    expect(evaluateAnswer([{ text: "D, I, E, G, O" }], { expected: "Diego", mode: "LETTERS" }).outcome).toBe("CORRECT");
    expect(evaluateAnswer([{ text: "se deletrea pe e erre e zeta" }], { expected: "Pérez", mode: "LETTERS" }).outcome).toBe("CORRECT");
  });
  it("treats be/ve as the same sound", () => {
    expect(evaluateAnswer([{ text: "ve a ele e erre i a" }], { expected: "Valeria", mode: "LETTERS" }).outcome).toBe("CORRECT");
    expect(evaluateAnswer([{ text: "be a ele e erre i a" }], { expected: "Valeria", mode: "LETTERS" }).outcome).toBe("CORRECT");
  });
  it("points to the wrong letter", () => {
    const r = evaluateAnswer([{ text: "de i a ge o" }], { expected: "Diego", mode: "LETTERS" });
    expect(r.outcome).toBe("INCORRECT");
    expect(r.letterIndex).toBe(2);
  });
  it("is UNCERTAIN when the engine returns the whole word instead of letters", () => {
    const r = evaluateAnswer([{ text: "Diego" }], { expected: "Diego", mode: "LETTERS" });
    expect(r.outcome).toBe("UNCERTAIN");
    expect(r.reason).toBe("word_instead_of_letters");
  });
});
