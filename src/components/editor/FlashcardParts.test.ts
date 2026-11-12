import { describe, expect, it } from "vitest";
import type { EditorItem } from "@/lib/games/types";
import { swapItem } from "./FlashcardParts";

const card = (): EditorItem => ({
  id: "c1",
  imageAssetId: "img-front",
  imageUrl: "/api/media/img-front",
  text: "",
  difficulty: 1,
  data: {
    imageAlt: "red circle",
    audio: { mediaId: null, text: "red", language: "en-US", source: "browser" },
    back: { text: "rojo", imageAssetId: "img-back", imageAlt: "círculo rojo", audio: { mediaId: "a1", text: "rojo", language: "es-419", source: "tts" } },
  },
  question: { prompt: "", promptAudioId: null, expectedAnswer: "", accepted: [], hint: "", supportText: "", supportLanguage: "en-US", supportAudioId: null, evaluationMode: "PHRASE", answerLanguage: null },
});

describe("swap front and back", () => {
  it("moves text, picture, alt text and audio together", () => {
    const s = swapItem(card());
    expect(s.text).toBe("rojo");
    expect(s.imageAssetId).toBe("img-back");
    expect(s.data.imageAlt).toBe("círculo rojo");
    expect(s.data.audio).toMatchObject({ text: "rojo", language: "es-419", mediaId: "a1" });
    expect(s.data.back).toMatchObject({ text: "", imageAssetId: "img-front", imageAlt: "red circle", audio: { text: "red", language: "en-US" } });
    expect(s.id).toBe("c1"); // same card: progress and answers stay attached
  });
  it("swapping twice restores the card", () => {
    const c = card();
    const twice = swapItem(swapItem(c));
    expect(twice.text).toBe(c.text);
    expect(twice.imageAssetId).toBe(c.imageAssetId);
    expect(twice.data.audio).toEqual(c.data.audio);
    expect(twice.data.back).toEqual(c.data.back);
  });
});
