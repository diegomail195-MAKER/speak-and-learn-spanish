"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { buttonClass } from "@/components/ui/Button";

// "Add Students" with its three options: one student, a pasted list, or a new group.
export function AddStudentsMenu({ classroomId }: { classroomId: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);
  const item = "block rounded-xl px-4 py-3 hover:bg-paper-2";
  return (
    <div ref={ref} className="relative">
      <button type="button" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)} className={buttonClass("secondary")}>
        Add Students ▾
      </button>
      {open && (
        <div role="menu" className="absolute right-0 z-30 mt-2 w-72 rounded-2xl border border-line bg-card p-2 shadow-pop">
          <Link role="menuitem" href={`/teacher/classes/${classroomId}/students/new`} className={item}>
            <span className="block font-bold">Add Student</span>
            <span className="text-sm text-muted">One student at a time.</span>
          </Link>
          <Link role="menuitem" href={`/teacher/classes/${classroomId}/students/list`} className={item}>
            <span className="block font-bold">Add List</span>
            <span className="text-sm text-muted">Paste a list, check it, then save.</span>
          </Link>
          <Link role="menuitem" href={`/teacher/classes/${classroomId}/groups/new`} className={item}>
            <span className="block font-bold">Create Group</span>
            <span className="text-sm text-muted">Name a group and pick students from the roster.</span>
          </Link>
        </div>
      )}
    </div>
  );
}
