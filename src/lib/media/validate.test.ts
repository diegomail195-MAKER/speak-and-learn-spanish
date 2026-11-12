import { describe, expect, it } from "vitest";
import { isWebVtt, parseYouTubeId, sniffAudio, sniffImage, sniffVideo } from "./validate";

describe("upload validation", () => {
  it("parses YouTube links", () => {
    expect(parseYouTubeId("https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10")).toBe("dQw4w9WgXcQ");
    expect(parseYouTubeId("https://youtu.be/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    expect(parseYouTubeId("https://www.youtube.com/shorts/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    expect(parseYouTubeId("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    expect(parseYouTubeId("dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    expect(parseYouTubeId("https://evil.example/watch?v=dQw4w9WgXcQ")).toBeNull();
    expect(parseYouTubeId("not a link")).toBeNull();
  });
  it("sniffs video containers by bytes", () => {
    const mp4 = new Uint8Array([0, 0, 0, 0x20, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d]);
    const webm = new Uint8Array([0x1a, 0x45, 0xdf, 0xa3, 0, 0, 0, 0, 0, 0, 0, 0]);
    expect(sniffVideo(mp4)).toBe("video/mp4");
    expect(sniffVideo(webm)).toBe("video/webm");
    expect(sniffVideo(new Uint8Array(12))).toBeNull();
    expect(sniffImage(mp4)).toBeNull();
  });
  it("checks WebVTT", () => {
    expect(isWebVtt("WEBVTT\n\n00:00.000 --> 00:01.000\nHola")).toBe(true);
    expect(isWebVtt("<script>")).toBe(false);
  });
  it("sniffs audio by bytes", () => {
    const b = (s: string, pad = 12) => new Uint8Array([...Buffer.from(s, "latin1"), ...new Array(Math.max(0, pad - s.length)).fill(0)]);
    expect(sniffAudio(b("ID3\x04"))).toBe("audio/mpeg");
    expect(sniffAudio(b("RIFF\0\0\0\0WAVE"))).toBe("audio/wav");
    expect(sniffAudio(b("OggS"))).toBe("audio/ogg");
    expect(sniffAudio(new Uint8Array([0x1a, 0x45, 0xdf, 0xa3, 0, 0, 0, 0, 0, 0, 0, 0]))).toBe("audio/webm");
    expect(sniffAudio(b("\0\0\0\x20ftypM4A "))).toBe("audio/mp4");
    expect(sniffAudio(b("<html><body>"))).toBeNull();
  });
});
