import { AlphabetExplorer } from "@/components/alphabet/AlphabetExplorer";
import { sttLocale, sttProvider } from "@/lib/stt";

export const metadata = { title: "El abecedario" };

export default function StudentAlphabet() {
  const config = { sttProvider: sttProvider(), sttLocale: sttLocale("es-419"), sttLocales: { "es-419": sttLocale("es-419"), "en-US": sttLocale("en-US"), "fr-FR": sttLocale("fr-FR") } };
  return (
    <>
      <h1 className="mb-1 font-display text-4xl font-semibold">El abecedario</h1>
      <p className="mb-6 text-ink-2">Escucha cada letra y repítela.</p>
      <AlphabetExplorer config={config} audience="student" />
    </>
  );
}
