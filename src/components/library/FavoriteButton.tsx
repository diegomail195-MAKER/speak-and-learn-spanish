"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/ui/Art";

/** Heart on a Library topic card: adds it to (or removes it from) "My favorites". */
export function FavoriteButton({ topicId, title, initial, refresh, inline }: { topicId: string; title: string; initial: boolean; refresh?: boolean; inline?: boolean }) {
  const router = useRouter();
  const [on, setOn] = useState(initial);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    const next = !on;
    setOn(next);
    setBusy(true);
    try {
      const res = await fetch("/api/library/favorites", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ topicId, favorite: next }) });
      if (!res.ok) throw new Error();
      if (refresh) router.refresh();
    } catch {
      setOn(!next);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      aria-pressed={on}
      aria-label={`${on ? "Remove from" : "Add to"} My favorites: ${title}`}
      title={on ? "Remove from My favorites" : "Add to My favorites"}
      className={`${inline ? "topic-tool topic-heart" : "lib-card-heart"} ${on ? "lib-heart-on" : ""}`}
      data-testid="favorite-toggle"
    >
      <Icon name="heart" className="h-5 w-5" />
    </button>
  );
}
