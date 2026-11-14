import { ART, artSvg } from "@/lib/library/art";

// Renders a built-in LextroSpeak illustration (static SVG markup we ship, never user input).
export function Art({ k, className = "", label }: { k: string | null | undefined; className?: string; label?: string }) {
  const svg = artSvg(k);
  if (!svg) return null;
  return <span role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : true} className={`art inline-block ${className}`} dangerouslySetInnerHTML={{ __html: svg }} />;
}

export function Pinita({ mood = "happy", className = "h-20 w-20" }: { mood?: "happy" | "cheer" | "think"; className?: string }) {
  return <Art k={`pinita:${mood}`} className={className} label="Piñita" />;
}

/** Small line icon (home, songs, games, flashcards, printables, video, speaker, star…). */
export function Icon({ name, className = "h-5 w-5" }: { name: string; className?: string }) {
  return <span aria-hidden="true" className={`art inline-block shrink-0 ${className}`} dangerouslySetInnerHTML={{ __html: ART.ico(name) }} />;
}
