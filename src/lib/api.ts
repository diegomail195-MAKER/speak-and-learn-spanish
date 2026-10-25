import "server-only";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { HttpError } from "@/lib/auth/guards";

/** Wraps a route handler so auth/validation errors become clean JSON responses. */
export function handle<A extends unknown[]>(fn: (...args: A) => Promise<Response>) {
  return async (...args: A) => {
    try {
      return await fn(...args);
    } catch (e) {
      if (e instanceof HttpError) return NextResponse.json({ error: e.message }, { status: e.status });
      if (e instanceof ZodError) return NextResponse.json({ error: "invalid_request", issues: e.issues }, { status: 400 });
      console.error(e);
      return NextResponse.json({ error: "server_error" }, { status: 500 });
    }
  };
}
