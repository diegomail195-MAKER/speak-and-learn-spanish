import { TemplateGallery } from "@/components/editor/TemplateGallery";
import { TEMPLATES } from "@/lib/games/templates";

export const metadata = { title: "Create Activity" };

export default function NewGame() {
  return <TemplateGallery templates={TEMPLATES} />;
}
