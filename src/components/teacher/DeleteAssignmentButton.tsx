"use client";

import { useFormStatus } from "react-dom";
import { deleteAssignment } from "@/lib/actions/assignments";

function Submit({ title }: { title: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      data-testid="delete-assignment"
      aria-label={`Delete assignment: ${title}`}
      title="Delete assignment"
      className="grid size-11 place-items-center rounded-ctl border border-line bg-card text-muted hover:bg-coral-soft hover:text-coral-dark disabled:opacity-50"
    >
      {pending ? "…" : "🗑"}
    </button>
  );
}

/** Deletes one assignment after a confirmation (students stop seeing it; past answers are kept). */
export function DeleteAssignmentButton({ id, title }: { id: string; title: string }) {
  return (
    <form
      action={deleteAssignment}
      onSubmit={(e) => {
        if (!window.confirm(`Delete “${title}”? Students will no longer see it. Their past answers stay in their progress.\n\n¿Eliminar esta asignación? Los estudiantes ya no la verán.`)) e.preventDefault();
      }}
    >
      <input type="hidden" name="assignmentId" value={id} />
      <Submit title={title} />
    </form>
  );
}
