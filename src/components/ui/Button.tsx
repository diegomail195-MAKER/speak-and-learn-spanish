import Link from "next/link";
import type { ComponentProps } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "voice";
type Size = "sm" | "md" | "lg";

/*
 * "Printed" buttons: firm 10px corners, a 2px ink outline and a small offset shadow, like a card
 * cut out and laid on paper. Pressing pushes the button into its shadow (.press in globals.css),
 * which gives touch feedback without bouncing. Ghost buttons stay flat for low-priority actions.
 */
const base =
  "press inline-flex items-center justify-center gap-2 rounded-xl font-bold leading-none select-none disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none";
const printed = "border-2 border-ink shadow-[2px_2px_0_var(--color-ink)] hover:shadow-[3px_3px_0_var(--color-ink)] hover:-translate-x-px hover:-translate-y-px disabled:hover:translate-x-0 disabled:hover:translate-y-0";
const variants: Record<Variant, string> = {
  primary: `${printed} bg-indigo text-white hover:bg-indigo-dark`,
  secondary: `${printed} bg-card text-ink hover:bg-paper`,
  ghost: "border-2 border-transparent text-ink-2 hover:bg-paper-2 hover:text-ink",
  danger: "border-2 border-coral/50 bg-card text-coral-dark hover:border-coral hover:bg-coral-soft",
  voice: `${printed} bg-teal text-white hover:bg-teal-dark`,
};
const sizes: Record<Size, string> = {
  sm: "min-h-9 px-3.5 text-sm",
  md: "min-h-11 px-5 text-[0.95rem]",
  lg: "min-h-13 px-6 text-lg",
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
