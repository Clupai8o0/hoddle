import { cn } from "@/lib/utils/cn";

export interface SectionDividerProps {
  size?: "md" | "lg";
  className?: string;
}

/** Semantic whitespace — not a visible rule. 48px (md) or 64px (lg). */
export function SectionDivider({ size = "md", className }: SectionDividerProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(size === "md" ? "h-12" : "h-16", className)}
    />
  );
}
