import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "whatsapp";
export type ButtonSize = "sm" | "md" | "lg";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-gold-500 text-maroon-900 hover:bg-gold-400",
  secondary: "bg-saffron-500 text-maroon-900 hover:bg-saffron-400",
  outline: "border border-maroon-800/30 text-maroon-800 hover:bg-maroon-800/5",
  ghost: "text-maroon-800 hover:bg-maroon-800/5",
  whatsapp: "bg-[#35B664] text-white hover:bg-[#2E9E57]",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-6 text-sm",
  lg: "h-12 px-8 text-base",
};

export function buttonClasses(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  className?: string,
) {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-full font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saffron-400 focus-visible:ring-offset-2 focus-visible:ring-offset-cream-50",
    variants[variant],
    sizes[size],
    className,
  );
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ButtonProps) {
  return <button className={buttonClasses(variant, size, className)} {...props} />;
}
