import { redirect } from "next/navigation";

export default async function PreviewRedirect({ params }: { params: Promise<{ id: string }> }) {
  redirect(`/play/preview/${(await params).id}`);
}
