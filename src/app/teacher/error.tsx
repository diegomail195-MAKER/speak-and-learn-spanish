"use client";

import { DashError } from "@/components/dashboard/States";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <DashError error={error} reset={reset} />;
}
