import { describe, expect, it } from "vitest";
import { evaluateAnswer } from "./evaluate";

const say = (text: string, expected: string, speakingMode?: "communication" | "pronunciation") => evaluateAnswer([{ text, confidence: null }], { expected, speakingMode, acceptShortAnswer: true }).outcome;

describe("learners with an English accent (communication mode)", () => {
  it("accepts accented forms the transcriber may write", () => {
    expect(say("roho", "rojo")).toBe("CORRECT"); // English h for the Spanish j
    expect(say("pero", "perro")).toBe("CORRECT"); // single r for rr
    expect(say("berde", "verde")).toBe("CORRECT"); // b/v
    expect(say("naranha", "naranja")).toBe("CORRECT");
    expect(say("amariyo", "amarillo")).toBe("CORRECT");
    expect(say("es rojo", "rojo")).toBe("CORRECT");
    expect(say("me llamo Michael", "Me llamo Michael")).toBe("CORRECT");
    expect(say("triangulo", "triángulo")).toBe("CORRECT");
    expect(say("sirculo", "círculo")).toBe("CORRECT");
  });
  it("still rejects a different answer", () => {
    expect(say("azul", "rojo")).not.toBe("CORRECT");
    expect(say("verde", "rojo")).not.toBe("CORRECT");
    expect(say("gato", "perro")).not.toBe("CORRECT");
    expect(say("cuadrado", "triángulo")).not.toBe("CORRECT");
    expect(say("ojo", "rojo")).not.toBe("CORRECT");
  });
  it("pronunciation practice is stricter", () => {
    expect(say("roho", "rojo", "pronunciation")).not.toBe("CORRECT");
    expect(say("rojo", "rojo", "pronunciation")).toBe("CORRECT");
  });
});
