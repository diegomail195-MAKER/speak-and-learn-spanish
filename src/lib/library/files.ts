import "server-only";
import { sniffAudio, sniffImage, sniffVideo } from "@/lib/media/validate";

// Library uploads: videos, songs (audio), PDFs and images. Types are checked by the file's
// first bytes, never by its name or the browser's claim. SVG/HTML are never accepted.

export const LIBRARY_MAX_BYTES = Number(process.env.VIDEO_MAX_MB ?? 500) * 1024 * 1024;

export type FileGroup = "video" | "audio" | "pdf" | "image" | "document";

const DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export function sniffLibraryFile(head: Uint8Array, name = ""): { mime: string; group: FileGroup } | null {
  // Word document (.docx): a ZIP whose first entry is one of the Office package parts.
  if (head.length >= 34 && head[0] === 0x50 && head[1] === 0x4b && head[2] === 0x03 && head[3] === 0x04 && /\.docx$/i.test(name)) {
    const nameLen = head[26] | (head[27] << 8);
    const first = String.fromCharCode(...head.slice(30, 30 + Math.min(nameLen, head.length - 30)));
    if (/^(\[Content_Types\]\.xml|_rels\/|word\/|docProps\/)/.test(first)) return { mime: DOCX, group: "document" };
    return null;
  }
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
  [DOCX]: "docx",
};
