import { AuthLayout } from "@/components/auth/AuthLayout";
import { TeacherSignUpForm } from "@/components/auth/AuthForms";

export const metadata = { title: "Create a teacher account" };

export default function SignupPage() {
  return (
    <AuthLayout title="Create a teacher account" subtitle="Your school gets its own private space. Student data is never shared between schools.">
      <TeacherSignUpForm />
    </AuthLayout>
  );
}
