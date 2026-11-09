import Link from "next/link";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export type ButtonVariant =
  | "primary"
  | "accent"
  | "secondary"
  | "quiet"
  | "destructive";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-primary-fg hover:bg-primary-hover disabled:bg-slate-400",
  accent: "bg-accent text-accent-fg hover:brightness-95 disabled:opacity-60",
  secondary:
    "bg-surface text-primary border border-primary hover:bg-info-bg disabled:text-slate-400 disabled:border-slate-400",
  quiet:
    "bg-transparent text-primary underline underline-offset-4 hover:text-primary-hover disabled:text-slate-400",
  destructive:
    "bg-danger text-white hover:bg-danger-fg disabled:bg-slate-400",
};

const base =
  "btn inline-flex min-h-12 items-center justify-center gap-2 rounded-control px-5 text-base font-bold whitespace-nowrap transition-colors disabled:cursor-not-allowed";

export function Button({
  variant = "primary",
  className,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return (
    <button
      type={type}
      data-variant={variant}
      className={cn(base, variants[variant], className)}
      {...props}
    />
  );
}

export function ButtonLink({
  href,
  variant = "primary",
  className,
  children,
  ...props
}: React.ComponentProps<typeof Link> & { variant?: ButtonVariant }) {
  return (
    <Link
      href={href}
      data-variant={variant}
      className={cn(base, variants[variant], className)}
      {...props}
    >
      {children}
    </Link>
  );
}
