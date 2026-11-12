import "server-only";
import { HttpError } from "@/lib/auth/guards";
import { IMAGE_MAX_BYTES, sniffImage } from "@/lib/media/validate";
import { hasBlockedWords, isSafeAnnotation, type SafeSearchAnnotation } from "./safety";

// Internet image search for the game editor, from Pixabay (free, human-reviewed library, called
// with safesearch=true). Teachers only see results; images are copied into our private storage
// when chosen, so students never load anything from outside the platform.

export type ImageResult = { id: string; thumb: string; tags: string; author: string; pageUrl: string };

type PixabayHit = { id: number; previewURL: string; webformatURL: string; tags: string; user: string; pageURL: string };

const PIXABAY_HOSTS = new Set(["pixabay.com", "cdn.pixabay.com"]);

export const imageSearchEnabled = () => !!process.env.PIXABAY_API_KEY;
const visionKey = () => process.env.GOOGLE_VISION_API_KEY;

async function pixabay(params: Record<string, string>): Promise<PixabayHit[]> {
  const key = process.env.PIXABAY_API_KEY;
  if (!key) throw new HttpError(503, "La búsqueda de imágenes aún no está activada (falta PIXABAY_API_KEY).");
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

export async function searchImages(query: string, kind: "photo" | "illustration" | "all"): Promise<ImageResult[]> {
  const q = query.trim().slice(0, 100);
  if (!q) return [];
  if (hasBlockedWords(q)) throw new HttpError(422, "Esa búsqueda no está permitida. Prueba con otra palabra.");
  const hits = (await pixabay({ q, image_type: kind, lang: "es", per_page: "30", order: "popular" }))
    .filter((h) => !hasBlockedWords(h.tags) && pixabayUrl(h.previewURL) && pixabayUrl(h.webformatURL));

  let safe = hits;
  if (visionKey()) {
    const bytes = await Promise.all(hits.map(async (h) => {
      const u = smallUrl(h);
      return u ? await download(u, 1024 * 1024).catch(() => null) : null;
    }));
    const withBytes = hits.map((h, i) => ({ h, b: bytes[i] })).filter((x): x is { h: PixabayHit; b: Buffer } => !!x.b);
    const verdicts = await visionSafe(withBytes.map((x) => x.b));
    safe = withBytes.filter((_, i) => verdicts[i]).map((x) => x.h);
  }
  return safe.slice(0, 24).map((h) => ({ id: String(h.id), thumb: h.previewURL, tags: h.tags, author: h.user, pageUrl: h.pageURL }));
}

/**
 * Re-reads the image from Pixabay by id (never trusts a URL sent by the browser), re-checks it,
 * downloads it and returns the bytes ready to be stored.
 */
export async function fetchSafeImage(id: string): Promise<{ data: Buffer; mime: NonNullable<ReturnType<typeof sniffImage>>; name: string }> {
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
  const name = `${hit.tags.split(",")[0]?.trim() || "image"} (Pixabay · ${hit.user})`;
  return { data, mime, name };
}
