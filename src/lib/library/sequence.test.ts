import { describe, expect, it } from "vitest";
import { lessonEntry, openSteps } from "./sequence";

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

describe("lessonEntry", () => {
  const partial = [{ done: true }, { done: false }, { done: false }];
  const all = [{ done: true }, { done: true }, { done: true }];
  it("resumes the current step without a link", () => {
    expect(lessonEntry(partial, undefined)).toEqual({ startAt: null, notice: null });
  });
  it("keeps a future step locked from a direct link", () => {
    const e = lessonEntry(partial, "3");
    expect(e.startAt).toBeNull();
    expect(e.notice).toMatch(/locked/);
  });
  it("does not reopen a finished step before the topic is completed", () => {
    const e = lessonEntry(partial, "1");
    expect(e.startAt).toBeNull();
    expect(e.notice).toMatch(/once you finish/);
  });
  it("opens the current step from its link silently", () => {
    expect(lessonEntry(partial, "2")).toEqual({ startAt: null, notice: null });
  });
  it("opens any step as a repeat once the topic is completed", () => {
    expect(lessonEntry(all, "2")).toEqual({ startAt: 1, notice: null });
  });
  it("ignores invalid values", () => {
    expect(lessonEntry(partial, "9")).toEqual({ startAt: null, notice: null });
    expect(lessonEntry(partial, "abc")).toEqual({ startAt: null, notice: null });
    expect(lessonEntry(partial, "0")).toEqual({ startAt: null, notice: null });
  });
});
