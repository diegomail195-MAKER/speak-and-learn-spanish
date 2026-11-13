"use client";

import { useActionState } from "react";
import { resendVerification } from "@/lib/actions/verify";

export function VerifyBanner({ email }: { email: string }) {
  const [state, action, pending] = useActionState(resendVerification, undefined);
  return (
    <div className="no-print border-b border-line bg-sun-soft">
      <form action={action} className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-5 py-2.5 text-sm">
        <span className="flex-1">
          <strong>Confirm your email.</strong> We sent a link to {email}. Open it to finish setting up your account.
        </span>
        {state?.ok ? (
          <span role="status" className="font-bold text-leaf">Sent! Check your inbox.</span>
        ) : (
          <button disabled={pending} className="rounded-full bg-card px-3 py-1.5 font-bold ring-1 ring-line hover:ring-ink-2/40 disabled:opacity-50">
            {pending ? "Sending…" : "Send the link again"}
          </button>
        )}
        {state?.error && <span role="alert" className="w-full font-bold text-coral-dark">{state.error}</span>}
      </form>
    </div>
  );
}
