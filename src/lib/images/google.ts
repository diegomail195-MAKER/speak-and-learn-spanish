import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { HttpError } from "@/lib/auth/guards";
import { IMAGE_MAX_BYTES, sniffImage } from "@/lib/media/validate";
import { rankPhotos } from "./photoQuery";
import { hasBlockedWords } from "./safety";

// Google Images inside the flashcard editor, through an authorized API (keys stay on the server):
//   • Google Programmable Search (Custom Search JSON API): GOOGLE_CSE_API_KEY + GOOGLE_CSE_CX
//     (a search engine with "Image search" on and "Search the entire web").
//   • or SerpApi's Google Images engine: SERPAPI_API_KEY.
// Results carry a signed token for the image address, so the server only ever downloads an image
// it returned itself; the download refuses private addresses, follows few redirects and is size
// limited, then the bytes are checked like any upload.

export type GooglePhoto = { id: string; title: string; thumb: string; width: number; height: number; author: string; license: string; pageUrl: string };

const TEST_ENDPOINT = () => process.env.GOOGLE_IMAGES_TEST_ENDPOINT; // e2e only: a local fake API
type Provider = { kind: "cse"; key: string; cx: string } | { kind: "serpapi"; key: string };

export function googleProvider(): Provider | null {
  const key = process.env.GOOGLE_CSE_API_KEY, cx = process.env.GOOGLE_CSE_CX, serp = process.env.SERPAPI_API_KEY;
  if (key && cx) return { kind: "cse", key, cx };
  if (serp) return { kind: "serpapi", key: serp };
  return null;
}

/** Exactly what is missing to turn Google Images on (shown to the teacher). */
export function googleMissing(): string | null {
  if (googleProvider()) return null;
  const key = !!process.env.GOOGLE_CSE_API_KEY, cx = !!process.env.GOOGLE_CSE_CX;
  if (key && !cx) return "Falta GOOGLE_CSE_CX (el ID del buscador de Google Programmable Search) en Vercel.";
  if (cx && !key) return "Falta GOOGLE_CSE_API_KEY (la clave de Google Custom Search JSON API) en Vercel.";
  return "Google Imágenes no está activado: faltan GOOGLE_CSE_API_KEY y GOOGLE_CSE_CX (Google Programmable Search con búsqueda de imágenes) o SERPAPI_API_KEY en las variables de entorno de Vercel.";
}

const signKey = (p: Provider) => createHash("sha256").update(`lextro-image-token:${p.key}`).digest();
const b64 = (s: string) => Buffer.from(s).toString("base64url");

function sign(p: Provider, data: { u: string; s: string; t: string }) {
  const body = b64(JSON.stringify(data));
  return `g:${body}.${createHmac("sha256", signKey(p)).update(body).digest("base64url")}`;
}

function verify(p: Provider, id: string): { u: string; s: string; t: string } | null {
  const m = /^g:([A-Za-z0-9_-]+)\.([A-Za-z0-9_-]+)$/.exec(id);
  if (!m) return null;
  const want = createHmac("sha256", signKey(p)).update(m[1]).digest();
  const got = Buffer.from(m[2], "base64url");
  if (got.length !== want.length || !timingSafeEqual(got, want)) return null;
  try {
    return JSON.parse(Buffer.from(m[1], "base64url").toString());
  } catch {
    return null;
  }
}

type Raw = { link: string; thumb: string; width: number; height: number; title: string; page: string; site: string };

async function query(p: Provider, q: string): Promise<Raw[]> {
  const base = TEST_ENDPOINT();
  if (p.kind === "cse") {
    const qs = new URLSearchParams({ key: p.key, cx: p.cx, q, searchType: "image", safe: "active", imgType: "photo", num: "10" });
    const res = await fetch(`${base ?? "https://www.googleapis.com/customsearch/v1"}?${qs}`, { cache: "no-store", signal: AbortSignal.timeout(10_000) });
    if (!res.ok) throw new HttpError(502, res.status === 403 || res.status === 400 ? "Google rechazó la clave o el buscador (revisa GOOGLE_CSE_API_KEY y GOOGLE_CSE_CX)." : "Google Imágenes no responde ahora.");
    const json = (await res.json()) as { items?: Array<{ link: string; title?: string; displayLink?: string; image?: { thumbnailLink?: string; width?: number; height?: number; contextLink?: string } }> };
    return (json.items ?? []).map((i) => ({ link: i.link, thumb: i.image?.thumbnailLink ?? "", width: i.image?.width ?? 0, height: i.image?.height ?? 0, title: i.title ?? "", page: i.image?.contextLink ?? "", site: i.displayLink ?? "" }));
  }
  const qs = new URLSearchParams({ engine: "google_images", q, safe: "active", api_key: p.key, hl: "en" });
  const res = await fetch(`${base ?? "https://serpapi.com/search.json"}?${qs}`, { cache: "no-store", signal: AbortSignal.timeout(15_000) });
  if (!res.ok) throw new HttpError(502, res.status === 401 ? "SerpApi rechazó la clave (revisa SERPAPI_API_KEY)." : "Google Imágenes no responde ahora.");
  const json = (await res.json()) as { images_results?: Array<{ original: string; thumbnail?: string; original_width?: number; original_height?: number; title?: string; link?: string; source?: string }> };
  return (json.images_results ?? []).slice(0, 20).map((i) => ({ link: i.original, thumb: i.thumbnail ?? "", width: i.original_width ?? 0, height: i.original_height ?? 0, title: i.title ?? "", page: i.link ?? "", site: i.source ?? "" }));
}

const httpsUrl = (u: string) => {
  try {
    const x = new URL(u);
    return x.protocol === "https:" || (TEST_ENDPOINT() && x.protocol === "http:") ? x : null;
  } catch {
    return null;
  }
};

/** Up to `max` Google Images results, real sharp photos first. */
export async function searchGoogle(q: string, max = 6): Promise<GooglePhoto[]> {
  const p = googleProvider();
  if (!p) throw new HttpError(503, googleMissing()!);
  if (hasBlockedWords(q)) throw new HttpError(422, "Esa búsqueda no está permitida. Prueba con otra palabra.");
  const raw = (await query(p, q.trim().slice(0, 100))).filter((r) => httpsUrl(r.link) && httpsUrl(r.thumb) && !hasBlockedWords(`${r.title} ${r.site}`));
  const ranked = rankPhotos(
    raw.map((r) => ({ ...r, mime: /\.png($|\?)/i.test(r.link) ? "image/png" : "image/jpeg" })),
    max,
  );
  return ranked.map((r) => ({
    id: sign(p, { u: r.link, s: r.page, t: r.title.slice(0, 120) }),
    title: r.title || r.site,
    thumb: r.thumb,
    width: r.width,
    height: r.height,
    author: r.site || "Google Images",
    license: "Check the source",
    pageUrl: r.page,
  }));
}

function privateAddress(ip: string): boolean {
  if (isIP(ip) === 6) {
    const v = ip.toLowerCase();
    if (v.startsWith("::ffff:")) return privateAddress(v.slice(7));
    return v === "::1" || v === "::" || v.startsWith("fc") || v.startsWith("fd") || v.startsWith("fe80");
  }
  const [a, b] = ip.split(".").map(Number);
  return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || a >= 224;
}

async function safeFetch(raw: string, hops = 3): Promise<Response> {
  const u = httpsUrl(raw);
  if (!u) throw new HttpError(400, "Unknown image");
  if (!TEST_ENDPOINT()) {
    const addrs = await lookup(u.hostname, { all: true }).catch(() => []);
    if (!addrs.length || addrs.some((a) => privateAddress(a.address))) throw new HttpError(400, "This image address is not allowed.");
  }
  const res = await fetch(u, { redirect: "manual", cache: "no-store", signal: AbortSignal.timeout(15_000), headers: { "User-Agent": "LextroSpeak/1.0 (classroom flashcards)" } });
  if (res.status >= 300 && res.status < 400 && res.headers.get("location") && hops > 0) return safeFetch(new URL(res.headers.get("location")!, u).toString(), hops - 1);
  return res;
}

/** Downloads a Google Images result this server returned (signed id) and checks the bytes. */
export async function fetchGoogleImage(id: string): Promise<{ data: Buffer; mime: NonNullable<ReturnType<typeof sniffImage>>; name: string }> {
  const p = googleProvider();
  const v = p && verify(p, id);
  if (!v) throw new HttpError(400, "Unknown image");
  const res = await safeFetch(v.u);
  if (!res.ok || !res.body) throw new HttpError(502, "Could not download this image. Try another one.");
  if (Number(res.headers.get("content-length") ?? 0) > IMAGE_MAX_BYTES) throw new HttpError(413, "This picture is too big. Try another one.");
  const data = Buffer.from(await res.arrayBuffer());
  if (data.length > IMAGE_MAX_BYTES) throw new HttpError(413, "This picture is too big. Try another one.");
  const mime = sniffImage(data);
  if (!mime) throw new HttpError(415, "This result is not a picture we can use. Try another one.");
  // The source page travels with the file name (shown in the media library).
  const name = `${v.t || "image"} — Google Images ${v.s || v.u}`.slice(0, 250);
  return { data, mime, name };
}
