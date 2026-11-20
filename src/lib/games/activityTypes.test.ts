import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { ACTIVITY_TYPES, ICON_SIZES, activityIconSrc, activityName, activityType, canonicalTemplateKey, sortActivityTypes } from "./activityTypes";
import { TEMPLATES, templateByKey } from "./templates";

describe("activity type registry", () => {
  it("has the eleven Create Activity types in the recommended order", () => {
    expect(ACTIVITY_TYPES.map((t) => t.name.en)).toEqual([
      "Flashcards", "Spin the Wheel", "Match & Speak", "Spell the Word", "Image & Speak", "Listen & Repeat",
      "Open the Box", "Label the Diagram", "Spell Your Name", "Question & Answer", "Picture Words",
    ]);
  });

  it("links every available template, and only those, to an icon file at every size", () => {
    const available = TEMPLATES.filter((t) => t.available).map((t) => t.key).sort();
    expect(ACTIVITY_TYPES.map((t) => t.key).sort()).toEqual(available);
    for (const t of ACTIVITY_TYPES) {
      for (const s of ICON_SIZES) expect(existsSync(path.join("public", activityIconSrc(t.key, s))), `${t.key} ${s}`).toBe(true);
      expect(t.description.en && t.description.es && t.name.es).toBeTruthy();
    }
  });

  it("keeps Spell the Word / Spell Your Name and Image & Speak / Picture Words apart", () => {
    expect(activityType("SPELL_THE_WORD")?.icon).not.toBe(activityType("SPELL_YOUR_NAME")?.icon);
    expect(activityType("SPEAK_AND_ANSWER")?.icon).not.toBe(activityType("IMAGE_AND_VOCABULARY")?.icon);
    expect(activityName("SPEAK_AND_ANSWER")).toBe("Image & Speak");
    expect(activityName("IMAGE_AND_VOCABULARY")).toBe("Picture Words");
  });

  it("resolves older key spellings to the current template", () => {
    expect(canonicalTemplateKey("LISTEN_AND_REPEAT")).toBe("LISTEN_AND_SPEAK");
    expect(canonicalTemplateKey("picture words")).toBe("IMAGE_AND_VOCABULARY");
    expect(canonicalTemplateKey("Question & Answer")).toBe("QUESTION_AND_ANSWER");
    expect(templateByKey("IMAGE_AND_SPEAK")?.key).toBe("SPEAK_AND_ANSWER");
    expect(activityIconSrc("LISTEN_AND_REPEAT")).toContain("listen-and-repeat");
    expect(activityIconSrc("FLY_AND_SPEAK")).toBe("/topic-icons/games.webp");
  });

  it("sorts alphabetically by the name in the active language and keeps the keys", () => {
    const list = ACTIVITY_TYPES.map((t) => ({ key: t.key }));
    const en = sortActivityTypes(list, "alphabetical", "en").map((t) => activityName(t.key, "en"));
    expect(en[0]).toBe("Flashcards");
    expect(en).toEqual([...en].sort((a, b) => a.localeCompare(b, "en", { sensitivity: "base" })));
    const es = sortActivityTypes(list, "alphabetical", "es");
    expect(activityName(es[0].key, "es")).toBe("Abre la caja");
    expect(new Set(es.map((t) => t.key))).toEqual(new Set(list.map((t) => t.key)));
    expect(sortActivityTypes([...list].reverse(), "recommended", "en").map((t) => t.key)).toEqual(list.map((t) => t.key));
  });
});
