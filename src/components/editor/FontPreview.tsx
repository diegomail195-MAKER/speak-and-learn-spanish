/** A sample of the activity's practice font: Ñ/ñ, accented vowels, ü and ¿¡ included. */
export const FONT_SAMPLE = "¡Hola! ¿Cómo estás? Ñandú, niño, mañana, árbol, café, búho, ratón, pingüino";

export function FontPreview({ font }: { font: string }) {
  return (
    <p data-testid="font-preview" data-practice-font={font} className="rounded-xl border border-line bg-paper px-4 py-3 text-ink">
      <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-muted">Preview</span>
      <span className="font-display text-2xl">{FONT_SAMPLE}</span>
    </p>
  );
}
