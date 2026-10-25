import { PageHeader } from "@/components/ui/Panel";
import { createGame } from "@/lib/actions/games";
import { TEMPLATES } from "@/lib/games/templates";

export const metadata = { title: "Create game" };

export default function NewGame() {
  const ready = TEMPLATES.filter((t) => t.available);
  const later = TEMPLATES.filter((t) => !t.available);
  return (
    <>
      <PageHeader eyebrow="Create Game" title="Choose a template" subtitle="Every template is answered by voice. You can change the content at any time." />
      <form action={createGame}>
        <ul className="divide-y divide-line overflow-hidden rounded-xl2 border border-line bg-card">
          {ready.map((t) => (
            <li key={t.key}>
              <button name="templateKey" value={t.key} className="flex w-full items-center gap-4 px-5 py-4 text-left hover:bg-paper">
                <TemplateGlyph k={t.key} />
                <span className="flex-1">
                  <span className="block font-display text-lg font-semibold">
                    {t.name} <span className="font-sans text-sm font-semibold text-muted">· {t.nameEs}</span>
                  </span>
                  <span className="text-sm text-muted">{t.description}</span>
                </span>
                <span className="font-bold text-coral">Use →</span>
              </button>
            </li>
          ))}
        </ul>
      </form>
      <p className="mt-6 text-sm text-muted">
        In development (next phases, not selectable yet): {later.map((t) => t.name).join(", ")}.
      </p>
    </>
  );
}

function TemplateGlyph({ k }: { k: string }) {
  const map: Record<string, [string, string]> = {
    SPEAK_AND_ANSWER: ["#fde6df", "?"],
    LISTEN_AND_SPEAK: ["#dcf1ee", "≋"],
    IMAGE_AND_VOCABULARY: ["#fdf0d3", "◧"],
    QUESTION_AND_ANSWER: ["#e1ebf8", "⇄"],
    SPELL_YOUR_NAME: ["#dff2e5", "A·b"],
  };
  const [bg, s] = map[k] ?? ["#f3ede1", "•"];
  return (
    <span aria-hidden="true" className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl font-display text-lg font-semibold text-ink" style={{ background: bg }}>
      {s}
    </span>
  );
}
