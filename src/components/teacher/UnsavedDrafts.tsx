"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Backup = { id: string; title: string; items: number };

/**
 * Reminds the teacher of activities with changes that only exist on this device (the editor's
 * local backup, kept until the server confirms a save). Opening the activity offers to restore them.
 */
export function UnsavedDrafts() {
  const [backups, setBackups] = useState<Backup[]>([]);
  useEffect(() => {
    const found: Backup[] = [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key?.startsWith("sls-editor-")) continue;
        try {
          const g = JSON.parse(localStorage.getItem(key) ?? "null") as { id?: string; title?: string; items?: unknown[] } | null;
          if (g?.id) found.push({ id: g.id, title: g.title?.trim() || "Untitled activity", items: Array.isArray(g.items) ? g.items.length : 0 });
        } catch {}
      }
    } catch {}
    setBackups(found);
  }, []);
  if (backups.length === 0) return null;
  return (
    <div role="status" className="mb-4 rounded-xl2 border border-sun bg-sun-soft p-4 text-sm">
      <p className="font-bold">
        {backups.length === 1 ? "You have an activity with unsaved changes on this device." : `You have ${backups.length} activities with unsaved changes on this device.`}
      </p>
      <ul className="mt-2 flex flex-wrap gap-2">
        {backups.map((b) => (
          <li key={b.id}>
            <Link href={`/teacher/games/${b.id}/edit`} className="inline-flex min-h-control max-w-full items-center gap-1 rounded-ctl border border-line bg-card px-4 py-2 font-bold leading-tight hover:border-line-strong hover:bg-paper-2">
              {b.title} · {b.items} {b.items === 1 ? "card" : "cards"} → Continue
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
