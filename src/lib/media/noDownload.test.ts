import { describe, expect, it } from "vitest";
import { isMediaOpenedAsPage } from "./noDownload";

const req = (dest?: string) => new Request("http://x/api/media/1", { headers: dest ? { "sec-fetch-dest": dest } : {} });

describe("isMediaOpenedAsPage", () => {
  it("refuses a video or song opened in a tab", () => {
    expect(isMediaOpenedAsPage(req("document"), "video/mp4")).toBe(true);
    expect(isMediaOpenedAsPage(req("iframe"), "audio/mpeg")).toBe(true);
  });
  it("lets the players on our pages load them", () => {
    expect(isMediaOpenedAsPage(req("video"), "video/mp4")).toBe(false);
    expect(isMediaOpenedAsPage(req("audio"), "audio/mpeg")).toBe(false);
    expect(isMediaOpenedAsPage(req(), "video/mp4")).toBe(false);
  });
  it("leaves pictures and documents alone", () => {
    expect(isMediaOpenedAsPage(req("document"), "image/png")).toBe(false);
    expect(isMediaOpenedAsPage(req("document"), "application/pdf")).toBe(false);
  });
});
