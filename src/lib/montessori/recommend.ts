// Teacher recommendation from recorded learning evidence only. It names skills (words/phrases),
// never the child's personality, feelings or general ability, and uses no pronouns.
import { atLeast } from "./levels";
import type { ProgressLevel } from "./types";

export interface SkillSummary {
  label: string;
  level: ProgressLevel;
  attempts: number;
  lastActivity?: string;
}

const q = (s: string) => `“${s}”`;
const qs = (s: string) => `«${s}»`;

function joinEn(xs: string[]) {
  return xs.length <= 1 ? (xs[0] ?? "") : `${xs.slice(0, -1).join(", ")} and ${xs.at(-1)}`;
}
function joinEs(xs: string[]) {
  if (xs.length <= 1) return xs[0] ?? "";
  const last = xs.at(-1)!;
  // "y" becomes "e" before an /i/ sound (i-, hi-, but not hie-/hia-).
  const raw = last.replace(/^[«“"]/, "").toLowerCase();
  const conj = /^(i|í|hi|hí)/.test(raw) && !/^hi[aeoué]/.test(raw) ? "e" : "y";
  return `${xs.slice(0, -1).join(", ")} ${conj} ${last}`;
}

export function recommendation(name: string, skills: SkillSummary[], max = 4): { en: string; es: string; next?: string } | null {
  const practiced = skills.filter((s) => s.attempts > 0);
  if (!practiced.length) return null;
  const strong = practiced.filter((s) => atLeast(s.level, "PROFICIENT")).slice(0, max);
  const weak = practiced.filter((s) => !atLeast(s.level, "PROGRESSING")).slice(0, max);
  const middle = practiced.filter((s) => s.level === "PROGRESSING").slice(0, max);
  const en: string[] = [];
  const es: string[] = [];
  if (strong.length) {
    en.push(`${name} uses ${joinEn(strong.map((s) => q(s.label)))} independently.`);
    es.push(`${name} usa ${joinEs(strong.map((s) => qs(s.label)))} de manera independiente.`);
  }
  if (middle.length) {
    en.push(`${name} is remembering ${joinEn(middle.map((s) => q(s.label)))} with less help.`);
    es.push(`${name} recuerda ${joinEs(middle.map((s) => qs(s.label)))} con menos ayuda.`);
  }
  if (weak.length) {
    en.push(`${name} would benefit from additional practice with ${joinEn(weak.map((s) => q(s.label)))}.`);
    es.push(`A ${name} le ayudaría practicar más ${joinEs(weak.map((s) => qs(s.label)))}.`);
  }
  if (!weak.length && !middle.length && strong.length) {
    en.push(`${name} is ready for a new challenge with this content.`);
    es.push(`${name} puede pasar a un nuevo desafío con este contenido.`);
  }
  const next = (weak[0] ?? middle[0])?.lastActivity || undefined;
  return { en: en.join(" "), es: es.join(" "), next };
}
