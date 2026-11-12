import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { HttpError } from "@/lib/auth/guards";
import { IMAGE_MAX_BYTES, sniffImage } from "@/lib/media/validate";
import { hasBlockedWords, isSafeAnnotation, type SafeSearchAnnotation } from "./safety";

// Internet image search for the game editor. Two providers:
//  - Brave Search images (web-wide results like a big search engine, safesearch=strict) when
//    BRAVE_SEARCH_API_KEY is set;
//  - Pixabay (free, human-reviewed library, safesearch=true) when PIXABAY_API_KEY is set, used
//    alone or as the fallback when Brave fails or finds nothing.
// Teachers only see results; images are copied into our private storage when chosen, so students
// never load anything from outside the platform. Brave images are always downloaded from Brave's
// own image proxy (imgs.search.brave.com), never from an arbitrary URL.

export type ImageResult = { id: string; thumb: string; tags: string; author: string; pageUrl: string; width: number; height: number; license: string };
export type ImageSize = "all" | "small" | "medium" | "large";
const LICENSE = "Pixabay Content License";

/** Size buckets by the original's longest side (Pixabay reports it). */
export function sizeOf(w: number, h: number): Exclude<ImageSize, "all"> {
  const m = Math.max(w, h);
  return m < 1500 ? "small" : m < 3000 ? "medium" : "large";
}

type PixabayHit = { id: number; previewURL: string; webformatURL: string; tags: string; user: string; pageURL: string; imageWidth?: number; imageHeight?: number };

const PIXABAY_HOSTS = new Set(["pixabay.com", "cdn.pixabay.com"]);

const braveKey = () => process.env.BRAVE_SEARCH_API_KEY?.trim();
export const imageSearchEnabled = () => !!process.env.PIXABAY_API_KEY || !!braveKey();
const visionKey = () => process.env.GOOGLE_VISION_API_KEY;

async function pixabay(params: Record<string, string>): Promise<PixabayHit[]> {
  const key = process.env.PIXABAY_API_KEY;
  if (!key) throw new HttpError(503, "La búsqueda de imágenes aún no está activada (falta BRAVE_SEARCH_API_KEY o PIXABAY_API_KEY).");
  const qs = new URLSearchParams({ key, safesearch: "true", ...params });
  const res = await fetch(`https://pixabay.com/api/?${qs}`, { cache: "no-store", signal: AbortSignal.timeout(10_000) });
  if (!res.ok) throw new HttpError(502, "The image search is not available right now. Try again later.");
  const json = (await res.json()) as { hits?: PixabayHit[] };
  return json.hits ?? [];
}

function pixabayUrl(raw: string): string | null {
  try {
    const u = new URL(raw);
    return u.protocol === "https:" && PIXABAY_HOSTS.has(u.hostname) ? u.toString() : null;
  } catch {
    return null;
  }
}

async function download(url: string, max = IMAGE_MAX_BYTES): Promise<Buffer | null> {
  const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(15_000) });
  if (!res.ok || !res.body) return null;
  if (Number(res.headers.get("content-length") ?? 0) > max) return null;
  const buf = Buffer.from(await res.arrayBuffer());
  return buf.length <= max ? buf : null;
}

/** Google Cloud Vision SafeSearch; returns one verdict per image, false on any error (fail closed). */
async function visionSafe(images: Buffer[]): Promise<boolean[]> {
  const key = visionKey();
  if (!key) return images.map(() => true);
  const out: boolean[] = [];
  for (let i = 0; i < images.length; i += 16) {
    const chunk = images.slice(i, i + 16);
    try {
      const res = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${encodeURIComponent(key)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requests: chunk.map((b) => ({ image: { content: b.toString("base64") }, features: [{ type: "SAFE_SEARCH_DETECTION" }] })) }),
        signal: AbortSignal.timeout(20_000),
      });
      if (!res.ok) {
        console.error("vision safesearch failed", res.status);
        out.push(...chunk.map(() => false));
        continue;
      }
      const json = (await res.json()) as { responses?: { safeSearchAnnotation?: SafeSearchAnnotation; error?: unknown }[] };
      chunk.forEach((_, k) => {
        const r = json.responses?.[k];
        out.push(!r?.error && isSafeAnnotation(r?.safeSearchAnnotation));
      });
    } catch (e) {
      console.error("vision safesearch error", e);
      out.push(...chunk.map(() => false));
    }
  }
  return out;
}

const smallUrl = (h: PixabayHit) => pixabayUrl(h.webformatURL.replace("_640.", "_340.")) ?? pixabayUrl(h.previewURL);

async function searchPixabay(q: string, kind: "photo" | "illustration" | "all", size: ImageSize): Promise<ImageResult[]> {
  const hits = (await pixabay({ q, image_type: kind, lang: "es", per_page: size === "all" ? "30" : "100", order: "popular", ...(size === "large" ? { min_width: "3000" } : {}) }))
    .filter((h) => !hasBlockedWords(h.tags) && pixabayUrl(h.previewURL) && pixabayUrl(h.webformatURL))
    .filter((h) => size === "all" || !h.imageWidth || !h.imageHeight || sizeOf(h.imageWidth, h.imageHeight) === size)
    .slice(0, 30);

  const safe = await visionFilter(hits, smallUrl);
  return safe.slice(0, 24).map((h) => ({ id: String(h.id), thumb: h.previewURL, tags: h.tags, author: h.user, pageUrl: h.pageURL, width: h.imageWidth ?? 0, height: h.imageHeight ?? 0, license: LICENSE }));
}

/** With GOOGLE_VISION_API_KEY set, keeps only the items whose thumbnail Vision SafeSearch passes. */
async function visionFilter<T>(items: T[], urlOf: (x: T) => string | null): Promise<T[]> {
  if (!visionKey()) return items;
  const bytes = await Promise.all(items.map(async (x) => {
    const u = urlOf(x);
    return u ? await download(u, 1024 * 1024).catch(() => null) : null;
  }));
  const withBytes = items.map((x, i) => ({ x, b: bytes[i] })).filter((y): y is { x: T; b: Buffer } => !!y.b);
  const verdicts = await visionSafe(withBytes.map((y) => y.b));
  return withBytes.filter((_, i) => verdicts[i]).map((y) => y.x);
}

// ── Brave ───────────────────────────────────────────────────────────────────────────────────
type BraveResult = { title?: string | null; url?: string | null; source?: string | null; thumbnail?: { src?: string | null; width?: number | null; height?: number | null } | null; properties?: { url?: string | null; width?: number | null; height?: number | null } | null };
type BravePick = { t: string; p: string; s: string; i: string };

const BRAVE_IMG_HOST = "imgs.search.brave.com";
function braveThumb(raw: string | null | undefined): string | null {
  try {
    const u = new URL(raw ?? "");
    return u.protocol === "https:" && u.hostname === BRAVE_IMG_HOST ? u.toString() : null;
  } catch {
    return null;
  }
}

const sign = (payload: string) => createHmac("sha256", `img-pick:${braveKey() ?? ""}`).update(payload).digest("base64url").slice(0, 32);
/** The id the browser sends back on import: the result data, signed so it cannot be forged. */
function braveId(pick: BravePick): string {
  const payload = Buffer.from(JSON.stringify(pick)).toString("base64url");
  return `b.${sign(payload)}.${payload}`;
}
function readBraveId(id: string): BravePick | null {
  const [, mac, payload] = id.split(".");
  if (!mac || !payload) return null;
  const want = Buffer.from(sign(payload));
  const got = Buffer.from(mac);
  if (want.length !== got.length || !timingSafeEqual(want, got)) return null;
  try {
    const p = JSON.parse(Buffer.from(payload, "base64url").toString()) as BravePick;
    return braveThumb(p.i) ? p : null;
  } catch {
    return null;
  }
}

/** Web images are smaller than library originals: buckets by the longest side. */
function webSizeOf(w: number, h: number): Exclude<ImageSize, "all"> {
  const m = Math.max(w, h);
  return m < 600 ? "small" : m < 1400 ? "medium" : "large";
}

async function searchBrave(q: string, size: ImageSize): Promise<ImageResult[]> {
  const key = braveKey();
  if (!key) return [];
  const qs = new URLSearchParams({ q, safesearch: "strict", count: "100", search_lang: "es", country: "ALL", spellcheck: "1" });
  const res = await fetch(`https://api.search.brave.com/res/v1/images/search?${qs}`, {
    headers: { Accept: "application/json", "X-Subscription-Token": key },
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new HttpError(502, `Brave image search failed (${res.status}).`);
  const json = (await res.json()) as { results?: BraveResult[]; extra?: { might_be_offensive?: boolean } };
  if (json.extra?.might_be_offensive) return [];
  const hits = (json.results ?? [])
    .map((r) => ({ r, thumb: braveThumb(r.thumbnail?.src), w: r.properties?.width ?? r.thumbnail?.width ?? 0, h: r.properties?.height ?? r.thumbnail?.height ?? 0 }))
    .filter((x) => x.thumb && !hasBlockedWords(`${x.r.title ?? ""} ${x.r.url ?? ""}`))
    .filter((x) => size === "all" || !x.w || !x.h || webSizeOf(x.w, x.h) === size)
    .slice(0, 30);
  const safe = await visionFilter(hits, (x) => x.thumb);
  return safe.slice(0, 24).map((x) => {
    const pick: BravePick = { t: (x.r.title ?? "").slice(0, 80), p: (x.r.url ?? "").slice(0, 300), s: (x.r.source ?? "").slice(0, 80), i: x.thumb! };
    return { id: braveId(pick), thumb: x.thumb!, tags: pick.t || q, author: pick.s, pageUrl: pick.p, width: x.w, height: x.h, license: "Web (Brave Search)" };
  });
}

/** Brave first (when configured), Pixabay when Brave is off, fails or finds nothing. */
export async function searchImages(query: string, kind: "photo" | "illustration" | "all", size: ImageSize = "all"): Promise<ImageResult[]> {
  const q = query.trim().slice(0, 100);
  if (!q) return [];
  if (hasBlockedWords(q)) throw new HttpError(422, "Esa búsqueda no está permitida. Prueba con otra palabra.");
  if (!imageSearchEnabled()) throw new HttpError(503, "La búsqueda de imágenes aún no está activada (falta BRAVE_SEARCH_API_KEY o PIXABAY_API_KEY).");
  const hasPixabay = !!process.env.PIXABAY_API_KEY;
  if (braveKey()) {
    try {
      const r = await searchBrave(q, size);
      if (r.length || !hasPixabay) return r;
    } catch (e) {
      console.error("brave image search", e);
      if (!hasPixabay) throw e;
    }
  }
  return searchPixabay(q, kind, size);
}

/**
 * Re-reads the image from Pixabay by id (never trusts a URL sent by the browser), re-checks it,
 * downloads it and returns the bytes ready to be stored.
 */
export async function fetchSafeImage(id: string): Promise<{ data: Buffer; mime: NonNullable<ReturnType<typeof sniffImage>>; name: string; provider: "brave" | "pixabay" }> {
  if (id.startsWith("b.")) return fetchBraveImage(id);
  if (!/^\d{1,12}$/.test(id)) throw new HttpError(400, "Unknown image");
  const [hit] = await pixabay({ id });
  if (!hit || hasBlockedWords(hit.tags)) throw new HttpError(404, "Esta imagen no está disponible.");
  const url = pixabayUrl(hit.webformatURL);
  const data = url ? await download(url) : null;
  if (!data) throw new HttpError(502, "Could not download the image. Try another one.");
  const mime = sniffImage(data);
  if (!mime) throw new HttpError(415, "Unsupported image");
  const [ok] = await visionSafe([data]);
  if (!ok) throw new HttpError(422, "Esta imagen fue bloqueada por el filtro de seguridad.");
  // Source, author and license travel with the file name (shown in the media library).
  const name = `${hit.tags.split(",")[0]?.trim() || "image"} — ${hit.user} / Pixabay (${LICENSE}) ${hit.pageURL}`.slice(0, 200);
  return { data, mime, name, provider: "pixabay" };
}

async function fetchBraveImage(id: string) {
  const pick = readBraveId(id);
  if (!pick || hasBlockedWords(`${pick.t} ${pick.p}`)) throw new HttpError(404, "Esta imagen no está disponible.");
  const data = await download(pick.i);
  if (!data) throw new HttpError(502, "Could not download the image. Try another one.");
  const mime = sniffImage(data);
  if (!mime) throw new HttpError(415, "Unsupported image");
  const [ok] = await visionSafe([data]);
  if (!ok) throw new HttpError(422, "Esta imagen fue bloqueada por el filtro de seguridad.");
  // Where it was found travels with the file name (shown in the media library).
  const name = `${pick.t || "image"} — ${pick.s || "web"} ${pick.p}`.slice(0, 200);
  return { data, mime, name, provider: "brave" as const };
}
