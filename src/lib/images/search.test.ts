import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const png = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(64)]);
const hit = (id: number, tags: string, host = "pixabay.com") => ({
  id,
  tags,
  user: "artist",
  pageURL: `https://pixabay.com/photos/${id}/`,
  previewURL: `https://cdn.pixabay.com/photo/${id}_150.png`,
  webformatURL: `https://${host}/get/${id}_640.png`,
});

let calls: string[] = [];
function mockFetch(hits: unknown[], vision?: (n: number) => unknown) {
  calls = [];
  vi.stubGlobal("fetch", vi.fn(async (url: string, init?: RequestInit) => {
    calls.push(url);
    if (url.startsWith("https://pixabay.com/api/")) return new Response(JSON.stringify({ hits }), { status: 200 });
    if (url.startsWith("https://vision.googleapis.com/")) {
      const n = JSON.parse(String(init?.body)).requests.length;
      return new Response(JSON.stringify(vision?.(n)), { status: 200 });
    }
    return new Response(png, { status: 200 });
  }));
}

describe("internet image search", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.PIXABAY_API_KEY = "test";
    delete process.env.GOOGLE_VISION_API_KEY;
  });
  afterEach(() => vi.unstubAllGlobals());

  it("refuses blocked searches before calling the provider", async () => {
    mockFetch([]);
    const { searchImages } = await import("./search");
    await expect(searchImages("chica sexy", "all")).rejects.toThrow(/no está permitida/);
    expect(calls).toHaveLength(0);
  });

  it("always asks Pixabay for safesearch and drops results with blocked tags or foreign hosts", async () => {
    mockFetch([hit(1, "apple, fruit"), hit(2, "woman, bikini, beach"), hit(3, "dog", "evil.example")]);
    const { searchImages } = await import("./search");
    const r = await searchImages("manzana", "photo");
    expect(calls[0]).toContain("safesearch=true");
    expect(r.map((x) => x.id)).toEqual(["1"]);
  });

  it("with Vision enabled, hides images it flags and blocks on errors (fail closed)", async () => {
    process.env.GOOGLE_VISION_API_KEY = "v";
    const ok = { safeSearchAnnotation: { adult: "VERY_UNLIKELY", violence: "VERY_UNLIKELY", racy: "VERY_UNLIKELY", medical: "VERY_UNLIKELY" } };
    const bad = { safeSearchAnnotation: { adult: "VERY_UNLIKELY", violence: "LIKELY", racy: "VERY_UNLIKELY", medical: "VERY_UNLIKELY" } };
    mockFetch([hit(1, "cat"), hit(2, "toy"), hit(3, "car")], () => ({ responses: [ok, bad, { error: { message: "x" } }] }));
    const { searchImages } = await import("./search");
    expect((await searchImages("gato", "all")).map((x) => x.id)).toEqual(["1"]);
  });

  it("imports by id only, re-checking the image", async () => {
    mockFetch([hit(7, "apple")]);
    const { fetchSafeImage } = await import("./search");
    const img = await fetchSafeImage("7");
    expect(img.mime).toBe("image/png");
    expect(img.name).toContain("Pixabay");
    expect(calls[0]).toContain("id=7");
    await expect(fetchSafeImage("https://evil.example/x.png")).rejects.toThrow();
  });

  it("explains when the key is missing", async () => {
    delete process.env.PIXABAY_API_KEY;
    mockFetch([]);
    const { searchImages } = await import("./search");
    await expect(searchImages("perro", "all")).rejects.toThrow(/PIXABAY_API_KEY/);
  });
});

describe("Brave image search", () => {
  const brave = (title: string, src = "https://imgs.search.brave.com/abc/rs:fit:500:0/g:ce/x.png") => ({
    type: "image_result",
    title,
    url: "https://example.com/page",
    source: "example.com",
    thumbnail: { src, width: 500, height: 400 },
    properties: { url: "https://example.com/big.png", width: 1000, height: 800 },
  });
  let urls: string[] = [];
  function mockBrave(results: unknown[], pixabayHits: unknown[] = [], status = 200) {
    urls = [];
    vi.stubGlobal("fetch", vi.fn(async (url: string, init?: RequestInit) => {
      urls.push(url);
      if (url.startsWith("https://api.search.brave.com/")) {
        expect((init?.headers as Record<string, string>)["X-Subscription-Token"]).toBe("brave-key");
        return new Response(JSON.stringify({ type: "images", results, extra: { might_be_offensive: false } }), { status });
      }
      if (url.startsWith("https://pixabay.com/api/")) return new Response(JSON.stringify({ hits: pixabayHits }), { status: 200 });
      return new Response(png, { status: 200 });
    }));
  }
  beforeEach(() => {
    vi.resetModules();
    process.env.BRAVE_SEARCH_API_KEY = "brave-key";
    delete process.env.PIXABAY_API_KEY;
    delete process.env.GOOGLE_VISION_API_KEY;
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.BRAVE_SEARCH_API_KEY;
  });

  it("asks Brave with strict safesearch and drops blocked titles and foreign thumbnail hosts", async () => {
    mockBrave([brave("manzana roja"), brave("sexy manzana"), brave("manzana verde", "https://evil.example/x.png")]);
    const { searchImages } = await import("./search");
    const r = await searchImages("manzana", "all");
    expect(urls[0]).toContain("safesearch=strict");
    expect(r.map((x) => x.tags)).toEqual(["manzana roja"]);
    expect(r[0].id.startsWith("b.")).toBe(true);
  });

  it("imports only signed ids, downloading from Brave's image proxy", async () => {
    mockBrave([brave("perro")]);
    const { searchImages, fetchSafeImage } = await import("./search");
    const [hit] = await searchImages("perro", "all");
    const img = await fetchSafeImage(hit.id);
    expect(img.provider).toBe("brave");
    expect(urls.at(-1)).toMatch(/^https:\/\/imgs\.search\.brave\.com\//);
    const [, mac, payload] = hit.id.split(".");
    const forged = Buffer.from(JSON.stringify({ t: "x", p: "", s: "", i: "https://evil.example/x.png" })).toString("base64url");
    await expect(fetchSafeImage(`b.${mac}.${forged}`)).rejects.toThrow(/no está disponible/);
    await expect(fetchSafeImage(`b.AAAA.${payload}`)).rejects.toThrow(/no está disponible/);
  });

  it("falls back to Pixabay when Brave fails", async () => {
    process.env.PIXABAY_API_KEY = "test";
    mockBrave([], [hit(7, "gato")], 429);
    const { searchImages } = await import("./search");
    const r = await searchImages("gato", "all");
    expect(r.map((x) => x.id)).toEqual(["7"]);
  });
});
