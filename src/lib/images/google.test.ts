import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const env = { ...process.env };
afterEach(() => {
  process.env = { ...env };
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe("Google Images provider", () => {
  it("says exactly what is missing", async () => {
    delete process.env.GOOGLE_CSE_API_KEY;
    delete process.env.GOOGLE_CSE_CX;
    delete process.env.SERPAPI_API_KEY;
    const g = await import("./google");
    expect(g.googleProvider()).toBeNull();
    expect(g.googleMissing()).toMatch(/GOOGLE_CSE_API_KEY y GOOGLE_CSE_CX .* SERPAPI_API_KEY/);
    process.env.GOOGLE_CSE_API_KEY = "k";
    expect(g.googleMissing()).toMatch(/Falta GOOGLE_CSE_CX/);
  });

  it("searches images with safe search, ranks photos and signs each result", async () => {
    process.env.GOOGLE_CSE_API_KEY = "k";
    process.env.GOOGLE_CSE_CX = "cx";
    const calls: string[] = [];
    const item = (title: string, w: number) => ({ link: `https://img.example/${title}.jpg`, title, displayLink: "example.org", image: { thumbnailLink: `https://encrypted-tbn0.gstatic.com/${title}`, width: w, height: w, contextLink: `https://example.org/${title}` } });
    vi.stubGlobal("fetch", vi.fn(async (url: string) => {
      calls.push(url);
      return new Response(JSON.stringify({ items: [item("turkey-clipart", 2000), item("wild-turkey", 2400), item("tiny", 100)] }), { status: 200 });
    }));
    const g = await import("./google");
    const r = await g.searchGoogle("turkey animal");
    expect(calls[0]).toContain("searchType=image");
    expect(calls[0]).toContain("safe=active");
    expect(r.map((x) => x.title)).toEqual(["wild-turkey"]);
    expect(r[0].id).toMatch(/^g:[\w-]+\.[\w-]+$/);
    // A token that was changed is refused before anything is downloaded.
    const forged = r[0].id.replace(/\.[\w-]+$/, ".AAAA");
    await expect(g.fetchGoogleImage(forged)).rejects.toThrow(/Unknown image/);
  });
});
