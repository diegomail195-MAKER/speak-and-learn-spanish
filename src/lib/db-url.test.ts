import { describe, expect, it } from "vitest";
import { poolerSafeUrl } from "./db-url";

const host = "postgresql://postgres.ref:secret@aws-0-us-east-1.pooler.supabase.com";

describe("poolerSafeUrl", () => {
  it("adds pgbouncer and connection_limit on the transaction pooler", () => {
    const out = new URL(poolerSafeUrl(`${host}:6543/postgres`)!);
    expect(out.searchParams.get("pgbouncer")).toBe("true");
    expect(out.searchParams.get("connection_limit")).toBe("1");
    expect(out.password).toBe("secret");
  });

  it("keeps values that are already set", () => {
    const url = `${host}:6543/postgres?pgbouncer=true&connection_limit=3`;
    expect(new URL(poolerSafeUrl(url)!).searchParams.get("connection_limit")).toBe("3");
  });

  it("leaves other ports and bad input alone", () => {
    expect(poolerSafeUrl(`${host}:5432/postgres`)).toBe(`${host}:5432/postgres`);
    expect(poolerSafeUrl(undefined)).toBeUndefined();
    expect(poolerSafeUrl("not a url")).toBe("not a url");
  });
});
