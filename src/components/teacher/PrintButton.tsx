"use client";

import { Button } from "@/components/ui/Button";

// Uses the browser's print dialog ("Save as PDF"). A server-generated PDF report is planned for Phase 5.
export function PrintButton({ label = "Print / Save as PDF" }: { label?: string }) {
  return (
    <Button variant="secondary" onClick={() => window.print()}>
      {label}
    </Button>
  );
}
