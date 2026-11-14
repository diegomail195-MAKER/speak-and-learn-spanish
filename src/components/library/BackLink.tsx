"use client";

import { useRouter } from "next/navigation";

export function BackLink({ label = "‹ Back" }: { label?: string }) {
  const router = useRouter();
  return (
    <button type="button" onClick={() => (window.history.length > 1 ? router.back() : router.push("/teacher/library"))} className="no-print text-sm font-bold text-sky hover:underline">
      {label}
    </button>
  );
}
