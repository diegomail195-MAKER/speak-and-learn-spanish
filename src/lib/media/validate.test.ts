import { describe, expect, it } from "vitest";
import { isWebVtt, parseYouTubeId, sniffImage, sniffVideo } from "./validate";

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
});
