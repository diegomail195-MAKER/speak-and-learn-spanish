import { describe, expect, it } from "vitest";
import { dedupeRecipients } from "./tasks";

describe("dedupeRecipients", () => {
  it("assigns a student once when picked individually and through a group", () => {
    const r = dedupeRecipients([{ id: "g1", memberIds: ["a", "b"] }], ["b", "c", "c"]);
    expect(r.groupIds).toEqual(["g1"]);
    expect(r.studentIds).toEqual(["c"]);
    expect(r.dropped).toEqual(["b"]);
    expect(r.studentCount).toBe(3);
  });
});
