// Pure helpers for the flashcard photo picker (no server-only import, so they are unit tested):
// which words to search, the category context, the Google Images link and how to rank results.

/** Context words per category (by its English name), so "turkey" in Animals finds the bird. */
const CONTEXT: Array<[RegExp, string]> = [
  [/animal|pet|farm|zoo|bird|insect|sea/i, "animal"],
  [/colou?r/i, "color"],
  [/food|fruit|vegetable|drink|meal/i, "food"],
  [/cloth/i, "clothing"],
  [/body/i, "human body"],
  [/weather/i, "weather"],
  [/transport|vehicle/i, "vehicle"],
  [/house|home|furniture/i, "household"],
  [/school|classroom/i, "school"],
  [/sport/i, "sport"],
  [/job|profession|occupation/i, "worker"],
  [/place|city|town|community/i, "place"],
];

export function categoryContext(categoryName: string | null | undefined): string {
  if (!categoryName) return "";
  return CONTEXT.find(([re]) => re.test(categoryName))?.[1] ?? "";
}

/** The term to search: the English text when there is one, otherwise the Spanish one. */
export function searchTerm(faces: Array<{ text?: string | null; language?: string | null }>): string {
  const clean = (s?: string | null) => (s ?? "").replace(/\s+/g, " ").trim().slice(0, 80);
  const en = faces.find((f) => f.language?.startsWith("en") && clean(f.text));
  if (en) return clean(en.text);
  return clean(faces.find((f) => clean(f.text))?.text);
}

/** The context word is added unless the term already says it ("gray color" stays as is). */
export function withContext(term: string, context: string): string {
  if (!term) return "";
  if (!context || term.toLowerCase().includes(context.toLowerCase())) return term;
  return `${term} ${context}`;
}

/** Google Images, safe search on, photographs only (an external link for the teacher). */
export function googleImagesUrl(term: string, context: string): string {
  const q = `${withContext(term, context)} photograph -cartoon -illustration`;
  return `https://www.google.com/search?${new URLSearchParams({ tbm: "isch", safe: "active", q })}`;
}

const NOT_PHOTO = /\b(drawing|draw|cartoon|clip ?art|clipart|illustration|illustrated|icon|logo|emblem|coat of arms|flag|diagram|map|chart|sketch|painting|paintings|drawings|illustrations|engraving|engravings|lithograph|skeleton|fossil|museum specimen|poster|sticker|emoji|vector|svg|symbol|silhouette|pictogram|stamp|banknote|coin|text|screenshot|plate \d+)\b/i;

/** True when a file name says it is a drawing, icon, logo, map… (not a photograph). */
export const looksDrawn = (title: string) => NOT_PHOTO.test(title);

export type CommonsCandidate = { title: string; mime: string; width: number; height: number; categories?: string };

/** Higher is better: sharp photographs with a clear subject; drawings, icons and logos sink. */
export function photoScore(c: CommonsCandidate, index: number): number {
  let s = 100 - index * 2; // keep the search engine's relevance order
  if (c.mime !== "image/jpeg") s -= 40;
  const text = `${c.title} ${c.categories ?? ""}`;
  if (NOT_PHOTO.test(text)) s -= 100;
  const long = Math.max(c.width, c.height);
  if (long < 640) s -= 100;
  else if (long >= 1200) s += 10;
  const ratio = c.width / Math.max(1, c.height);
  if (ratio > 3 || ratio < 0.33) s -= 30; // panoramas and strips: subject too small
  return s;
}

export function rankPhotos<T extends CommonsCandidate>(list: T[], max = 6): T[] {
  return list
    .map((c, i) => ({ c, s: photoScore(c, i) }))
    .filter((x) => x.s > 20)
    .sort((a, b) => b.s - a.s)
    .slice(0, max)
    .map((x) => x.c);
}
