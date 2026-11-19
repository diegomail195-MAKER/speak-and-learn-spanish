"use client";

import type { SelectHTMLAttributes } from "react";

/** A select that submits its form as soon as the choice changes (no Apply button). */
export function AutoSubmitSelect(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} onChange={(e) => e.currentTarget.form?.requestSubmit()} />;
}
