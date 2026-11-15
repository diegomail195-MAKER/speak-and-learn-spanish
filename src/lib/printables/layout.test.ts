import { describe, expect, it } from "vitest";
import { backSlot, flashcardSheets, matchPages, quizItems, quizPages, wheelGroups, type PrintCard } from "./layout";

const face = (text: string, imageUrl: string | null = null) => ({ text, imageUrl, imageAlt: "" });
const deck = (n: number, back = true): PrintCard[] =>
  Array.from({ length: n }, (_, i) => ({ id: `c${i}`, front: face(`front ${i}`, `/api/media/f${i}`), back: back ? face(`back ${i}`) : null }));

describe("flash cards", () => {
  it("mirrors columns on the long edge and rows on the short edge", () => {
    expect([0, 1, 2, 3].map((i) => backSlot(i, "long"))).toEqual([1, 0, 3, 2]);
    expect([0, 1, 6, 7].map((i) => backSlot(i, "short"))).toEqual([6, 7, 0, 1]);
  });

  it("puts each back sheet right after its front sheet, aligned for duplex", () => {
    const sheets = flashcardSheets(deck(11), { sides: "two", flip: "long" });
    expect(sheets.map((s) => s.side)).toEqual(["front", "back", "front", "back"]);
    const [f, b] = sheets;
    f.slots.forEach((s, i) => s && expect(b.slots[backSlot(i, "long")]?.cardId).toBe(s.cardId));
    expect(sheets[2].slots.filter(Boolean)).toHaveLength(3);
  });

  it("prints only fronts in one-side mode", () => {
    expect(flashcardSheets(deck(100), { sides: "one", flip: "long" })).toHaveLength(13);
  });
});

describe("match up", () => {
  it("keeps pairs on the same page and shuffles the right column", () => {
    const pages = matchPages(deck(11), 42);
    expect(pages.map((p) => p.left.length)).toEqual([8, 3]);
    for (const p of pages) expect(new Set(p.right.map((r) => r.cardId))).toEqual(new Set(p.left.map((l) => l.cardId)));
    expect(pages[0].right.map((r) => r.cardId)).not.toEqual(pages[0].left.map((l) => l.cardId));
    expect(matchPages(deck(11), 42)).toEqual(pages); // same seed, same sheet
  });
});

describe("quiz", () => {
  it("uses the back as the right answer and three different backs as distractors", () => {
    const items = quizItems(deck(11), 7);
    for (const it of items) {
      const right = it.options.find((o) => o.correct)!;
      expect(right.face?.text).toBe(`back ${it.number - 1}`);
      expect(new Set(it.options.map((o) => o.face?.text)).size).toBe(4);
      expect(it.options.every((o) => !o.missing)).toBe(true);
      expect(it.correctLetter).toBe("ABCD"[it.options.indexOf(right)]);
    }
  });

  it("leaves options blank to fill in when there are too few different backs", () => {
    const cards = deck(2);
    const items = quizItems(cards, 1);
    expect(items[0].options.filter((o) => o.missing)).toHaveLength(2);
    const key = items[0].options.find((o) => o.missing)!.key;
    const filled = quizItems(cards, 1, { [key]: "verde" });
    expect(filled[0].options.find((o) => o.key === key)?.face?.text).toBe("verde");
  });

  it("marks the right answer missing when a card has no back", () => {
    const items = quizItems(deck(5, false), 3);
    expect(items[0].options.every((o) => o.missing)).toBe(true);
  });

  it("never splits a question across pages", () => {
    const pages = quizPages(quizItems(deck(11), 7));
    expect(pages.flat()).toHaveLength(11);
    expect(pages.every((p) => p.length <= 6)).toBe(true);
  });
});

describe("spin the wheel", () => {
  it("splits long decks into balanced, readable wheels", () => {
    expect(wheelGroups(deck(11)).map((g) => g.length)).toEqual([11]);
    expect(wheelGroups(deck(13)).map((g) => g.length)).toEqual([7, 6]);
    const big = wheelGroups(deck(100));
    expect(big.every((g) => g.length <= 12)).toBe(true);
    expect(big.flat()).toHaveLength(100);
  });
});
