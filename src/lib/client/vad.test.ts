import { describe, expect, it } from "vitest";
import { Vad } from "./vad";

const RATE = 16000;
const FRAME = RATE / 50;
function tone(db: number) {
  const amp = Math.sqrt(2) * Math.pow(10, db / 20);
  return Float32Array.from({ length: FRAME }, (_, i) => amp * Math.sin((2 * Math.PI * 220 * i) / RATE));
}
function noise(db: number) {
  const amp = Math.pow(10, db / 20) * Math.sqrt(3);
  return Float32Array.from({ length: FRAME }, () => (Math.random() * 2 - 1) * amp);
}

function run(vad: Vad, frames: Float32Array[], armed = true) {
  return frames.map((f) => vad.push(f, armed)).filter(Boolean);
}

describe("VAD", () => {
  it("detects a spoken utterance over classroom noise and ends it after silence", () => {
    const vad = new Vad();
    run(vad, Array.from({ length: 50 }, () => noise(-45)), false); // calibration while the prompt plays
    const ev = run(vad, [...Array.from({ length: 40 }, () => tone(-20)), ...Array.from({ length: 60 }, () => noise(-45))]);
    expect(ev[0]?.type).toBe("speech-start");
    const end = ev.find((e) => e!.type === "speech-end");
    expect(end).toBeTruthy();
    if (end?.type === "speech-end") expect(end.speechMs).toBeGreaterThanOrEqual(700);
  });
  it("ignores a short bump as noise", () => {
    const vad = new Vad();
    run(vad, Array.from({ length: 50 }, () => noise(-50)), false);
    const ev = run(vad, [...Array.from({ length: 5 }, () => tone(-15)), ...Array.from({ length: 60 }, () => noise(-50))]);
    expect(ev.map((e) => e!.type)).toEqual(["speech-start", "noise"]);
  });
  it("does nothing while disarmed (app audio playing)", () => {
    const vad = new Vad();
    expect(run(vad, Array.from({ length: 60 }, () => tone(-15)), false)).toEqual([]);
  });
  it("adapts to a louder room instead of triggering forever", () => {
    const vad = new Vad();
    const ev = run(vad, Array.from({ length: 300 }, () => noise(-38)));
    // steady noise may trigger at most once at the start, never continuously
    expect(ev.filter((e) => e!.type === "speech-end").length).toBeLessThanOrEqual(1);
  });
});
