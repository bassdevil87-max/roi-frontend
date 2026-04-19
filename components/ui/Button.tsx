"use client";

import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

type Size = "xs" | "s" | "m" | "l";
type Variant = "primary" | "secondary" | "ghost" | "dark";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  size?: Size;
  variant?: Variant;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  fullWidth?: boolean;
}

const sizeClasses: Record<Size, string> = {
  xs: "h-8 px-3 text-xs rounded-lg",
  s: "h-10 px-4 text-sm rounded-lg",
  m: "h-12 px-5 text-[15px] rounded-xl",
  l: "h-14 px-6 text-base rounded-xl",
};

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-signal text-white hover:bg-signal-dark active:scale-[0.98] " +
    "focus-visible:ring-2 focus-visible:ring-signal/40 focus-visible:ring-offset-2 " +
    "disabled:bg-paper-card disabled:text-ink-tertiary disabled:active:scale-100",
  secondary:
    "bg-paper-card text-ink hover:bg-paper-stroke active:scale-[0.98] " +
    "focus-visible:ring-2 focus-visible:ring-ink/20 " +
    "disabled:bg-paper-soft disabled:text-ink-tertiary",
  ghost:
    "bg-transparent text-ink hover:bg-paper-card active:scale-[0.98] " +
    "focus-visible:ring-2 focus-visible:ring-ink/10 " +
    "disabled:text-ink-tertiary",
  dark:
    "bg-ink text-white hover:bg-ink/90 active:scale-[0.98] " +
    "focus-visible:ring-2 focus-visible:ring-ink/30 focus-visible:ring-offset-2 " +
    "disabled:bg-paper-card disabled:text-ink-tertiary",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      size = "m",
      variant = "primary",
      iconLeft,
      iconRight,
      fullWidth = false,
      className,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2",
          "font-medium whitespace-nowrap",
          "transition-all duration-150",
          "focus:outline-none disabled:cursor-not-allowed",
          sizeClasses[size],
          variantClasses[variant],
          fullWidth && "w-full",
          className
        )}
        {...props}
      >
        {iconLeft}
        <span>{children}</span>
        {iconRight}
      </button>
    );
  }
);

Button.displayName = "Button";
