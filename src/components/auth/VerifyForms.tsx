"use client";

import Link from "next/link";
import { useActionState } from "react";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Button } from "@/components/ui/Button";
import { FormError, Input, Label } from "@/components/ui/Field";
import { acceptAdminInvite, confirmEmail } from "@/lib/actions/verify";

export function ConfirmEmailForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(confirmEmail, undefined);
  if (state?.ok) {
    return (
      <div className="space-y-4 text-center">
        <p role="status" className="rounded-xl bg-leaf-soft px-4 py-3 font-bold text-leaf">Your email is confirmed. Welcome to LextroSpeak!</p>
        <Link href="/teacher" className="inline-flex h-11 items-center rounded-full bg-coral px-6 font-bold text-white">Open my dashboard</Link>
      </div>
    );
  }
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      <FormError message={state?.error} />
      <Button disabled={pending} className="w-full">{pending ? "Confirming…" : "Confirm my email"}</Button>
    </form>
  );
}

export function AcceptInviteForm({ token, email }: { token: string; email: string }) {
  const [state, action, pending] = useActionState(acceptAdminInvite, undefined);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      <p className="text-sm">Email: <strong>{email}</strong></p>
      <div><Label htmlFor="displayName">Your name</Label><Input id="displayName" name="displayName" required maxLength={80} autoComplete="name" /></div>
      <div><Label htmlFor="schoolName">School or organization</Label><Input id="schoolName" name="schoolName" required maxLength={120} defaultValue="LextroSpeak" /></div>
      <div><Label htmlFor="password">Password</Label><PasswordInput id="password" name="password" required minLength={10} autoComplete="new-password" /></div>
      <div><Label htmlFor="confirm">Repeat the password</Label><PasswordInput id="confirm" name="confirm" required minLength={10} autoComplete="new-password" /></div>
      <FormError message={state?.error} />
      <Button disabled={pending} className="w-full">{pending ? "Setting up…" : "Set up my admin access"}</Button>
    </form>
  );
}
