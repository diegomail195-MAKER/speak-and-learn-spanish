import { AuthLayout } from "@/components/auth/AuthLayout";
import { ForgotPasswordForm } from "@/components/auth/AuthForms";

export const metadata = { title: "Forgot password" };

export default function ForgotPasswordPage() {
  return (
    <AuthLayout title="Forgot your password?" subtitle="Write your teacher email and we'll send you a link to choose a new one. · Escribe tu correo y te enviaremos un enlace.">
      <ForgotPasswordForm />
    </AuthLayout>
  );
}
