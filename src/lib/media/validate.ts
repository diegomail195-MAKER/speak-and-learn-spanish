// Validates uploads by their actual bytes, not by the file name or the browser's claimed type.
// SVG is rejected on purpose (it can carry scripts).

export const IMAGE_MAX_BYTES = 5 * 1024 * 1024;

export function sniffImage(buf: Uint8Array): "image/png" | "image/jpeg" | "image/gif" | "image/webp" | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return "image/png";
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x38) return "image/gif";
  const riff = String.fromCharCode(...buf.slice(0, 4));
  const webp = String.fromCharCode(...buf.slice(8, 12));
  if (riff === "RIFF" && webp === "WEBP") return "image/webp";
  return null;
}

export const extFor: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/gif": "gif",
  "image/webp": "webp",
  "audio/mpeg": "mp3",
  "video/mp4": "mp4",
  "video/webm": "webm",
  "text/vtt": "vtt",
};

export const VIDEO_MAX_BYTES = Number(process.env.VIDEO_MAX_MB ?? 500) * 1024 * 1024;

/** MP4/MOV ("ftyp" box) or WebM (EBML header). */
export function sniffVideo(buf: Uint8Array): "video/mp4" | "video/webm" | null {
  if (buf.length < 12) return null;
  if (String.fromCharCode(...buf.slice(4, 8)) === "ftyp") return "video/mp4";
  if (buf[0] === 0x1a && buf[1] === 0x45 && buf[2] === 0xdf && buf[3] === 0xa3) return "video/webm";
  return null;
}

/** WebVTT subtitles must start with "WEBVTT" (optionally after a BOM). */
export function isWebVtt(text: string) {
  return /^\uFEFF?WEBVTT/.test(text);
}

/** Accepts youtube.com/watch?v=, youtu.be/, /shorts/, /embed/ or a bare 11-char id. */
export function parseYouTubeId(input: string): string | null {
  const s = input.trim();
  if (/^[\w-]{11}$/.test(s)) return s;
  try {
    const u = new URL(s);
    const host = u.hostname.replace(/^www\.|^m\./, "");
    if (host === "youtu.be") return /^[\w-]{11}$/.test(u.pathname.slice(1)) ? u.pathname.slice(1) : null;
    if (host === "youtube.com" || host === "youtube-nocookie.com" || host === "music.youtube.com") {
      const v = u.searchParams.get("v");
      if (v && /^[\w-]{11}$/.test(v)) return v;
      const m = u.pathname.match(/^\/(?:embed|shorts|live|v)\/([\w-]{11})/);
      return m ? m[1] : null;
    }
  } catch {}
  return null;
}
