import { AuthLayout } from "@/components/auth/AuthLayout";
import Link from "next/link";
import { TeacherSignUpForm } from "@/components/auth/AuthForms";
import { getSettings } from "@/lib/settings";

export const metadata = { title: "Create a teacher account" };

export const dynamic = "force-dynamic";

export default async function SignupPage() {
  if (!(await getSettings()).signupOpen) {
    return (
      <AuthLayout title="Sign-up is closed" subtitle="New teacher accounts are created by invitation.">
        <p className="text-ink-2" data-testid="signup-closed">Ask your school&apos;s administrator to invite you. Already have an account? <Link href="/login" className="font-bold text-coral hover:underline">Sign in</Link></p>
      </AuthLayout>
    );
  }
  return (
    <AuthLayout title="Create a teacher account" subtitle="Your school gets its own private space. Student data is never shared between schools.">
      <TeacherSignUpForm />
    </AuthLayout>
  );
}
