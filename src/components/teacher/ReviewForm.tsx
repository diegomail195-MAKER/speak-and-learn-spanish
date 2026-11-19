"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";
import { FormError } from "@/components/ui/Field";
import { submitReview } from "@/lib/actions/review";
import type { ReviewAnswer } from "@/lib/review";

const OUTCOME: Record<ReviewAnswer["outcome"], { label: string; cls: string }> = {
  CORRECT: { label: "Correct", cls: "bg-[#E8F7EE] text-[#146C2E]" },
  INCORRECT: { label: "Not yet", cls: "bg-[#FEF3F2] text-[#B42318]" },
  UNCERTAIN: { label: "Unsure", cls: "bg-[#F3E8FF] text-[#6B21A8]" },
};

/** The teacher decides each answer the app was unsure about (and may change any other), adds a note and saves. */
export function ReviewForm({ workKey, answers, note, reviewed }: { workKey: string; answers: ReviewAnswer[]; note: string; reviewed: boolean }) {
  const [state, action, pending] = useActionState(submitReview, undefined);
  const router = useRouter();
  useEffect(() => { if (state?.ok) router.push("/teacher/review"); }, [state, router]);
  return (
    <form action={action} className="space-y-5" data-testid="review-form">
      <input type="hidden" name="key" value={workKey} />
      <ol className="divide-y divide-[#E2E6EC] rounded-xl border border-[#E2E6EC] bg-white">
        {answers.map((a, i) => {
          const needs = a.outcome === "UNCERTAIN" && !a.teacher;
          const current = a.teacher ?? (a.outcome === "UNCERTAIN" ? "" : a.outcome);
          return (
            <li key={a.id} className={`grid gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center ${needs ? "bg-[#FBF8FF]" : ""}`} data-testid="review-answer">
              <div className="min-w-0">
                <p className="text-sm font-bold text-[#5B6577]">{i + 1}. {a.prompt || "Say"}</p>
                <p className="font-display text-lg font-extrabold [overflow-wrap:anywhere]">{a.expected}</p>
                <p className="mt-1 text-[15px] text-[#3D4759] [overflow-wrap:anywhere]">
                  Heard: <span className="font-semibold">{a.transcript ? `“${a.transcript}”` : "nothing"}</span>
                  <span className={`ml-2 inline-flex rounded-full px-2 py-0.5 text-xs font-bold ${OUTCOME[a.outcome].cls}`}>{OUTCOME[a.outcome].label}</span>
                  {a.tries > 1 && <span className="ml-2 text-xs text-[#5B6577]">{a.tries} tries</span>}
                </p>
              </div>
              <fieldset className="flex gap-2">
                <legend className="sr-only">Your decision for answer {i + 1}</legend>
                {(["CORRECT", "INCORRECT"] as const).map((v) => (
                  <label key={v} className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-[#E2E6EC] bg-white px-3 font-bold has-[:checked]:border-[#2563EB] has-[:checked]:bg-[#E8EFFF] has-[:checked]:text-[#1D4ED8]">
                    <input type="radio" name={`decision:${a.id}`} value={v} defaultChecked={current === v} required={needs} className="h-4 w-4" />
                    {v === "CORRECT" ? "Correct" : "Not yet"}
                  </label>
                ))}
              </fieldset>
            </li>
          );
        })}
      </ol>
      <div>
        <label htmlFor="note" className="mb-1.5 block font-bold">Note <span className="font-normal text-[#5B6577]">(optional, for your records)</span></label>
        <textarea id="note" name="note" defaultValue={note} maxLength={1000} rows={3} className="ws-input min-h-24 py-2" placeholder="e.g. Good effort, practise the rr in “perro”." />
      </div>
      <FormError message={state?.error} />
      <div className="flex flex-wrap gap-3">
        <button className="ws-btn ws-btn-primary ws-btn-lg" disabled={pending} data-testid="review-save">{pending ? "Saving…" : reviewed ? "Update review" : "Mark as reviewed"}</button>
      </div>
    </form>
  );
}
