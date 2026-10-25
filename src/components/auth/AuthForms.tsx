"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { FormError, Input, Label } from "@/components/ui/Field";
import { signInTeacher, signUpTeacher } from "@/lib/actions/auth";

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
        <Input id="password" name="password" type="password" autoComplete="current-password" required />
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
        <Input id="password" name="password" type="password" autoComplete="new-password" minLength={10} required />
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
