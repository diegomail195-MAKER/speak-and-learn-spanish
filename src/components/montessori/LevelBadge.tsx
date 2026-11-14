import { LEVEL_LABEL } from "@/lib/montessori/levels";
import type { ProgressLevel } from "@/lib/montessori/types";

const TONE: Record<ProgressLevel, string> = {
  EXPLORING: "bg-paper-2 text-ink-2",
  DEVELOPING: "bg-sun-soft text-[#8a5a00]",
  PROGRESSING: "bg-sky-soft text-sky",
  PROFICIENT: "bg-leaf-soft text-leaf",
  EXTENDING: "bg-teal-soft text-teal-dark",
};

export function LevelBadge({ level, teacherSet }: { level: ProgressLevel; teacherSet?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${TONE[level]}`} title={teacherSet ? "Set by the teacher" : "From recorded answers"}>
      {LEVEL_LABEL[level].en}
      {teacherSet && <span aria-label="set by the teacher">✎</span>}
    </span>
  );
}
