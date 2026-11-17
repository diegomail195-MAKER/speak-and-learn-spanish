import { describe, expect, it } from "vitest";
import { categoryContext, googleImagesUrl, rankPhotos, searchTerm, withContext } from "./photoQuery";

describe("flashcard photo picker", () => {
  it("searches the English text when there is one, else the Spanish one", () => {
    expect(searchTerm([{ text: "pavo", language: "es-419" }, { text: "turkey", language: "en-US" }])).toBe("turkey");
    expect(searchTerm([{ text: "andar en bicicleta", language: "es-419" }, { text: "", language: "en-US" }])).toBe("andar en bicicleta");
  });
  it("adds the category as context when it helps", () => {
    expect(withContext("turkey", categoryContext("Animals"))).toBe("turkey animal");
    expect(withContext("gray", categoryContext("Colors"))).toBe("gray color");
    expect(withContext("ride a bike", categoryContext("Activities"))).toBe("ride a bike");
    expect(withContext("gray color", "color")).toBe("gray color");
  });
  it("builds a safe Google Images link for photographs", () => {
    const u = new URL(googleImagesUrl("turkey", "animal"));
    expect(u.origin + u.pathname).toBe("https://www.google.com/search");
    expect(u.searchParams.get("tbm")).toBe("isch");
    expect(u.searchParams.get("safe")).toBe("active");
    expect(u.searchParams.get("q")).toBe("turkey animal photograph -cartoon -illustration");
  });
  it("puts sharp photographs first and drops drawings, icons and tiny files", () => {
    const r = rankPhotos([
      { title: "File:Turkey icon.svg.png", mime: "image/png", width: 512, height: 512 },
      { title: "File:Wild turkey cartoon.jpg", mime: "image/jpeg", width: 1600, height: 1200 },
      { title: "File:Wild turkey in a field.jpg", mime: "image/jpeg", width: 3000, height: 2000 },
      { title: "File:Turkey small.jpg", mime: "image/jpeg", width: 300, height: 200 },
    ]);
    expect(r.map((x) => x.title)).toEqual(["File:Wild turkey in a field.jpg"]);
  });
});

describe("paintings and skeletons sink below real photos", () => {
  it("ranks a photo above a painting category and a skeleton", async () => {
    const { rankPhotos } = await import("./photoQuery");
    const list = [
      { title: "Het aards paradijs", mime: "image/jpeg", width: 3000, height: 2000, categories: "Paintings by Jan Brueghel the Elder" },
      { title: "Capybara skeleton", mime: "image/jpeg", width: 3000, height: 2000 },
      { title: "Wild Turkey", mime: "image/jpeg", width: 3000, height: 2000, categories: "Meleagris gallopavo|Pages with maps" },
    ];
    expect(rankPhotos(list).map((c) => c.title)).toEqual(["Wild Turkey"]);
  });
});
