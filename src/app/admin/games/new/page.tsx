import { TemplateGallery } from "@/components/editor/TemplateGallery";
import { PageHeader } from "@/components/ui/Panel";
import { TEMPLATES } from "@/lib/games/templates";

// Platform Admin › Create activity: the same template gallery as Teacher View, inside Platform Admin.
// The new activity is the admin's own (listed in both My Activities) and opens in /admin/games/…/edit.
export const metadata = { title: "Create Activity · Platform Admin" };

export default function AdminNewGame() {
  return (
    <>
      <PageHeader
        eyebrow="Create Activity"
        title="Choose an Activity Template"
        subtitle="Every template uses the same editor: pictures, spoken questions, answers and hints. You can change the content and options at any time."
      />
      <TemplateGallery templates={TEMPLATES} workspace="admin" />
    </>
  );
}
