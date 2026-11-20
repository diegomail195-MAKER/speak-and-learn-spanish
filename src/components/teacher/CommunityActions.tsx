"use client";

import Link from "next/link";
import { useFormStatus } from "react-dom";
import { buttonClass } from "@/components/ui/Button";
import { copyFromCommunity } from "@/lib/actions/community";

function CopyButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={buttonClass("primary", "sm", "w-full")} disabled={pending} aria-busy={pending || undefined} data-testid="community-copy">
      {pending ? "Copying…" : "Copy & edit"}
    </button>
  );
}

/** A Community card's buttons: copy it to My Activities; the owner can also open the original. */
export function CommunityActions({ gameId, own, from }: { gameId: string; own: boolean; from: "teacher" | "admin" }) {
  return (
    <div className="space-y-2">
      <form action={copyFromCommunity}>
        <input type="hidden" name="gameId" value={gameId} />
        <input type="hidden" name="from" value={from} />
        <CopyButton />
      </form>
      {own && (
        <Link href={`/${from}/games/${gameId}/edit`} className={buttonClass("secondary", "sm", "w-full")}>
          Edit original
        </Link>
      )}
    </div>
  );
}
