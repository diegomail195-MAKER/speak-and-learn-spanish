import { describe, expect, it } from "vitest";
import { buildGalleryRows, featuredOf, galleryCategories, galleryHref, galleryType, galleryVideo, rowsFor, watchHref } from "./videoGallery";

const hosted = (id: string, title: string) => ({ id, kind: "VIDEO", title, content: { file: { fileId: `f-${id}`, mime: "video/mp4" } } });

describe("Library › Videos gallery data", () => {
  it("labels songs and music versions as music videos", () => {
    expect(galleryType("VIDEO", "Buenas tardes (trap)")).toBe("MUSIC");
    expect(galleryType("VIDEO", "Las formas (canción)")).toBe("MUSIC");
    expect(galleryType("VIDEO", "Vamos todos a cantar los números del 1 al 20")).toBe("MUSIC");
    expect(galleryType("VIDEO", "¿Qué hora es?")).toBe("VIDEO");
    expect(galleryType("VIDEO", "Es viernes", "songs-and-movement")).toBe("MUSIC");
    expect(galleryType("SONG", "Colors Chant")).toBe("MUSIC");
  });

  it("plays hosted files and YouTube links; audio-only songs are left out", () => {
    expect(galleryVideo(hosted("a", "Hola"))).toMatchObject({ source: "HOSTED", url: "/api/library/files/f-a" });
    expect(galleryVideo({ id: "y", kind: "VIDEO", title: "We listen", content: { youtubeId: "1WhKIrWBWT0" } })).toMatchObject({ source: "YOUTUBE", youtubeId: "1WhKIrWBWT0" });
    expect(galleryVideo({ id: "s", kind: "SONG", title: "Chant", content: { file: { fileId: "x", mime: "audio/mpeg" }, lyrics: [] } })).toBeNull();
    expect(galleryVideo({ id: "s2", kind: "SONG", title: "Chant", content: { link: { url: "https://youtu.be/1WhKIrWBWT0" } } })).toMatchObject({ source: "YOUTUBE", type: "MUSIC" });
    expect(galleryVideo({ id: "e", kind: "VIDEO", title: "Empty", content: {} })).toBeNull();
  });

  it("builds one row per topic with videos, filters by category and picks a featured music video", () => {
    const rows = buildGalleryRows([
      { slug: "greetings", titleEs: "Los saludos", titleEn: "Greetings", category: "Everyday", resources: [hosted("1", "¿Cómo te llamas?"), hosted("2", "Buenos días (merengue)"), hosted("1", "dup")] },
      { slug: "empty", titleEs: "Vacío", titleEn: "Empty", category: "Math", resources: [{ id: "c", kind: "SONG", title: "Chant", content: { lyrics: [] } }] },
      { slug: "numbers", titleEs: "Los números", titleEn: "Numbers", category: "Math", resources: [hosted("3", "Contemos del 0 al 10")] },
    ]);
    expect(rows.map((r) => r.slug)).toEqual(["greetings", "numbers"]);
    expect(rows[0].videos.map((v) => v.id)).toEqual(["1", "2"]);
    expect(galleryCategories(rows)).toEqual(["Everyday", "Math"]);
    expect(rowsFor(rows, "Math").map((r) => r.slug)).toEqual(["numbers"]);
    expect(rowsFor(rows, "Nope")).toHaveLength(2);
    expect(featuredOf(rows)?.video.id).toBe("2");
    expect(featuredOf(rowsFor(rows, "Math"))?.video.id).toBe("3");
  });

  it("keeps grade, category and topic in the links", () => {
    expect(watchHref("v1", { grade: "LOWER", category: "Grace & Courtesy", topic: "greetings" })).toBe("/teacher/library/videos/v1?grade=LOWER&cat=Grace+%26+Courtesy&topic=greetings");
    expect(galleryHref({ grade: "LOWER", category: "Math" })).toBe("/teacher/library?grade=LOWER&type=VIDEO&cat=Math");
    expect(galleryHref({ grade: null })).toBe("/teacher/library?type=VIDEO");
  });
});
