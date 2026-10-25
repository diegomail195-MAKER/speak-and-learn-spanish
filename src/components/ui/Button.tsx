import Link from "next/link";
import type { ComponentProps } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "voice";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-bold transition-[background,box-shadow,transform] active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50 select-none";
const variants: Record<Variant, string> = {
  primary: "bg-coral text-white shadow-[0_2px_0_var(--color-coral-dark)] hover:bg-coral-dark",
  secondary: "bg-card text-ink ring-1 ring-line hover:ring-ink-2/40",
  ghost: "text-ink-2 hover:bg-paper-2",
  danger: "bg-card text-coral-dark ring-1 ring-coral/40 hover:bg-coral-soft",
  voice: "bg-teal text-white shadow-[0_2px_0_var(--color-teal-dark)] hover:bg-teal-dark",
};
const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-5 text-[0.95rem]",
  lg: "h-14 px-7 text-lg",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", extra = "") {
  return `${base} ${variants[variant]} ${sizes[size]} ${extra}`;
}

export function Button({ variant = "primary", size = "md", className = "", ...props }: ComponentProps<"button"> & { variant?: Variant; size?: Size }) {
  return <button className={buttonClass(variant, size, className)} {...props} />;
}

export function ButtonLink({ variant = "primary", size = "md", className = "", ...props }: ComponentProps<typeof Link> & { variant?: Variant; size?: Size }) {
  return <Link className={buttonClass(variant, size, className)} {...props} />;
}
