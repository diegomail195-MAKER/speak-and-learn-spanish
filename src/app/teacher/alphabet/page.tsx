import { AlphabetExplorer } from "@/components/alphabet/AlphabetExplorer";
import { PageHeader } from "@/components/ui/Panel";
import { requireTeacherPage } from "@/lib/auth/guards";
import { sttLocale, sttProvider } from "@/lib/stt";

export const metadata = { title: "Spanish alphabet" };

export default async function TeacherAlphabet() {
  await requireTeacherPage();
  const config = { sttProvider: sttProvider(), sttLocale: sttLocale("es-419"), sttLocales: { "es-419": sttLocale("es-419"), "en-US": sttLocale("en-US"), "fr-FR": sttLocale("fr-FR") } };
  return (
    <>
      <PageHeader eyebrow="Library" title="El abecedario" subtitle="The 27 letters of the Spanish alphabet with their names, regional variants and example words." />
      <AlphabetExplorer config={config} audience="teacher" />
    </>
  );
}
