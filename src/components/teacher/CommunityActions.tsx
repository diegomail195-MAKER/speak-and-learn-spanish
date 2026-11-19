"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { buttonClass } from "@/components/ui/Button";
import { copyFromCommunity, setCommunityShared } from "@/lib/actions/community";

function CopyButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={buttonClass("primary", "sm", "w-full")} disabled={pending} aria-busy={pending || undefined} data-testid="community-copy">
      {pending ? "Copying…" : "Copy & edit"}
    </button>
  );
}

/** A Community card's buttons: copy it to My Activities; the owner (or the admin) can also take it out. */
export function CommunityActions({ gameId, title, own, canRemove, from }: { gameId: string; title: string; own: boolean; canRemove: boolean; from: "teacher" | "admin" }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  return (
    <div className="space-y-2">
      <form action={copyFromCommunity}>
        <input type="hidden" name="gameId" value={gameId} />
        <input type="hidden" name="from" value={from} />
        <CopyButton />
      </form>
      {(own || canRemove) && (
        <div className="flex gap-2">
          {own && (
            <Link href={`/teacher/games/${gameId}/edit`} className={buttonClass("secondary", "sm", "flex-1")}>
              Edit original
            </Link>
          )}
          <button
            type="button"
            className={buttonClass("danger", "sm", "flex-1")}
            disabled={pending}
            data-testid="community-remove"
            onClick={() => {
              const msg = own
                ? `Take “${title}” out of the Community? It stays in your My Activities, and copies other teachers made stay theirs.`
                : `Take “${title}” out of the Community? The teacher keeps it in their My Activities, and existing copies are not affected.`;
              if (!window.confirm(msg)) return;
              setError("");
              start(async () => {
                const r = await setCommunityShared({ gameId, shared: false });
                if (!r.ok) setError(r.error);
                router.refresh();
              });
            }}
          >
            {pending ? "Removing…" : "Remove"}
          </button>
        </div>
      )}
      {error && <p role="alert" className="text-xs font-semibold text-coral-dark">{error}</p>}
    </div>
  );
}
