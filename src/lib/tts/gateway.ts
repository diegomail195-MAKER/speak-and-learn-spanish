import "server-only";
import { getVercelOidcToken } from "@vercel/oidc";

// Vercel AI Gateway: one authorized endpoint for several neural TTS providers.
// Auth: AI_GATEWAY_API_KEY when set, otherwise the deployment's own OIDC token (on Vercel,
// no key needs to be created or stored). Nothing here ever reaches the browser.

const BASE = "https://ai-gateway.vercel.sh/v4/ai";

export class GatewayError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

export function gatewayAvailable() {
  return !!process.env.AI_GATEWAY_API_KEY || !!process.env.VERCEL;
}

async function token() {
  if (process.env.AI_GATEWAY_API_KEY) return process.env.AI_GATEWAY_API_KEY;
  try {
    return await getVercelOidcToken();
  } catch {
    throw new GatewayError("No AI Gateway credentials (set AI_GATEWAY_API_KEY or enable OIDC on Vercel)", 401);
  }
}

export interface GatewaySpeechRequest {
  model: string;
  text: string;
  voice?: string;
  instructions?: string;
  language?: string;
  speed?: number;
  outputFormat?: "mp3" | "wav";
  providerOptions?: Record<string, unknown>;
}

const sniff = (b: Buffer) => (b.subarray(0, 4).toString("ascii") === "RIFF" ? "audio/wav" : "audio/mpeg");

export async function gatewaySpeech(r: GatewaySpeechRequest): Promise<{ data: Buffer; mime: string; warnings: unknown[] }> {
  const res = await fetch(`${BASE}/speech-model`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${await token()}`,
      "ai-gateway-protocol-version": "0.0.1",
      "ai-speech-model-specification-version": "4",
      "ai-model-id": r.model,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text: r.text,
      ...(r.voice ? { voice: r.voice } : {}),
      ...(r.instructions ? { instructions: r.instructions } : {}),
      ...(r.language ? { language: r.language } : {}),
      ...(r.speed && r.speed !== 1 ? { speed: r.speed } : {}),
      outputFormat: r.outputFormat ?? "mp3",
      ...(r.providerOptions ? { providerOptions: r.providerOptions } : {}),
    }),
    signal: AbortSignal.timeout(45_000),
  });
  const body = await res.text();
  if (!res.ok) throw new GatewayError(`AI Gateway TTS ${res.status}: ${body.slice(0, 300)}`, res.status);
  const json = JSON.parse(body) as { audio: string; warnings?: unknown[] };
  const data = Buffer.from(json.audio, "base64");
  if (!data.length) throw new GatewayError("AI Gateway returned empty audio", 502);
  return { data, mime: sniff(data), warnings: json.warnings ?? [] };
}

/** Speech to text: students' answers (lib/stt) and checking generated samples (round trip). */
export async function gatewayTranscribe(model: string, audio: Buffer, mediaType: string, language?: string, prompt?: string): Promise<string> {
  const res = await fetch(`${BASE}/transcription-model`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${await token()}`,
      "ai-gateway-protocol-version": "0.0.1",
      "ai-transcription-model-specification-version": "4",
      "ai-model-id": model,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ audio: audio.toString("base64"), mediaType, ...(language || prompt ? { providerOptions: { openai: { ...(language ? { language } : {}), ...(prompt ? { prompt } : {}) } } } : {}) }),
    signal: AbortSignal.timeout(45_000),
  });
  const body = await res.text();
  if (!res.ok) throw new GatewayError(`AI Gateway STT ${res.status}: ${body.slice(0, 300)}`, res.status);
  return (JSON.parse(body) as { text: string }).text;
}
