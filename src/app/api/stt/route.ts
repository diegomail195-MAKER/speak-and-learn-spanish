import { NextResponse } from "next/server";
import { handle } from "@/lib/api";
import { HttpError, requireUser } from "@/lib/auth/guards";
import { rateLimit } from "@/lib/rate-limit";
import { recognize, sttLocale, sttProvider } from "@/lib/stt";

const MAX_WAV_BYTES = 16000 * 2 * 12 + 44; // 12 s of 16 kHz 16-bit mono

export const GET = handle(async () => {
  await requireUser();
  return NextResponse.json({ provider: sttProvider() });
});

export const POST = handle(async (req: Request) => {
  const user = await requireUser();
  const provider = sttProvider();
  if (!provider) return NextResponse.json({ error: "stt_not_configured" }, { status: 503 });
  if (!rateLimit(`stt:${user.id}`, 120, 10 * 60_000)) throw new HttpError(429, "Too many requests");

  const url = new URL(req.url);
  const language = url.searchParams.get("language") ?? "es-419";
  const mode = url.searchParams.get("mode") === "LETTERS" ? "LETTERS" : "PHRASE";
  const reference = url.searchParams.get("reference")?.slice(0, 200) || undefined;

  const buf = Buffer.from(await req.arrayBuffer());
  if (buf.length < 44 || buf.length > MAX_WAV_BYTES) throw new HttpError(413, "Audio too long or empty");
  if (buf.toString("ascii", 0, 4) !== "RIFF" || buf.toString("ascii", 8, 12) !== "WAVE") throw new HttpError(415, "Expected WAV audio");

  const result = await recognize(provider, buf, { locale: sttLocale(language), mode, reference });
  return NextResponse.json(result);
});
