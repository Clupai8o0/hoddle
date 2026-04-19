"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface StarRowDisplayProps {
  rating: number;
  size?: number;
  className?: string;
}

interface StarRowInputProps {
  value: number;
  onChange: (value: number) => void;
  size?: number;
  className?: string;
  id?: string;
}

/**
 * Read-only star display — Hoddle Blue filled + outline-variant empty.
 * Never uses yellow/gold (design system rule: no warm colours).
 */
export function StarRow({ rating, size = 16, className }: StarRowDisplayProps) {
  const clamped = Math.max(0, Math.min(5, Math.round(rating)));
  return (
    <div
      role="img"
      aria-label={`Rated ${clamped} out of 5`}
      className={cn("flex items-center gap-0.5", className)}
    >
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= clamped;
        return (
          <Star
            key={n}
            size={size}
            strokeWidth={1.5}
            aria-hidden="true"
            className={cn(filled ? "fill-primary text-primary" : "text-outline-variant")}
          />
        );
      })}
    </div>
  );
}

/**
 * Interactive star picker — radiogroup pattern, keyboard accessible.
 * Arrow keys move between stars, Space/Enter selects.
 */
export function StarRowInput({
  value,
  onChange,
  size = 24,
  className,
  id,
}: StarRowInputProps) {
  const clamped = Math.max(1, Math.min(5, Math.round(value)));

  return (
    <div
      role="radiogroup"
      aria-label="Rating"
      id={id}
      className={cn("flex items-center gap-1", className)}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight" || e.key === "ArrowUp") {
          e.preventDefault();
          onChange(Math.min(5, clamped + 1));
        } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
          e.preventDefault();
          onChange(Math.max(1, clamped - 1));
        }
      }}
    >
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= clamped;
        return (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={n === clamped}
            aria-label={`${n} star${n === 1 ? "" : "s"}`}
            tabIndex={n === clamped ? 0 : -1}
            onClick={() => onChange(n)}
            className={cn(
              "rounded-sm p-1 transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
            )}
          >
            <Star
              size={size}
              strokeWidth={1.5}
              aria-hidden="true"
              className={cn(filled ? "fill-primary text-primary" : "text-outline-variant")}
            />
          </button>
        );
      })}
    </div>
  );
}
