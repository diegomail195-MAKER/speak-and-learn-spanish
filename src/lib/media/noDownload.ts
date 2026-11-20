// Videos and songs are only for watching and listening inside LextroSpeak, never to save.
// Browsers say why they ask for a file (Sec-Fetch-Dest): "video"/"audio" from a player on our
// pages, "document" when someone opens the file's address in a tab (where "Save as…" works).
// Opening an audio or video file as a page is refused. Best effort: it stops the everyday ways of
// downloading, not screen recording.
export function isMediaOpenedAsPage(req: Request, mimeType: string): boolean {
  if (!mimeType.startsWith("video/") && !mimeType.startsWith("audio/")) return false;
  const dest = req.headers.get("sec-fetch-dest");
  return dest === "document" || dest === "iframe" || dest === "embed" || dest === "object";
}
