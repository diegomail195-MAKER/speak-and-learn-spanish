"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/Field";

export function BillingButtons({ hasCustomer, active }: { hasCustomer: boolean; active: boolean }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const go = async (path: string) => {
    setBusy(true);
    setError(undefined);
    const res = await fetch(path, { method: "POST" });
    const json = await res.json().catch(() => ({}));
    if (res.ok && json.url) window.location.href = json.url;
    else { setError(json.error ?? "Something went wrong."); setBusy(false); }
  };
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {!active && <Button disabled={busy} onClick={() => go("/api/billing/checkout")}>Subscribe</Button>}
        {hasCustomer && <Button variant="secondary" disabled={busy} onClick={() => go("/api/billing/portal")}>Manage Subscription</Button>}
      </div>
      <FormError message={error} />
    </div>
  );
}
