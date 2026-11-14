import { MontessoriSettingsForm } from "@/components/montessori/MontessoriSettingsForm";
import { PageHeader } from "@/components/ui/Panel";
import { requireAdminPage } from "@/lib/auth/guards";
import { getMontessoriConfig } from "@/lib/montessori/server";
import { ttsProvider, voicesFor } from "@/lib/tts";

export const metadata = { title: "Settings → Montessori Feedback" };

export default async function MontessoriSettingsPage() {
  await requireAdminPage();
  const config = await getMontessoriConfig();
  const provider = ttsProvider();
  const voices = voicesFor(provider).filter((v) => v.language === "en-US" || v.language === "es-419").map((v) => ({ id: v.id, label: v.label, lang: v.language === "en-US" ? ("en" as const) : ("es" as const) }));
  return (
    <>
      <PageHeader eyebrow="Settings" title="Montessori Feedback" subtitle="How LextroSpeak describes students' work in every activity: languages, voices, messages, when each message appears and how progress levels are decided." />
      <MontessoriSettingsForm initial={config} voices={voices} ttsConfigured={!!provider} />
    </>
  );
}
