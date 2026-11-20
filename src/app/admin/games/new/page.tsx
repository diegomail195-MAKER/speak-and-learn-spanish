import { TemplateGallery } from "@/components/editor/TemplateGallery";
import { TEMPLATES } from "@/lib/games/templates";

// Platform Admin › Create activity: the same template gallery as Teacher View, inside Platform Admin.
// The new activity is the admin's own (listed in both My Activities) and opens in /admin/games/…/edit.
export const metadata = { title: "Create Activity · Platform Admin" };

export default function AdminNewGame() {
  return <TemplateGallery templates={TEMPLATES} workspace="admin" />;
}
