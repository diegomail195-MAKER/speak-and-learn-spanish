import { describe, expect, it } from "vitest";
import { openSteps } from "./sequence";

describe("openSteps", () => {
  it("opens finished steps and the first unfinished one only", () => {
    expect([...openSteps([{ id: "a", done: true }, { id: "b", done: false }, { id: "c", done: false }])]).toEqual(["a", "b"]);
  });
  it("opens only the first step of a new task", () => {
    expect([...openSteps([{ id: "a", done: false }, { id: "b", done: false }])]).toEqual(["a"]);
  });
  it("opens every step once all are finished (practice again)", () => {
    expect([...openSteps([{ id: "a", done: true }, { id: "b", done: true }])]).toEqual(["a", "b"]);
  });
  it("keeps finished steps open even after an unfinished one", () => {
    expect([...openSteps([{ id: "a", done: false }, { id: "b", done: false }, { id: "c", done: true }])].sort()).toEqual(["a", "c"]);
  });
  it("skips steps whose activity is gone, like the lesson", () => {
    expect([...openSteps([{ id: "a", done: true }, { id: "x", done: false, skip: true }, { id: "b", done: false }, { id: "c", done: false }])]).toEqual(["a", "b"]);
  });
});
