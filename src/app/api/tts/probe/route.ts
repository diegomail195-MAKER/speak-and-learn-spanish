import { NextResponse } from "next/server";
import { gatewaySpeech, gatewayTranscribe } from "@/lib/tts/gateway";

// Preview-only diagnostics for choosing voices: generates a sample through AI Gateway and
// transcribes it back, so pronunciation can be compared across providers. Disabled unless
// TTS_PROBE_TOKEN is set, and never in production.
export const maxDuration = 60;

export async function GET(req: Request) {
  const token = process.env.TTS_PROBE_TOKEN;
  const u = new URL(req.url);
  if (!token || process.env.VERCEL_ENV === "production" || u.searchParams.get("token") !== token) return new NextResponse("Not found", { status: 404 });
  const p = (k: string) => u.searchParams.get(k) ?? undefined;
  const runs = (p("runs") ?? "").split(";;").filter(Boolean);
  const base = { model: p("model") ?? "", voice: p("voice"), text: p("text") ?? "", instructions: p("instructions"), language: p("language") };
  const jobs = runs.length ? runs.map((r) => ({ ...base, ...Object.fromEntries(r.split("~~").map((kv) => kv.split("=").map(decodeURIComponent) as [string, string])) })) : [base];
  const stt = p("stt") ?? "openai/whisper-1";
  const results = await Promise.all(
    jobs.map(async (j) => {
      const t0 = Date.now();
      try {
        const a = await gatewaySpeech({ model: j.model, text: j.text, voice: j.voice || undefined, instructions: j.instructions || undefined, language: j.language || undefined, outputFormat: (p("format") as "mp3" | "wav") ?? "mp3" });
        const ms = Date.now() - t0;
        let transcript = "";
        try {
          transcript = stt === "none" ? "" : await gatewayTranscribe(stt, a.data, a.mime, j.language?.slice(0, 2));
        } catch (e) {
          transcript = `ERR ${(e as Error).message.slice(0, 200)}`;
        }
        return { ...j, ok: true, ms, bytes: a.data.length, mime: a.mime, warnings: a.warnings, transcript };
      } catch (e) {
        return { ...j, ok: false, ms: Date.now() - t0, error: (e as Error).message.slice(0, 400) };
      }
    }),
  );
  return NextResponse.json({ results });
}
