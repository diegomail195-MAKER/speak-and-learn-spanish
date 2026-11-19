import Link from "next/link";
import type { ComponentProps } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "voice";
type Size = "sm" | "md" | "lg";

/**
 * Shared button. Every size is at least 44px tall and grows when a long label wraps (min-height,
 * not a fixed height: a fixed h-10/h-11 let two-line labels spill out of the box). The icon and
 * the text sit on one center line (flex + items-center, 20px icons that never shrink).
 * States: hover darkens, active presses 1px, disabled fades, keyboard focus shows the global
 * 2px :focus-visible outline (no extra ring or shadow on top of the border).
 */
const base =
  "inline-flex max-w-full items-center justify-center gap-2 rounded-ctl text-center font-bold leading-tight transition-[background-color,border-color,color,box-shadow,transform] duration-150 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50 disabled:active:translate-y-0 select-none [&>svg]:size-5";
const variants: Record<Variant, string> = {
  primary: "bg-primary text-white shadow-sm hover:bg-primary-dark",
  secondary: "bg-card text-ink border border-line hover:border-line-strong hover:bg-paper-2",
  ghost: "text-ink-2 hover:bg-paper-2",
  danger: "bg-card text-coral-dark border border-coral/40 hover:bg-coral-soft",
  voice: "bg-teal text-white hover:bg-teal-dark",
};
const sizes: Record<Size, string> = {
  sm: "min-h-control px-4 py-2 text-sm",
  md: "min-h-control px-5 py-2 text-[15px]",
  lg: "min-h-control-lg px-6 py-2.5 text-base [&>svg]:size-6",
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
