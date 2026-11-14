import { z } from "zod";

// LextroSpeak library content. Every resource stores its editable content as JSON (the draft);
// publishing copies it into an immutable ResourceVersion. These schemas are the single
// definition of that JSON, shared by the editor, the server actions and the players.

export const GRADES = ["LOWER", "UPPER"] as const;
export type Grade = (typeof GRADES)[number];
export const GRADE_LABEL: Record<Grade, { label: string; short: string; grades: string }> = {
  LOWER: { label: "Lower Elementary", short: "Lower", grades: "Grades K–2 · ages 6–8" },
  UPPER: { label: "Upper Elementary", short: "Upper", grades: "Grades 3–6 · ages 8–12" },
};

export const KINDS = ["VIDEO", "SONG", "GAME", "FLASHCARDS", "PRINTABLE", "WORKSHEET"] as const;
export type Kind = (typeof KINDS)[number];
export const KIND_LABEL: Record<Kind, { label: string; plural: string; verb: string; color: string; icon: string }> = {
  VIDEO: { label: "Video", plural: "Videos", verb: "Watch", color: "#4CB8F5", icon: "video" },
  SONG: { label: "Song", plural: "Songs", verb: "Listen", color: "#B57BFF", icon: "songs" },
  GAME: { label: "Game", plural: "Games", verb: "Play", color: "#F2559A", icon: "games" },
  FLASHCARDS: { label: "Flashcards", plural: "Flashcards", verb: "Open", color: "#3DD6A3", icon: "flashcards" },
  PRINTABLE: { label: "Printable", plural: "Printables", verb: "Print", color: "#FFC93C", icon: "printables" },
  WORKSHEET: { label: "Worksheet", plural: "Worksheets", verb: "Open", color: "#FF9F5A", icon: "book" },
};

export const GAME_TYPES = ["MEMORY", "MATCH", "LISTEN", "QUIZ"] as const;
export type GameType = (typeof GAME_TYPES)[number];
export const GAME_TYPE_LABEL: Record<GameType, { label: string; es: string; help: string }> = {
  MEMORY: { label: "Memory Game", es: "Memoria", help: "Turn two cards: find each picture and its word." },
  MATCH: { label: "Picture Match", es: "Une la imagen", help: "Tap a picture, then its Spanish word." },
  LISTEN: { label: "Listen & Find", es: "Escucha y busca", help: "Listen to a word and tap the right picture." },
  QUIZ: { label: "Quiz", es: "Preguntas", help: "Answer each question by choosing the right answer." },
};

/** A stored file (uploaded to the library) or a built-in illustration ("animals:perro"). */
const fileRef = z.object({ fileId: z.string().min(1), name: z.string().max(200).default(""), mime: z.string().max(100).default("") });
export type FileRef = z.infer<typeof fileRef>;
const imageRef = z.object({ art: z.string().max(60).optional(), fileId: z.string().optional(), mime: z.string().optional() }).default({});
export type ImageRef = z.infer<typeof imageRef>;

const text = (max: number) => z.string().trim().max(max).default("");

/** External link saved as a resource ("Add Link"): YouTube or any public http(s) page. */
export const linkRef = z.object({ url: z.string().trim().max(2000).refine((u) => publicUrl(u) !== null, "Paste a public link that starts with https:// or http://") });
export type LinkRef = z.infer<typeof linkRef>;

export const flashcard = z.object({
  front: text(120), // Spanish
  back: text(120), // English
  image: imageRef,
  audio: fileRef.nullish(),
});
export type Flashcard = z.infer<typeof flashcard>;

export const pair = z.object({ es: text(120), en: text(120), image: imageRef });
export type Pair = z.infer<typeof pair>;

export const question = z.object({
  prompt: text(200),
  image: imageRef,
  choices: z.array(text(120)).max(6).default([]),
  answer: z.number().int().min(0).max(5).default(0),
});
export type Question = z.infer<typeof question>;

export const contentSchemas = {
  FLASHCARDS: z.object({ instructions: text(400), cards: z.array(flashcard).max(60).default([]), link: linkRef.nullish() }),
  GAME: z.object({
    gameType: z.enum(GAME_TYPES).default("MEMORY"),
    instructions: text(400),
    pairs: z.array(pair).max(40).default([]),
    questions: z.array(question).max(40).default([]),
    link: linkRef.nullish(),
  }),
  VIDEO: z.object({ file: fileRef.nullish(), youtubeId: z.string().regex(/^[\w-]{11}$/).nullish(), captions: text(4000), link: linkRef.nullish() }),
  SONG: z.object({ file: fileRef.nullish(), lyrics: z.array(z.object({ es: text(200), en: text(200), art: z.string().max(60).optional() })).max(60).default([]), link: linkRef.nullish() }),
  PRINTABLE: z.object({
    file: fileRef.nullish(),
    // Generated sheet (no upload): built from words with pictures.
    sheet: z.object({ style: z.enum(["dictionary", "write", "connect"]), heading: text(160), words: z.array(pair).max(16) }).nullish(),
    link: linkRef.nullish(),
  }),
  WORKSHEET: z.object({
    file: fileRef.nullish(),
    sheet: z.object({ style: z.enum(["dictionary", "write", "connect"]), heading: text(160), words: z.array(pair).max(16) }).nullish(),
    link: linkRef.nullish(),
  }),
} satisfies Record<Kind, z.ZodTypeAny>;

export type ContentFor<K extends Kind> = z.infer<(typeof contentSchemas)[K]>;
export type AnyContent = { [K in Kind]: ContentFor<K> }[Kind];

export function parseContent<K extends Kind>(kind: K, raw: unknown): ContentFor<K> {
  return contentSchemas[kind].parse(raw ?? {}) as ContentFor<K>;
}

export function safeContent<K extends Kind>(kind: K, raw: unknown): ContentFor<K> {
  const r = contentSchemas[kind].safeParse(raw ?? {});
  return (r.success ? r.data : contentSchemas[kind].parse({})) as ContentFor<K>;
}

export function emptyContent(kind: Kind): AnyContent {
  return contentSchemas[kind].parse({}) as AnyContent;
}

/** Every library file id referenced anywhere in a content object. */
export function fileIdsOf(content: unknown): string[] {
  const ids = new Set<string>();
  const walk = (v: unknown) => {
    if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === "object") {
      for (const [k, x] of Object.entries(v)) {
        if (k === "fileId" && typeof x === "string" && x) ids.add(x);
        else walk(x);
      }
    }
  };
  walk(content);
  return [...ids];
}

/** Whether content has what a student needs before it can be published. */
export function publishProblem(kind: Kind, content: AnyContent): string | null {
  if ((content as { link?: LinkRef | null }).link?.url) return null;
  switch (kind) {
    case "FLASHCARDS": {
      const c = content as ContentFor<"FLASHCARDS">;
      if (c.cards.length < 1) return "Add at least one card.";
      if (c.cards.some((x) => !x.front)) return "Every card needs Spanish text on the front.";
      return null;
    }
    case "GAME": {
      const c = content as ContentFor<"GAME">;
      if (c.gameType === "QUIZ") {
        if (c.questions.length < 1) return "Add at least one question.";
        if (c.questions.some((q) => !q.prompt || q.choices.filter(Boolean).length < 2 || !q.choices[q.answer])) return "Every question needs a prompt, two or more answers and the right one marked.";
        return null;
      }
      if (c.pairs.length < 2) return "Add at least two pairs.";
      if (c.pairs.some((p) => !p.es || (!p.en && !p.image.art && !p.image.fileId))) return "Every pair needs a Spanish word and an English word or picture.";
      if (c.gameType !== "MATCH" && c.pairs.some((p) => !p.image.art && !p.image.fileId)) return "This game shows pictures: every pair needs one.";
      return null;
    }
    case "VIDEO": {
      const c = content as ContentFor<"VIDEO">;
      return c.file || c.youtubeId ? null : "Upload a video file or paste a YouTube link.";
    }
    case "SONG": {
      const c = content as ContentFor<"SONG">;
      return c.file || c.lyrics.length ? null : "Upload the song or write its lyrics.";
    }
    case "PRINTABLE":
    case "WORKSHEET": {
      const c = content as ContentFor<"PRINTABLE">;
      return c.file || (c.sheet && c.sheet.words.length) ? null : "Upload a PDF or image, or build a sheet from words.";
    }
  }
}

/** "https://youtu.be/abc", "…watch?v=abc", "…/embed/abc", "…/shorts/abc" → 11-char id. */
export function youtubeIdFrom(input: string): string | null {
  const s = input.trim();
  if (/^[\w-]{11}$/.test(s)) return s;
  try {
    const u = new URL(s);
    if (!/(^|\.)youtube\.com$|(^|\.)youtu\.be$|(^|\.)youtube-nocookie\.com$/.test(u.hostname)) return null;
    const id = u.hostname.endsWith("youtu.be") ? u.pathname.slice(1) : u.searchParams.get("v") ?? u.pathname.match(/\/(embed|shorts|live)\/([\w-]{11})/)?.[2] ?? "";
    return /^[\w-]{11}$/.test(id) ? id : null;
  } catch {
    return null;
  }
}

/** A public web address (http or https, a real host name, no credentials), normalized; otherwise null. */
export function publicUrl(input: string): string | null {
  try {
    const u = new URL(input.trim());
    if (u.protocol !== "https:" && u.protocol !== "http:") return null;
    if (u.username || u.password) return null;
    const h = u.hostname.toLowerCase();
    if (!h.includes(".") || h.endsWith(".local") || h.endsWith(".internal") || h === "localhost" || /^[\d.]+$/.test(h) || h.includes(":")) return null;
    return u.toString();
  } catch {
    return null;
  }
}

/**
 * Where a link can be shown inside LextroSpeak (an embeddable player or document viewer that the
 * site's Content-Security-Policy allows). Other sites get an "Open Link" button instead.
 */
export function embedFor(url: string): { src: string; provider: string } | null {
  const yt = youtubeIdFrom(url);
  if (yt) return { src: `https://www.youtube-nocookie.com/embed/${yt}?rel=0`, provider: "YouTube" };
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return null;
  }
  const host = u.hostname.toLowerCase().replace(/^www\./, "");
  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const id = u.pathname.match(/(?:^|\/)(\d{6,12})(?:\/|$)/)?.[1];
    if (id) return { src: `https://player.vimeo.com/video/${id}`, provider: "Vimeo" };
  }
  if (host === "docs.google.com") {
    const m = u.pathname.match(/^\/(document|presentation|spreadsheets|forms)\/d\/([\w-]{10,})/);
    if (m) return { src: `https://docs.google.com/${m[1]}/d/${m[2]}/${m[1] === "forms" ? "viewform?embedded=true" : "preview"}`, provider: "Google" };
  }
  if (host === "drive.google.com") {
    const id = u.pathname.match(/^\/file\/d\/([\w-]{10,})/)?.[1];
    if (id) return { src: `https://drive.google.com/file/d/${id}/preview`, provider: "Google Drive" };
  }
  return null;
}

/** Library file types each kind of content accepts for "Upload File". */
export const UPLOAD_FOR: Partial<Record<Kind, { accept: string; label: string; test: (mime: string) => boolean }>> = {
  VIDEO: { accept: "video/mp4,video/webm", label: "Video file (MP4 or WebM)", test: (m) => m.startsWith("video/") },
  SONG: { accept: "audio/mpeg,audio/mp4,audio/wav,audio/ogg,.mp3,.m4a,.wav,.ogg", label: "Song (MP3, M4A, WAV or OGG)", test: (m) => m.startsWith("audio/") },
  PRINTABLE: { accept: "application/pdf,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/png,image/jpeg,image/webp,image/gif", label: "Document (PDF, DOCX or image)", test: (m) => m === "application/pdf" || m === DOCX_MIME || m.startsWith("image/") },
  WORKSHEET: { accept: "application/pdf,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/png,image/jpeg,image/webp,image/gif", label: "Document (PDF, DOCX or image)", test: (m) => m === "application/pdf" || m === DOCX_MIME || m.startsWith("image/") },
};

export const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export const libraryFileUrl = (fileId: string) => `/api/library/files/${fileId}`;
