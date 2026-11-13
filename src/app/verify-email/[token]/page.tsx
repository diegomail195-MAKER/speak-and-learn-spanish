import { AuthLayout } from "@/components/auth/AuthLayout";
import { ConfirmEmailForm } from "@/components/auth/VerifyForms";

export const metadata = { title: "Confirm your email", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function VerifyEmailPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return (
    <AuthLayout title="Confirm your email" subtitle="One tap and your LaxtroSpeak account is ready.">
      <ConfirmEmailForm token={token} />
    </AuthLayout>
  );
}
