import { type HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

type TagVariant = "default" | "success" | "muted";

export interface TagProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: TagVariant;
}

const variants: Record<TagVariant, string> = {
  default: "bg-primary-container text-on-primary-container",
  success: "bg-secondary-container text-secondary",
  muted: "bg-surface-container-high text-on-surface-variant",
};

export function Tag({ variant = "default", className, children, ...props }: TagProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center",
        "px-3 py-1 rounded-full",
        "font-body text-xs font-medium uppercase tracking-[0.12em]",
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
