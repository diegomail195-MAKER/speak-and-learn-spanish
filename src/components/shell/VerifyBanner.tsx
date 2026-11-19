"use client";

import { useActionState } from "react";
import { resendVerification } from "@/lib/actions/verify";

export function VerifyBanner({ email }: { email: string }) {
  const [state, action, pending] = useActionState(resendVerification, undefined);
  return (
    <div className="no-print border-b border-line bg-sun-soft">
      <form action={action} className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2 text-sm sm:px-6">
        <span className="min-w-0 flex-[1_1_16rem] [overflow-wrap:anywhere]">
          <strong>Confirm your email.</strong> We sent a link to {email}. Open it to finish setting up your account.
        </span>
        {state?.ok ? (
          <span role="status" className="font-bold text-leaf">Sent! Check your inbox.</span>
        ) : (
          <button disabled={pending} className="inline-flex min-h-control items-center rounded-ctl border border-line bg-card px-4 font-bold hover:border-line-strong hover:bg-paper-2 disabled:opacity-50">
            {pending ? "Sending…" : "Send the link again"}
          </button>
        )}
        {state?.error && <span role="alert" className="w-full font-bold text-coral-dark">{state.error}</span>}
      </form>
    </div>
  );
}
