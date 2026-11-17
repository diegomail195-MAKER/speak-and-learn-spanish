import "server-only";
import { HttpError } from "@/lib/auth/guards";
import { IMAGE_MAX_BYTES, sniffImage } from "@/lib/media/validate";
import { looksDrawn, photoScore, rankPhotos, type CommonsCandidate } from "./photoQuery";
import { blockedWord, hasBlockedWords } from "./safety";

// Wikimedia Commons: free, openly licensed photographs, no API key. Teachers see thumbnails; a
// chosen photo is re-read by its title on the server (never a URL from the browser), downloaded
// and kept in our own storage with its author, license and source page.

const API = () => process.env.COMMONS_API_URL || "https://commons.wikimedia.org/w/api.php";
const FILE_HOSTS = () => new Set(["upload.wikimedia.org", "thumb.wikimedia.org", ...(process.env.COMMONS_API_URL ? [new URL(process.env.COMMONS_API_URL).host] : [])]);
// Wikimedia asks API clients for a descriptive User-Agent with a way to reach the operator.
const UA = `LextroSpeak/1.0 (${process.env.APP_URL || "https://speak-and-learn-spanish.vercel.app"}; classroom flashcards image search) node-fetch`;
const HEADERS = { "User-Agent": UA, "Api-User-Agent": UA, Accept: "application/json" };

export type CommonsPhoto = { id: string; title: string; thumb: string; width: number; height: number; author: string; license: string; pageUrl: string };

type Info = {
  url: string;
  thumburl?: string;
  thumbwidth?: number;
  thumbheight?: number;
  width: number;
  height: number;
  mime: string;
  descriptionurl: string;
  extmetadata?: Record<string, { value?: string }>;
};
type Page = { title: string; index?: number; imageinfo?: Info[] };

const stripHtml = (s = "") => s.replace(/<[^>]*>/g, "").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, " ").trim();

function fileUrl(raw: string | undefined): string | null {
  if (!raw) return null;
  try {
    const u = new URL(raw);
    return (u.protocol === "https:" || process.env.COMMONS_API_URL) && FILE_HOSTS().has(u.host) ? u.toString() : null;
  } catch {
    return null;
  }
}

async function api(params: Record<string, string>): Promise<Page[]> {
  const qs = new URLSearchParams({ action: "query", format: "json", formatversion: "2", origin: "*", ...params });
  const res = await fetch(`${API()}?${qs}`, { headers: HEADERS, cache: "no-store", signal: AbortSignal.timeout(10_000) }).catch((e: Error) => {
    console.error("commons api unreachable", e.message);
    throw new HttpError(502, "No se pudo conectar con Wikimedia Commons. Sube una foto.");
  });
  if (!res.ok) {
    console.error("commons api http", res.status, (await res.text().catch(() => "")).slice(0, 300));
    throw new HttpError(502, `Wikimedia Commons no responde ahora (HTTP ${res.status}). Sube una foto.`);
  }
  const json = (await res.json().catch(() => null)) as { query?: { pages?: Page[] }; error?: { code?: string; info?: string } } | null;
  if (!json || json.error) {
    console.error("commons api error", json?.error);
    throw new HttpError(502, `Wikimedia Commons devolvió un error${json?.error?.code ? ` (${json.error.code})` : ""}. Sube una foto.`);
  }
  return json.query?.pages ?? [];
}

const meta = (i: Info, k: string) => stripHtml(i.extmetadata?.[k]?.value);

function toPhoto(p: Page): (CommonsPhoto & CommonsCandidate) | null {
  const i = p.imageinfo?.[0];
  const thumb = fileUrl(i?.thumburl);
  if (!i || !thumb) return null;
  const desc = `${p.title} ${meta(i, "ImageDescription")} ${meta(i, "Categories")}`;
  if (hasBlockedWords(desc)) return null;
  return {
    id: `commons:${p.title}`,
    title: p.title.replace(/^File:/, "").replace(/\.[a-z0-9]+$/i, ""),
    thumb,
    width: i.width,
    height: i.height,
    mime: i.mime,
    categories: meta(i, "Categories"),
    author: meta(i, "Artist").slice(0, 80) || "Unknown",
    license: meta(i, "LicenseShortName") || "See source",
    pageUrl: i.descriptionurl,
  };
}

export type CommonsStats = { found: number; usable: number; shown: number; dropped?: Record<string, number> };

/** Why a search result was left out (diagnostics only: counts, never shown to students). */
function dropReason(p: Page): string {
  const i = p.imageinfo?.[0];
  if (!i) return "no imageinfo";
  if (!fileUrl(i.thumburl)) {
    try {
      const u = new URL(i.thumburl ?? "");
      return `thumb ${u.protocol}//${u.host}`;
    } catch {
      return "no thumb";
    }
  }
  return `word "${blockedWord(`${p.title} ${meta(i, "ImageDescription")} ${meta(i, "Categories")}`) ?? "?"}"`;
}

/** Up to `max` photos for a search, best photographs first, plus how many were found and dropped. */
export async function searchCommonsDetailed(query: string, max = 6): Promise<{ photos: CommonsPhoto[]; stats: CommonsStats }> {
  const q = query.trim().slice(0, 100);
  if (!q) return { photos: [], stats: { found: 0, usable: 0, shown: 0 } };
  if (hasBlockedWords(q)) throw new HttpError(422, "Esa búsqueda no está permitida. Prueba con otra palabra.");
  const pages = await api({
    generator: "search",
    gsrsearch: `${q} filetype:bitmap`,
    gsrnamespace: "6",
    gsrlimit: String(Math.min(50, Math.max(30, max * 5))),
    prop: "imageinfo",
    iiprop: "url|size|mime|extmetadata",
    iiurlwidth: "360",
    iiextmetadatafilter: "Artist|LicenseShortName|ImageDescription|Categories",
  });
  const list = pages
    .sort((a, b) => (a.index ?? 0) - (b.index ?? 0))
    .map(toPhoto)
    .filter((p): p is CommonsPhoto & CommonsCandidate => !!p);
  // Real photographs first; when too few pass the strict photo check, fill with the next best
  // safe results (still JPEG/PNG photos from Commons) so a common word never comes back empty.
  const best = rankPhotos(list, max);
  if (best.length < Math.min(3, list.length)) {
    const rest = list
      .filter((c) => !best.includes(c) && !looksDrawn(c.title) && Math.max(c.width, c.height) >= 320)
      .map((c, i) => ({ c, s: photoScore(c, i) }))
      .sort((a, b) => b.s - a.s)
      .map((x) => x.c);
    best.push(...rest.slice(0, max - best.length));
  }
  const photos = best.map(({ id, title, thumb, width, height, author, license, pageUrl }) => ({ id, title, thumb, width, height, author, license, pageUrl }));
  const dropped: Record<string, number> = {};
  for (const pg of pages) if (!toPhoto(pg)) dropped[dropReason(pg)] = (dropped[dropReason(pg)] ?? 0) + 1;
  const stats = { found: pages.length, usable: list.length, shown: photos.length, dropped };
  console.info("commons search", JSON.stringify({ q, ...stats }));
  return { photos, stats };
}

export async function searchCommons(query: string, max = 6): Promise<CommonsPhoto[]> {
  return (await searchCommonsDetailed(query, max)).photos;
}

/** Re-reads a Commons file by title, downloads a 1280px copy and returns it with its credits. */
export async function fetchCommonsImage(id: string): Promise<{ data: Buffer; mime: NonNullable<ReturnType<typeof sniffImage>>; name: string }> {
  const title = id.replace(/^commons:/, "");
  if (!/^File:[^|#<>[\]{}]{1,240}$/.test(title)) throw new HttpError(400, "Unknown image");
  const [page] = await api({ titles: title, prop: "imageinfo", iiprop: "url|size|mime|extmetadata", iiurlwidth: "1280", iiextmetadatafilter: "Artist|LicenseShortName|ImageDescription|Categories" });
  const photo = page && toPhoto(page);
  const info = page?.imageinfo?.[0];
  const url = fileUrl(info?.thumburl) ?? fileUrl(info?.url);
  if (!photo || !url) throw new HttpError(404, "Esta imagen no está disponible.");
  const res = await fetch(url, { headers: HEADERS, cache: "no-store", signal: AbortSignal.timeout(15_000) });
  if (!res.ok) throw new HttpError(502, "Could not download the image. Try another one.");
  const data = Buffer.from(await res.arrayBuffer());
  if (data.length > IMAGE_MAX_BYTES) throw new HttpError(413, "This picture is too big. Try another one.");
  const mime = sniffImage(data);
  if (!mime) throw new HttpError(415, "Unsupported image");
  // Source, author and license travel with the file name (shown in the media library).
  const name = `${photo.title} — ${photo.author} / Wikimedia Commons (${photo.license}) ${photo.pageUrl}`.slice(0, 250);
  return { data, mime, name };
}
