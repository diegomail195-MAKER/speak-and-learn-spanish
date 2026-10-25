import { AuthLayout } from "@/components/auth/AuthLayout";
import { TeacherSignInForm } from "@/components/auth/AuthForms";

export const metadata = { title: "Teacher sign in" };

export default function LoginPage() {
  return (
    <AuthLayout title="Teacher sign in" subtitle="Manage your classes, games and student progress.">
      <TeacherSignInForm />
    </AuthLayout>
  );
}
