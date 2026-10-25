import { TemplateGallery } from "@/components/editor/TemplateGallery";
import { PageHeader } from "@/components/ui/Panel";
import { TEMPLATES } from "@/lib/games/templates";

export const metadata = { title: "Create Activity" };

export default function NewGame() {
  return (
    <>
      <PageHeader
        eyebrow="Create Activity"
        title="Choose an Activity Template"
        subtitle="Every template uses the same editor: pictures, spoken questions, answers and hints. You can change the content and options at any time."
      />
      <TemplateGallery templates={TEMPLATES} />
    </>
  );
}
