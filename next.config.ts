import type { NextConfig } from "next";

// With Supabase Storage, media is read from (and big videos uploaded to) the project's domain.
const storageOrigin = process.env.STORAGE_DRIVER === "supabase" && process.env.SUPABASE_URL ? ` ${new URL(process.env.SUPABASE_URL).origin}` : "";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Microphone only for this site; camera and location never.
  { key: "Permissions-Policy", value: "microphone=(self), camera=(), geolocation=(), payment=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' blob: https://www.youtube.com https://s.ytimg.com" + (process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""),
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://i.ytimg.com" + storageOrigin,
      "media-src 'self' blob:" + storageOrigin,
      "font-src 'self'",
      "connect-src 'self'" + storageOrigin,
      "worker-src 'self' blob:",
      "frame-src https://www.youtube-nocookie.com https://www.youtube.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  serverExternalPackages: ["@prisma/client", "bcryptjs"],
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  experimental: { serverActions: { bodySizeLimit: "2mb" } },
};

export default nextConfig;
