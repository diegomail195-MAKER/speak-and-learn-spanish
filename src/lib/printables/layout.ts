// Printables built from a flashcards activity: pure layout helpers (no React), shared by the
// on-screen preview, the browser print and the PDF so all three show the same pages.

export type PaperSize = "letter" | "a4";
export type PrintTemplate = "flashcards" | "match" | "quiz" | "wheel";

export interface PrintFace {
  text: string;
  imageUrl: string | null;
  imageAlt: string;
}

export interface PrintCard {
  id: string;
  front: PrintFace;
  /** null when the activity has no back for this card (one side, or an empty back). */
  back: PrintFace | null;
}

/** Page size in CSS pixels at 96 dpi, and the PDF format name. */
export const PAPER: Record<PaperSize, { w: number; h: number; label: string }> = {
  letter: { w: 816, h: 1056, label: "US Letter" },
  a4: { w: 794, h: 1123, label: "A4" },
};
export const MARGIN = 48;

export type Orientation = "portrait" | "landscape";

/** The page in CSS pixels for a paper size and orientation. */
export function pageSize(size: PaperSize, orientation: Orientation = "portrait") {
  const { w, h } = PAPER[size];
  return orientation === "landscape" ? { w: h, h: w } : { w, h };
}

/** What a worksheet shows around its content (the Show options). */
export interface ShowParts {
  title: boolean;
  name: boolean;
  date: boolean;
  footer: boolean;
}
export const SHOW_ALL: ShowParts = { title: true, name: true, date: true, footer: true };

/** Height left for the content of a worksheet page once the header, instruction and footer are drawn. */
export function contentHeight(page: { h: number }, show: ShowParts, instruction: boolean) {
  const header = show.title || show.name || show.date ? 64 : 0;
  return page.h - 2 * MARGIN - header - (instruction ? 30 : 0) - (show.footer ? 26 : 0);
}

export const isEmptyFace = (f: PrintFace | null | undefined) => !f || (!f.text.trim() && !f.imageUrl);

/** Small seeded random generator, so the preview, the print and the PDF shuffle the same way. */
export function rng(seed: number) {
  let a = seed >>> 0 || 1;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function seededShuffle<T>(items: T[], seed: number): T[] {
  const r = rng(seed);
  const x = [...items];
  for (let i = x.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [x[i], x[j]] = [x[j], x[i]];
  }
  return x;
}

const chunk = <T,>(a: T[], n: number): T[][] => {
  const out: T[][] = [];
  for (let i = 0; i < a.length; i += n) out.push(a.slice(i, i + n));
  return out;
};

// ---------------------------------------------------------------- Flash cards

export const CARD_COLS = 2;
export const CARD_ROWS = 4;
export const CARDS_PER_SHEET = CARD_COLS * CARD_ROWS;

export type FlipEdge = "long" | "short";

export interface CardSheet {
  kind: "cards";
  side: "front" | "back";
  /** Row-major slots (CARD_COLS × CARD_ROWS); null = empty slot. */
  slots: Array<{ cardId: string; face: PrintFace | null } | null>;
}

/**
 * Where the back of the card printed at (row, col) of the front sheet lands on the back sheet.
 * Flipping on the long edge (like a book) mirrors the columns; on the short edge (like a
 * notepad) it mirrors the rows.
 */
export function backSlot(index: number, flip: FlipEdge, cols = CARD_COLS, rows = CARD_ROWS) {
  const r = Math.floor(index / cols);
  const c = index % cols;
  return flip === "long" ? r * cols + (cols - 1 - c) : (rows - 1 - r) * cols + c;
}

/** Cut-out cards in order. Two sides: each front sheet is followed by its back sheet for duplex printing. */
export function flashcardSheets(cards: PrintCard[], opts: { sides: "one" | "two"; flip: FlipEdge }): CardSheet[] {
  const sheets: CardSheet[] = [];
  for (const group of chunk(cards, CARDS_PER_SHEET)) {
    const front: CardSheet["slots"] = Array.from({ length: CARDS_PER_SHEET }, (_, i) => (group[i] ? { cardId: group[i].id, face: group[i].front } : null));
    sheets.push({ kind: "cards", side: "front", slots: front });
    if (opts.sides === "two") {
      const back: CardSheet["slots"] = Array.from({ length: CARDS_PER_SHEET }, () => null);
      group.forEach((c, i) => (back[backSlot(i, opts.flip)] = { cardId: c.id, face: c.back }));
      sheets.push({ kind: "cards", side: "back", slots: back });
    }
  }
  return sheets;
}

/** Flash cards as a table, one card per row with the front and the back side by side. */
export const TABLE_ROW_MIN = 72;
export function flashcardTable(cards: PrintCard[], perPage: number): PrintCard[][] {
  return chunk(cards, Math.max(1, perPage));
}

// ---------------------------------------------------------------- Match up

export const MATCH_PER_PAGE = 8;

export interface MatchPage {
  kind: "match";
  left: Array<{ cardId: string; face: PrintFace }>;
  right: Array<{ cardId: string; face: PrintFace }>;
}

/** Pairs stay on the same page; the right column is shuffled within each page (never left in order when it can be avoided). */
export function matchPages(cards: PrintCard[], seed: number, perPage = MATCH_PER_PAGE): MatchPage[] {
  const usable = cards.filter((c) => !isEmptyFace(c.back));
  return chunk(usable, Math.max(1, perPage)).map((group, p) => {
    const left = group.map((c) => ({ cardId: c.id, face: c.front }));
    let right = group.map((c) => ({ cardId: c.id, face: c.back! }));
    if (right.length > 1) {
      for (let k = 0; k < 20; k++) {
        const s = seededShuffle(right, seed + p * 101 + k * 7919);
        right = s;
        if (s.some((x, i) => x.cardId === left[i].cardId) === false || k === 19) break;
      }
    }
    return { kind: "match", left, right };
  });
}

// ---------------------------------------------------------------- Quiz

export const QUIZ_LETTERS = ["A", "B", "C", "D"] as const;

export interface QuizOption {
  /** Stable key for teacher-typed text: `${cardId}:${index}`. */
  key: string;
  face: PrintFace | null;
  /** True when the option had to be left blank (not enough different backs). */
  missing: boolean;
  correct: boolean;
}

export interface QuizItem {
  cardId: string;
  number: number;
  question: PrintFace;
  options: QuizOption[];
  correctLetter: (typeof QUIZ_LETTERS)[number];
}

const faceKey = (f: PrintFace) => (f.imageUrl ? `img:${f.imageUrl}|` : "") + f.text.trim().toLowerCase();

/**
 * One question per card: the front is the question, the back the right answer and other
 * different backs the distractors. Blank options (missing backs or too few different backs)
 * are marked so the teacher can type them in before printing; typed text comes in `filled`.
 */
export function quizItems(cards: PrintCard[], seed: number, filled: Record<string, string> = {}): QuizItem[] {
  const pool: PrintFace[] = [];
  const seen = new Set<string>();
  for (const c of cards) {
    if (isEmptyFace(c.back)) continue;
    const k = faceKey(c.back!);
    if (seen.has(k)) continue;
    seen.add(k);
    pool.push(c.back!);
  }
  return cards.map((c, n) => {
    const r = rng(seed + n * 977);
    const right = isEmptyFace(c.back) ? null : c.back!;
    const rightKey = right ? faceKey(right) : null;
    const others = seededShuffle(pool.filter((f) => faceKey(f) !== rightKey), Math.floor(r() * 1e9)).slice(0, 3);
    const correctAt = Math.floor(r() * 4);
    const faces: Array<PrintFace | null> = [];
    let o = 0;
    for (let i = 0; i < 4; i++) faces.push(i === correctAt ? right : (others[o++] ?? null));
    const options = faces.map((f, i): QuizOption => {
      const key = `${c.id}:${i}`;
      const typed = filled[key]?.trim();
      if (f) return { key, face: f, missing: false, correct: i === correctAt };
      return { key, face: typed ? { text: typed, imageUrl: null, imageAlt: "" } : null, missing: true, correct: i === correctAt };
    });
    return { cardId: c.id, number: n + 1, question: c.front, options, correctLetter: QUIZ_LETTERS[correctAt] };
  });
}

/** True when the choices themselves have pictures (they then need taller rows). */
export const quizHasPictures = (it: QuizItem) => it.options.some((o) => o.face?.imageUrl);

/** Height a question takes in a quiz column (question line, 2×2 choices, gap). */
export const quizItemHeight = (it: QuizItem) => (it.question.imageUrl ? 80 : 30) + 8 + 2 * (quizHasPictures(it) ? 56 : 30) + 6 + 20;

export const QUIZ_COLS = 2;

/**
 * Pages of two columns of questions. A question never splits; a column takes questions while
 * they fit in `columnHeight` (and, with `perPage`, until the page has that many).
 */
export function quizPages(items: QuizItem[], columnHeight = 846, perPage?: number): QuizItem[][][] {
  const pages: QuizItem[][][] = [];
  let page: QuizItem[][] = [[]];
  let used = 0;
  const count = () => page.reduce((n, c) => n + c.length, 0);
  for (const it of items) {
    const h = quizItemHeight(it);
    const col = page[page.length - 1];
    if (perPage && count() >= perPage) {
      pages.push(page);
      page = [[]];
      used = 0;
    } else if (col.length && used + h > columnHeight) {
      if (page.length < QUIZ_COLS) page.push([]);
      else {
        pages.push(page);
        page = [[]];
      }
      used = 0;
    }
    page[page.length - 1].push(it);
    used += h;
  }
  if (page[0].length) pages.push(page);
  return pages;
}

// ---------------------------------------------------------------- Spin the wheel

export const WHEEL_MAX = 12;

/** Splits the cards into the fewest wheels of at most WHEEL_MAX sectors, balanced in size. */
export function wheelGroups<T>(items: T[], max = WHEEL_MAX): T[][] {
  if (!items.length) return [];
  const n = Math.ceil(items.length / max);
  const base = Math.floor(items.length / n);
  const extra = items.length % n;
  const out: T[][] = [];
  let i = 0;
  for (let k = 0; k < n; k++) {
    const size = base + (k < extra ? 1 : 0);
    out.push(items.slice(i, i + size));
    i += size;
  }
  return out;
}

/** SVG path of one wheel sector (angles in degrees, 0 = top, clockwise). */
export function sectorPath(cx: number, cy: number, r: number, a0: number, a1: number) {
  if (a1 - a0 >= 359.999) return `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx - 0.01} ${cy - r} Z`;
  const p = (a: number) => [cx + r * Math.sin((a * Math.PI) / 180), cy - r * Math.cos((a * Math.PI) / 180)];
  const [x0, y0] = p(a0);
  const [x1, y1] = p(a1);
  return `M ${cx} ${cy} L ${x0.toFixed(2)} ${y0.toFixed(2)} A ${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1.toFixed(2)} ${y1.toFixed(2)} Z`;
}

// ---------------------------------------------------------------- Thinking like a teacher

const norm = (s: string) => s.toLowerCase().replace(/[¿?¡!.,;:"“”]/g, "").replace(/\s+/g, " ").trim();

/**
 * The question most cards share ("¿Qué color es este?" on every front), or null. It is said
 * once at the top of the worksheet instead of on every line.
 */
export function sharedPrompt(cards: PrintCard[]): string | null {
  if (cards.length < 2) return null;
  const count = new Map<string, { text: string; n: number }>();
  for (const c of cards) {
    const k = norm(c.front.text);
    if (!k) continue;
    const e = count.get(k) ?? { text: c.front.text.trim(), n: 0 };
    e.n++;
    count.set(k, e);
  }
  const best = [...count.values()].sort((a, b) => b.n - a.n)[0];
  return best && best.n >= 2 && best.n >= 0.6 * cards.length ? best.text : null;
}

/**
 * The cards as a worksheet uses them: the front is what the student looks at (the question),
 * the back is what they answer. So:
 * - the shared question is lifted out (see sharedPrompt) when the front has a picture to show;
 * - a front with no picture borrows the back's picture, so there is something to ask about;
 * - the answer is the word: its picture is dropped when it has text and the front already
 *   shows a picture (the same picture twice adds nothing, and a picture next to the word
 *   gives the answer away);
 * - a front that just repeats the answer's word keeps only its picture.
 */
export function teacherCards(cards: PrintCard[]): { prompt: string | null; cards: PrintCard[] } {
  const prompt = sharedPrompt(cards);
  const pk = prompt ? norm(prompt) : null;
  return {
    prompt,
    cards: cards.map((c) => {
      let q: PrintFace = { ...c.front };
      let a: PrintFace | null = c.back ? { ...c.back } : null;
      const qText = norm(q.text);
      if (!q.imageUrl && a?.imageUrl && a.text.trim() && (!qText || qText === pk)) q = { ...q, imageUrl: a.imageUrl, imageAlt: a.imageAlt };
      if (a?.imageUrl && a.text.trim() && q.imageUrl) a = { ...a, imageUrl: null, imageAlt: "" };
      if (q.imageUrl && qText && (qText === pk || (a && qText === norm(a.text)))) q = { ...q, text: "" };
      return { ...c, front: q, back: a };
    }),
  };
}
