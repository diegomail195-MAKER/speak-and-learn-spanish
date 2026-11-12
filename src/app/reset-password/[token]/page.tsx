import Link from "next/link";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { ResetPasswordForm } from "@/components/auth/AuthForms";
import { resetTokenValid } from "@/lib/actions/auth";

export const metadata = { title: "Choose a new password", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function ResetPasswordPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const valid = await resetTokenValid(token);
  return (
    <AuthLayout title="Choose a new password" subtitle="Crea una contraseña nueva.">
      {valid ? (
        <ResetPasswordForm token={token} />
      ) : (
        <div className="space-y-4">
          <p role="alert" className="rounded-xl bg-coral-soft px-3.5 py-2.5 text-sm font-semibold text-coral-dark">
            This link expired or was already used. · Este enlace venció o ya se usó.
          </p>
          <Link href="/forgot-password" className="block text-center font-bold text-coral hover:underline">
            Get a new link · Pedir un enlace nuevo
          </Link>
        </div>
      )}
    </AuthLayout>
  );
}
