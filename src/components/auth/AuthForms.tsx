"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { FormError, Input, Label } from "@/components/ui/Field";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { requestPasswordReset, resetPassword, signInTeacher, signUpTeacher } from "@/lib/actions/auth";

export function TeacherSignInForm() {
  const [state, action, pending] = useActionState(signInTeacher, undefined);
  return (
    <form action={action} className="space-y-4">
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <div>
        <Label htmlFor="password">Password</Label>
        <PasswordInput id="password" name="password" autoComplete="current-password" required />
        <p className="mt-1.5 text-right text-sm">
          <Link href="/forgot-password" className="font-bold text-coral hover:underline">
            Forgot your password? · ¿Olvidaste tu contraseña?
          </Link>
        </p>
      </div>
      <FormError message={state?.error} />
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </Button>
      <p className="text-center text-sm text-muted">
        New here?{" "}
        <Link href="/signup" className="font-bold text-coral hover:underline">
          Create a teacher account
        </Link>
      </p>
    </form>
  );
}

export function TeacherSignUpForm() {
  const [state, action, pending] = useActionState(signUpTeacher, undefined);
  return (
    <form action={action} className="space-y-4">
      <div>
        <Label htmlFor="displayName">Your name</Label>
        <Input id="displayName" name="displayName" autoComplete="name" required />
      </div>
      <div>
        <Label htmlFor="schoolName">School</Label>
        <Input id="schoolName" name="schoolName" required />
      </div>
      <div>
        <Label htmlFor="email">School email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <div>
        <Label htmlFor="password" hint="at least 10 characters">Password</Label>
        <PasswordInput id="password" name="password" autoComplete="new-password" minLength={10} required />
      </div>
      <FormError message={state?.error} />
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Creating account…" : "Create account"}
      </Button>
      <p className="text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-bold text-coral hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}

function Notice({ children }: { children: React.ReactNode }) {
  return (
    <p role="status" className="rounded-xl bg-teal-soft px-3.5 py-2.5 text-sm font-semibold text-teal-dark">
      {children}
    </p>
  );
}

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(requestPasswordReset, undefined);
  if (state?.ok) {
    return (
      <div className="space-y-4">
        <Notice>
          If an account exists for that email, we sent a link to choose a new password. It works once and expires in 30 minutes. Check your spam folder too.
          <span className="mt-2 block">Si existe una cuenta con ese correo, te enviamos un enlace para crear una contraseña nueva. Funciona una vez y vence en 30 minutos. Revisa también la carpeta de spam.</span>
        </Notice>
        <p className="text-center text-sm">
          <Link href="/login" className="font-bold text-coral hover:underline">Back to sign in · Volver</Link>
        </p>
      </div>
    );
  }
  return (
    <form action={action} className="space-y-4">
      <div>
        <Label htmlFor="email">Email · Correo</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <FormError message={state?.error} />
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Sending…" : "Send reset link · Enviar enlace"}
      </Button>
      <p className="text-center text-sm">
        <Link href="/login" className="font-bold text-coral hover:underline">Back to sign in · Volver</Link>
      </p>
    </form>
  );
}

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(resetPassword, undefined);
  if (state?.ok) {
    return (
      <div className="space-y-4">
        <Notice>
          Your password was changed and you were signed out on every device.
          <span className="mt-2 block">Tu contraseña se cambió y se cerró la sesión en todos los dispositivos.</span>
        </Notice>
        <Link href="/login" className="block text-center font-bold text-coral hover:underline">Sign in · Iniciar sesión</Link>
      </div>
    );
  }
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      <div>
        <Label htmlFor="password" hint="at least 10 characters · mínimo 10">New password · Contraseña nueva</Label>
        <PasswordInput id="password" name="password" autoComplete="new-password" minLength={10} required />
      </div>
      <div>
        <Label htmlFor="confirm">Repeat it · Repítela</Label>
        <PasswordInput id="confirm" name="confirm" autoComplete="new-password" minLength={10} required />
      </div>
      <FormError message={state?.error} />
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Saving…" : "Save new password · Guardar"}
      </Button>
    </form>
  );
}
