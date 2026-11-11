import { ToolCards } from "@/components/shell/ToolCards";
import { EmptyState, PageHeader } from "@/components/ui/Panel";
import { platformTools } from "@/lib/tools";

export const metadata = { title: "Tools" };

export default function ToolsPage() {
  const tools = platformTools();
  return (
    <div>
      <PageHeader title="Classroom tools" subtitle="Other apps that are part of the Speak & Learn platform. They open in a new tab." />
      {tools.length ? (
        <ToolCards tools={tools} />
      ) : (
        <EmptyState title="No tools connected yet" body="Set ROLL_CALL_ROCKET_URL in the server settings to show Roll Call Rocket here." />
      )}
    </div>
  );
}
