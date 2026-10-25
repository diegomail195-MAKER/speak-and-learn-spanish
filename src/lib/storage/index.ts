import "server-only";
import { createReadStream, createWriteStream } from "node:fs";
import { mkdir, readFile, rename, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";

// Private file storage. Files are never served from a public folder: they are streamed by
// /api/media/[id] after an authorization check.
// The local driver writes to STORAGE_DIR. For serverless hosting (Vercel) implement the same
// interface over Supabase Storage / S3 and select it with STORAGE_DRIVER.

export interface StorageDriver {
  put(key: string, data: Buffer, contentType: string): Promise<void>;
  /** Moves an already-written temporary file into storage (large uploads). */
  putFile(key: string, tempPath: string): Promise<void>;
  get(key: string): Promise<Buffer>;
  size(key: string): Promise<number>;
  /** Byte range as a web stream (inclusive end), for video/audio seeking. */
  stream(key: string, start: number, end: number): ReadableStream<Uint8Array>;
  remove(key: string): Promise<void>;
}

const root = path.resolve(process.env.STORAGE_DIR ?? "./storage");

function safePath(key: string) {
  const p = path.resolve(root, key);
  if (!p.startsWith(root + path.sep)) throw new Error("Invalid storage key");
  return p;
}

export const tempDir = () => path.join(root, ".tmp");

const local: StorageDriver = {
  async put(key, data) {
    const p = safePath(key);
    await mkdir(path.dirname(p), { recursive: true });
    await writeFile(p, data);
  },
  async putFile(key, tempPath) {
    const p = safePath(key);
    await mkdir(path.dirname(p), { recursive: true });
    await rename(tempPath, p);
  },
  get: (key) => readFile(safePath(key)),
  size: async (key) => (await stat(safePath(key))).size,
  stream: (key, start, end) => Readable.toWeb(createReadStream(safePath(key), { start, end })) as ReadableStream<Uint8Array>,
  remove: (key) => unlink(safePath(key)).catch(() => undefined),
};

export function storage(): StorageDriver {
  const driver = process.env.STORAGE_DRIVER ?? "local";
  if (driver === "local") return local;
  throw new Error(`Storage driver "${driver}" is not implemented yet. Use STORAGE_DRIVER=local.`);
}

/** Writes a request body to a temp file, enforcing a byte limit. Returns path, size and first bytes. */
export async function bodyToTempFile(body: ReadableStream<Uint8Array>, maxBytes: number) {
  await mkdir(tempDir(), { recursive: true });
  const tmp = path.join(tempDir(), `${Date.now()}-${Math.random().toString(36).slice(2)}`);
  const out = createWriteStream(tmp);
  let size = 0;
  let head = Buffer.alloc(0);
  const reader = body.getReader();
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > maxBytes) throw new Error("too_large");
      if (head.length < 64) head = Buffer.concat([head, Buffer.from(value.subarray(0, 64 - head.length))]);
      if (!out.write(value)) await new Promise<void>((r) => out.once("drain", () => r()));
    }
    await new Promise<void>((res, rej) => out.end((e?: Error | null) => (e ? rej(e) : res())));
    return { tmp, size, head };
  } catch (e) {
    out.destroy();
    await unlink(tmp).catch(() => undefined);
    throw e;
  }
}
