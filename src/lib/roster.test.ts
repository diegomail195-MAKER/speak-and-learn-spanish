import { describe, expect, it } from "vitest";
import { checkRows, friendlyPassword, parseStudentList, uniqueUsername } from "./roster";

describe("parseStudentList", () => {
  it("reads first name + initial in common formats", () => {
    const rows = parseStudentList("Ana López\nLópez, Carlos\nmaría g\n\nJosé, M.\nSofía\tRamírez");
    expect(rows.map((r) => [r.firstName, r.lastInitial, r.username])).toEqual([
      ["Ana", "L", "anal"],
      ["Carlos", "L", "carlosl"],
      ["María", "G", "mariag"],
      ["José", "M", "josem"],
      ["Sofía", "R", "sofiar"],
    ]);
  });
});

describe("checkRows", () => {
  it("flags duplicates in the list and against the roster", () => {
    const rows = parseStudentList("Ana López\nAna Lara\nLuis Pérez");
    const out = checkRows(rows, [{ firstName: "Luis", lastInitial: "P", username: "luisp" }]);
    expect(out[0].problems).toEqual([]);
    expect(out[1].duplicateOf).toBe("list");
    expect(out[2].duplicateOf).toBe("roster");
    expect(out[2].problems).toContain("Username already used in this class.");
  });
  it("lets a corrected row pass", () => {
    const out = checkRows([{ firstName: "Ana", lastInitial: "L", username: "anal" }, { firstName: "Ana", lastInitial: "M", username: "anam" }], []);
    expect(out.every((r) => r.problems.length === 0)).toBe(true);
  });
});

describe("secrets and usernames", () => {
  it("never reuses a taken username", () => {
    expect(uniqueUsername("ana", new Set(["ana", "ana2"]))).toBe("ana3");
  });
  it("makes word-word-number passwords", () => {
    let n = 0;
    expect(friendlyPassword((m) => (n++ * 7) % m)).toMatch(/^[a-z]+-[a-z]+-\d{2}$/);
  });
});
