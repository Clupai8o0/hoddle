"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils/cn";

type Variant = "primary" | "secondary" | "hero" | "ghost";
type Size = "sm" | "default" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  /** Render as a child element (e.g. next/link) using Radix Slot */
  asChild?: boolean;
}

const variants: Record<Variant, string> = {
  primary: [
    "bg-primary text-on-primary",
    "hover:bg-primary-dark hover:shadow-ambient hover:-translate-y-px",
  ].join(" "),
  secondary: [
    "bg-surface-container-highest text-on-surface",
    "hover:bg-surface-container-high hover:shadow-ambient hover:-translate-y-px",
  ].join(" "),
  hero: [
    "bg-[linear-gradient(135deg,var(--color-primary)_0%,var(--color-primary-elevated)_100%)] text-on-primary",
    "hover:shadow-ambient hover:-translate-y-px",
  ].join(" "),
  ghost: [
    "bg-transparent text-primary",
    "hover:bg-primary-container",
  ].join(" "),
};

const sizes: Record<Size, string> = {
  sm: "min-h-[40px] px-4 py-2 text-sm",
  default: "min-h-[48px] px-6 py-3 text-base",
  lg: "min-h-[56px] px-8 py-4 text-lg",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "default",
      asChild = false,
      className,
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        disabled={!asChild ? disabled : undefined}
        className={cn(
          // Base
          "inline-flex items-center justify-center gap-2",
          "font-body font-medium tracking-wide",
          "rounded-md transition-all duration-200",
          "cursor-pointer select-none",
          // Focus
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
          // Variant
          variants[variant],
          // Size
          sizes[size],
          // Disabled
          disabled && "opacity-50 cursor-not-allowed pointer-events-none",
          className,
        )}
        {...props}
      >
        {children}
      </Comp>
    );
  },
);
Button.displayName = "Button";
