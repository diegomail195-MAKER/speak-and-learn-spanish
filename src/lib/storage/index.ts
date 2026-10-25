import "server-only";
import { createReadStream, createWriteStream } from "node:fs";
import { mkdir, readFile, rename, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";

// Private file storage. Files are never served from a public folder: they are streamed by
// /api/media/[id] after an authorization check.
// "local" writes to STORAGE_DIR (one server with a disk). "supabase" uses a private Supabase
// Storage bucket (serverless hosting such as Vercel): files are served through short-lived signed
// URLs after the same authorization check, and large videos upload straight from the browser to
// a one-time signed upload URL.

export interface StorageDriver {
  put(key: string, data: Buffer, contentType: string): Promise<void>;
  /** Moves an already-written temporary file into storage (large uploads). */
  putFile(key: string, tempPath: string): Promise<void>;
  get(key: string): Promise<Buffer>;
  size(key: string): Promise<number>;
  /** Byte range as a web stream (inclusive end), for video/audio seeking. */
  stream(key: string, start: number, end: number): ReadableStream<Uint8Array>;
  remove(key: string): Promise<void>;
  /** Remote drivers: a short-lived URL the browser may read the file from. */
  signedUrl?(key: string, expiresInSec: number): Promise<string>;
  /** Remote drivers: a one-time URL the browser may PUT the file to. */
  signedUploadUrl?(key: string): Promise<string>;
  /** Remote drivers: total size and first bytes of a stored file (to verify a direct upload). */
  head?(key: string, bytes: number): Promise<{ size: number; head: Buffer } | null>;
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

// Supabase Storage REST API, called only from the server with the service role key
// (never sent to the browser). The bucket is private and created on first use.
function supabase(): StorageDriver {
  const base = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucket = process.env.SUPABASE_BUCKET ?? "media";
  if (!base || !key) throw new Error("STORAGE_DRIVER=supabase needs SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  const api = `${base}/storage/v1`;
  const auth = { Authorization: `Bearer ${key}`, apikey: key };
  const obj = (k: string) => `${encodeURIComponent(bucket)}/${k.split("/").map(encodeURIComponent).join("/")}`;
  const fail = async (res: Response, what: string) => {
    throw new Error(`Supabase Storage ${what} failed: ${res.status} ${(await res.text()).slice(0, 200)}`);
  };
  const ensureBucket = async () => {
    bucketReady ??= fetch(`${api}/bucket`, {
      method: "POST",
      headers: { ...auth, "Content-Type": "application/json" },
      body: JSON.stringify({ id: bucket, name: bucket, public: false }),
    }).then(async (res) => {
      // 400/409 = already exists
      if (!res.ok && res.status !== 409 && res.status !== 400) await fail(res, "create bucket");
    });
    return bucketReady.catch((e) => {
      bucketReady = null;
      throw e;
    });
  };
  const put = async (k: string, data: Buffer | ReadableStream<Uint8Array>, contentType: string, size?: number) => {
    await ensureBucket();
    const res = await fetch(`${api}/object/${obj(k)}`, {
      method: "POST",
      headers: { ...auth, "Content-Type": contentType, "x-upsert": "true", "cache-control": "max-age=31536000", ...(size != null ? { "Content-Length": String(size) } : {}) },
      body: data as BodyInit,
      // @ts-expect-error -- Node fetch needs duplex for streamed bodies
      duplex: "half",
    });
    if (!res.ok) await fail(res, "upload");
  };
  const range = async (k: string, start: number, end: number) => {
    const res = await fetch(`${api}/object/authenticated/${obj(k)}`, { headers: { ...auth, Range: `bytes=${start}-${end}` } });
    if (!res.ok) await fail(res, "download");
    return res;
  };
  return {
    put: (k, data, contentType) => put(k, data, contentType),
    async putFile(k, tempPath) {
      const { size } = await stat(tempPath);
      await put(k, Readable.toWeb(createReadStream(tempPath)) as ReadableStream<Uint8Array>, "application/octet-stream", size);
      await unlink(tempPath).catch(() => undefined);
    },
    async get(k) {
      const res = await fetch(`${api}/object/authenticated/${obj(k)}`, { headers: auth });
      if (!res.ok) await fail(res, "download");
      return Buffer.from(await res.arrayBuffer());
    },
    async size(k) {
      const h = await this.head!(k, 1);
      if (!h) throw new Error("Not found");
      return h.size;
    },
    stream(k, start, end) {
      const p = range(k, start, end);
      return new ReadableStream<Uint8Array>({
        async start(c) {
          const reader = (await p).body!.getReader();
          for (;;) {
            const { done, value } = await reader.read();
            if (done) break;
            c.enqueue(value);
          }
          c.close();
        },
      });
    },
    async remove(k) {
      await fetch(`${api}/object/${encodeURIComponent(bucket)}`, { method: "DELETE", headers: { ...auth, "Content-Type": "application/json" }, body: JSON.stringify({ prefixes: [k] }) }).catch(() => undefined);
    },
    async signedUrl(k, expiresIn) {
      const res = await fetch(`${api}/object/sign/${obj(k)}`, { method: "POST", headers: { ...auth, "Content-Type": "application/json" }, body: JSON.stringify({ expiresIn }) });
      if (!res.ok) await fail(res, "sign");
      const { signedURL } = (await res.json()) as { signedURL: string };
      return `${api}${signedURL}`;
    },
    async signedUploadUrl(k) {
      await ensureBucket();
      const res = await fetch(`${api}/object/upload/sign/${obj(k)}`, { method: "POST", headers: auth });
      if (!res.ok) await fail(res, "sign upload");
      const { url } = (await res.json()) as { url: string };
      return `${api}${url}`;
    },
    async head(k, bytes) {
      const res = await fetch(`${api}/object/authenticated/${obj(k)}`, { headers: { ...auth, Range: `bytes=0-${bytes - 1}` } });
      if (res.status === 404 || res.status === 400) return null;
      if (!res.ok) await fail(res, "read");
      const total = Number(res.headers.get("content-range")?.split("/")[1] ?? res.headers.get("content-length") ?? 0);
      const buf = Buffer.from(await res.arrayBuffer()).subarray(0, bytes);
      return { size: total || buf.length, head: buf };
    },
  };
}

let bucketReady: Promise<void> | null = null;
let remote: StorageDriver | null = null;

export function storage(): StorageDriver {
  const driver = process.env.STORAGE_DRIVER ?? "local";
  if (driver === "local") return local;
  if (driver === "supabase") return (remote ??= supabase());
  throw new Error(`Unknown STORAGE_DRIVER "${driver}". Use "local" or "supabase".`);
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
