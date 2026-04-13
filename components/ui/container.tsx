import { type HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * "editorial" applies asymmetric padding (more right than left) for a
   * magazine-like composition. "balanced" centres content symmetrically.
   */
  layout?: "editorial" | "balanced";
}

export function Container({
  layout = "editorial",
  className,
  children,
  ...props
}: ContainerProps) {
  return (
    <div
      className={cn(
        "w-full mx-auto max-w-[1280px]",
        layout === "editorial"
          ? // Asymmetric: intentionally more breathing room on the right
            "px-5 sm:pl-10 sm:pr-14 lg:pl-16 lg:pr-24 xl:pl-20 xl:pr-32"
          : // Balanced: symmetric horizontal padding
            "px-5 sm:px-10 lg:px-16 xl:px-20",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
