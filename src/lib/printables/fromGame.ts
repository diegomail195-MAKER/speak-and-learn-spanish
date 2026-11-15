import type { PlayFace, PlayGame } from "@/lib/games/types";
import { plainText } from "@/lib/text/segments";
import type { PrintCard, PrintFace } from "./layout";

const face = (f: Pick<PlayFace, "text" | "imageUrl" | "imageAlt">): PrintFace => ({ text: plainText(f.text ?? ""), imageUrl: f.imageUrl, imageAlt: f.imageAlt ?? "" });

/** The saved cards of a flashcards activity, as the printables use them (front and back as stored). */
export function printCardsFrom(game: PlayGame): PrintCard[] {
  const oneSide = game.options.sides === "one";
  return game.questions.map((q) => {
    let back: PrintFace | null = null;
    if (q.back) back = face(q.back);
    else if (!oneSide) {
      // Older cards keep their back as a translation or the spoken answer.
      const t = plainText(q.data.translation || q.expected || "");
      if (t.trim()) back = { text: t, imageUrl: null, imageAlt: "" };
    }
    if (back && !back.text.trim() && !back.imageUrl) back = null;
    return { id: q.id, front: face({ text: q.displayText, imageUrl: q.imageUrl, imageAlt: q.imageAlt }), back };
  });
}

/** Image URL for printing and the PDF: always served from this site (no redirect to storage). */
export const printSrc = (url: string | null) => (url ? `${url}${url.includes("?") ? "&" : "?"}direct=1` : null);
