"use client";

import { useRouter } from "next/navigation";
import { startTransition, useEffect } from "react";
import { WsIcon } from "@/components/shell/WsIcons";

/** Error state of a dashboard page, with a retry that renders the page again. */
export function DashError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const router = useRouter();
  useEffect(() => console.error(error), [error]);
  // Server data errors need a fresh render from the server, not only the client boundary reset.
  const retry = () => startTransition(() => {
    router.refresh();
    reset();
  });
  return (
    <div role="alert" className="ws-card mx-auto max-w-xl p-8 text-center" data-testid="error-state">
      <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#FEF3F2] text-[#B42318]">
        <WsIcon name="alert" className="h-7 w-7" />
      </span>
      <h1 className="ws-h2 mt-4">We couldn’t load this page</h1>
      <p className="mt-2 text-[#5B6577]">Check your connection and try again. If it keeps happening, the data service may be busy.</p>
      <button type="button" onClick={retry} className="ws-btn ws-btn-primary ws-btn-lg mt-6">
        <WsIcon name="refresh" className="h-5 w-5" /> Try again
      </button>
    </div>
  );
}
