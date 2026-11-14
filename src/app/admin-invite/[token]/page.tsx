import Link from "next/link";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AcceptInviteForm } from "@/components/auth/VerifyForms";
import { inviteValid } from "@/lib/actions/verify";

export const metadata = { title: "Administrator invitation", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function AdminInvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const inv = await inviteValid(token);
  return (
    <AuthLayout title="Set up your admin access" subtitle="You were invited to administer LextroSpeak.">
      {inv ? (
        <AcceptInviteForm token={token} email={inv.email} />
      ) : (
        <div className="space-y-4">
          <p role="alert" className="rounded-xl bg-coral-soft px-3.5 py-2.5 text-sm font-semibold text-coral-dark">This invitation expired, was already used, or the account already exists.</p>
          <Link href="/login" className="block text-center font-bold text-coral hover:underline">Sign in</Link>
        </div>
      )}
    </AuthLayout>
  );
}
