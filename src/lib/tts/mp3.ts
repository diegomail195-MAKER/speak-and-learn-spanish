import { Mp3Encoder } from "@breezystack/lamejs";

/**
 * Mono 16-bit PCM → MP3. Speech at 64 kbps is about 8 KB per second, roughly a sixth of the WAV
 * the voice service returns, so clips start playing much sooner on school Wi-Fi and phones.
 */
export function pcmToMp3(samples: Int16Array, sampleRate: number, kbps = 64): Buffer {
  const enc = new Mp3Encoder(1, sampleRate, kbps);
  const out: Buffer[] = [];
  for (let i = 0; i < samples.length; i += 1152) {
    const b = enc.encodeBuffer(samples.subarray(i, i + 1152));
    if (b.length) out.push(Buffer.from(b.buffer, b.byteOffset, b.length));
  }
  const end = enc.flush();
  if (end.length) out.push(Buffer.from(end.buffer, end.byteOffset, end.length));
  return Buffer.concat(out);
}
