import "server-only";
import { mkdir, readFile, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

// Private file storage. Files are never served from a public folder: they are streamed by
// /api/media/[id] after an authorization check.
// The local driver writes to STORAGE_DIR. For serverless hosting (Vercel) implement the same
// interface over Supabase Storage / S3 and select it with STORAGE_DRIVER.

export interface StorageDriver {
  put(key: string, data: Buffer, contentType: string): Promise<void>;
  get(key: string): Promise<Buffer>;
  size(key: string): Promise<number>;
  remove(key: string): Promise<void>;
}

const root = path.resolve(process.env.STORAGE_DIR ?? "./storage");

function safePath(key: string) {
  const p = path.resolve(root, key);
  if (!p.startsWith(root + path.sep)) throw new Error("Invalid storage key");
  return p;
}

const local: StorageDriver = {
  async put(key, data) {
    const p = safePath(key);
    await mkdir(path.dirname(p), { recursive: true });
    await writeFile(p, data);
  },
  get: (key) => readFile(safePath(key)),
  size: async (key) => (await stat(safePath(key))).size,
  remove: (key) => unlink(safePath(key)).catch(() => undefined),
};

export function storage(): StorageDriver {
  const driver = process.env.STORAGE_DRIVER ?? "local";
  if (driver === "local") return local;
  throw new Error(`Storage driver "${driver}" is not implemented yet. Use STORAGE_DRIVER=local.`);
}
