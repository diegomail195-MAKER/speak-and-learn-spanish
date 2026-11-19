"use client";

import { useEffect, useState } from "react";

function dayDiff(d: Date, now: Date) {
  const a = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const b = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return Math.round((b - a) / 86_400_000);
}

/** Formats a date in the viewer's time zone: "Today at 10:24", "Yesterday at 16:47", "Nov 3 at 09:10" (mode "time"), or "today" / "yesterday" / "Nov 3" (mode "day"). */
export function formatLocal(iso: string, mode: "time" | "day" | "full", now = new Date()) {
  const d = new Date(iso);
  const diff = dayDiff(d, now);
  const time = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  const date = d.toLocaleDateString("en-US", { month: "short", day: "numeric", ...(d.getFullYear() !== now.getFullYear() ? { year: "numeric" } : {}) });
  if (mode === "full") return `${d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}, ${time}`;
  const day = diff === 0 ? "today" : diff === 1 ? "yesterday" : date;
  if (mode === "day") return day;
  return `${day.charAt(0).toUpperCase()}${day.slice(1)} at ${time}`;
}

/** A date rendered in the viewer's time zone after hydration (UTC on the server render). */
export function LocalTime({ iso, mode = "time", prefix = "" }: { iso: string; mode?: "time" | "day" | "full"; prefix?: string }) {
  const [text, setText] = useState(() => formatLocal(iso, mode));
  useEffect(() => setText(formatLocal(iso, mode)), [iso, mode]);
  return (
    <time dateTime={iso} suppressHydrationWarning>
      {prefix}
      {text}
    </time>
  );
}
