import { describe, expect, it } from "vitest";
import { pcmToMp3 } from "./mp3";

describe("pcmToMp3", () => {
  it("encodes mono speech-rate PCM into a much smaller MP3", () => {
    const rate = 24000;
    const pcm = new Int16Array(rate).map((_, i) => Math.round(Math.sin((2 * Math.PI * 220 * i) / rate) * 6000));
    const mp3 = pcmToMp3(pcm, rate);
    expect(mp3.length).toBeGreaterThan(1000);
    expect(mp3.length).toBeLessThan(pcm.length * 2 * 0.25);
    // MPEG audio frame sync (11 set bits) at the start
    expect(mp3[0]).toBe(0xff);
    expect(mp3[1] & 0xe0).toBe(0xe0);
  });
});
