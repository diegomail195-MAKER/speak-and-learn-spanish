import { NextResponse, type NextRequest } from "next/server";

// Cross-site request protection for the JSON/upload API. Server actions already get this check
// from Next.js; API routes did not. The session cookie is SameSite=Lax, which stops other
// websites but NOT other subdomains of the same site (e.g. a future tool on
// rollcallrocket.speakandlearnspanish.com counts as "same site"). So any state-changing API call
// must come from this exact origin.
export function middleware(req: NextRequest) {
  const method = req.method.toUpperCase();
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") return NextResponse.next();
  const origin = req.headers.get("origin");
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  // Browsers send Origin on every cross-origin POST (and on same-origin fetch/sendBeacon POSTs).
  // A request without Origin is not from another site's page, so it can't ride the cookie.
  if (origin) {
    let originHost: string | null = null;
    try {
      originHost = new URL(origin).host;
    } catch {
      originHost = null;
    }
    if (!originHost || originHost !== host) {
      return NextResponse.json({ error: "cross_origin_request_blocked" }, { status: 403 });
    }
  }
  return NextResponse.next();
}

export const config = { matcher: "/api/:path*" };
