import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { azureSsml, joinPcm, wavSamples } from "./index";
import { AZURE_VOICES } from "./voices";
import { speechSegments } from "@/lib/text/segments";

const v = (id: string) => AZURE_VOICES.find((x) => x.id === id)!;

describe("multilingual synthesis", () => {
  it("Test 6: ¿Cómo se dice en español, LOVE? → Spanish voice + US English voice in one SSML", () => {
    const parts = speechSegments("¿Cómo se dice en español, [en]LOVE[/en]?", "es-419").map((s) => ({ text: s.text, voice: s.language === "es-419" ? v("es-MX-DaliaNeural") : v("en-US-AnaNeural") }));
    const ssml = azureSsml({ parts, rate: 1 });
    expect(ssml).toContain('<voice name="es-MX-DaliaNeural"><prosody rate="+0%">¿Cómo se dice en español,</prosody></voice>');
    expect(ssml).toContain('<voice name="en-US-AnaNeural"><prosody rate="+0%">LOVE?</prosody></voice>');
  });

  it("Test 7: BONJOUR is read by a French voice", () => {
    const parts = speechSegments("¿Cómo se dice en español, [fr]BONJOUR[/fr]?", "es-419").map((s) => ({ text: s.text, voice: s.language === "fr-FR" ? v("fr-FR-DeniseNeural") : v("es-MX-DaliaNeural") }));
    expect(azureSsml({ parts, rate: 0.95 })).toMatch(/<voice name="fr-FR-DeniseNeural"><prosody rate="-5%">BONJOUR\?<\/prosody><\/voice>/);
  });

  it("joins PCM runs into one WAV with a short gap and no clicks", () => {
    const tone = (n: number) => Int16Array.from({ length: n }, (_, i) => Math.round(8000 * Math.sin(i / 5)));
    const silence = new Int16Array(2400);
    const a = Int16Array.from([...silence, ...tone(4800), ...silence]);
    const wav = joinPcm([a, tone(4800)], 24000, 120);
    const out = wavSamples(wav);
    expect(wav.toString("ascii", 0, 4)).toBe("RIFF");
    // leading silence trimmed (keeps a 10 ms fade-in), 120 ms gap between runs
    expect(out.length).toBeLessThan(4800 * 2 + 2880 + 4 * 240 + 10);
    expect(Math.abs(out[0])).toBeLessThan(50);
    expect(Math.abs(out[out.length - 1])).toBeLessThan(300);
  });
});

describe("AI Gateway audio helpers", () => {
  it("reads the sample rate of a WAV file", async () => {
    const { joinPcm, wavRate } = await import("./index");
    expect(wavRate(joinPcm([new Int16Array(100).fill(1000)], 24000))).toBe(24000);
    expect(wavRate(joinPcm([new Int16Array(100).fill(1000)], 44100))).toBe(44100);
  });

  it("cache key changes with voice, speed and text, and not with spacing", async () => {
    const { ttsCacheKey } = await import("./index");
    const v = { id: "g:es", label: "", language: "es-419" as const, providerLocale: "es-MX", model: "m", name: "A" };
    const k = (text: string, rate = 0.95, voice = v) => ttsCacheKey("gateway", { parts: [{ text, voice }], rate });
    expect(k("pingüino")).toBe(k(" pingüino "));
    expect(k("pingüino")).not.toBe(k("pinguino"));
    expect(k("rojo", 0.95)).not.toBe(k("rojo", 0.8));
    expect(k("rojo")).not.toBe(k("rojo", 0.95, { ...v, id: "g:es2" }));
  });
});
