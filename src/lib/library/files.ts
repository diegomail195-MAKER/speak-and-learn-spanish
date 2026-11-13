import "server-only";
import { sniffAudio, sniffImage, sniffVideo } from "@/lib/media/validate";

// Library uploads: videos, songs (audio), PDFs and images. Types are checked by the file's
// first bytes, never by its name or the browser's claim. SVG/HTML are never accepted.

export const LIBRARY_MAX_BYTES = Number(process.env.VIDEO_MAX_MB ?? 500) * 1024 * 1024;

export type FileGroup = "video" | "audio" | "pdf" | "image";

export function sniffLibraryFile(head: Uint8Array): { mime: string; group: FileGroup } | null {
  const img = sniffImage(head);
  if (img) return { mime: img, group: "image" };
  if (head.length >= 5 && String.fromCharCode(...head.slice(0, 5)) === "%PDF-") return { mime: "application/pdf", group: "pdf" };
  // MP4 container: "ftyp" brand decides audio (M4A) or video.
  if (head.length >= 12 && String.fromCharCode(...head.slice(4, 8)) === "ftyp") {
    const brand = String.fromCharCode(...head.slice(8, 12));
    return /^M4A |^M4B /.test(brand) ? { mime: "audio/mp4", group: "audio" } : { mime: "video/mp4", group: "video" };
  }
  const aud = sniffAudio(head);
  if (aud && aud !== "audio/webm") return { mime: aud, group: "audio" };
  const vid = sniffVideo(head);
  if (vid) return { mime: vid, group: "video" };
  return null;
}

export const EXT: Record<string, string> = {
  "image/png": "png", "image/jpeg": "jpg", "image/gif": "gif", "image/webp": "webp",
  "application/pdf": "pdf", "video/mp4": "mp4", "video/webm": "webm",
  "audio/mpeg": "mp3", "audio/wav": "wav", "audio/ogg": "ogg", "audio/mp4": "m4a",
};
