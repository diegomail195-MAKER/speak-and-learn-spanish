import { describe, expect, it } from "vitest";
import { adminEmails, isPlatformAdmin } from "./admin";

describe("platform admin", () => {
  it("parses the email list", () => {
    expect(adminEmails(" A@x.com, b@y.com ;c@z.com ")).toEqual(["a@x.com", "b@y.com", "c@z.com"]);
    expect(adminEmails("")).toEqual([]);
  });
  it("only lets listed emails or ADMIN users in", () => {
    expect(isPlatformAdmin({ role: "TEACHER", email: "Owner@Site.com" }, "owner@site.com")).toBe(true);
    expect(isPlatformAdmin({ role: "TEACHER", email: "other@site.com" }, "owner@site.com")).toBe(false);
    expect(isPlatformAdmin({ role: "TEACHER", email: null }, "owner@site.com")).toBe(false);
    expect(isPlatformAdmin({ role: "TEACHER", email: "owner@site.com" }, "")).toBe(false);
    expect(isPlatformAdmin({ role: "ADMIN", email: null }, "")).toBe(true);
    expect(isPlatformAdmin(null, "owner@site.com")).toBe(false);
  });
});
