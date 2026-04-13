import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="font-body text-sm font-medium text-on-surface tracking-[0.08em] uppercase"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={cn(
            // Base
            "w-full min-h-[120px] px-4 py-3",
            "font-body text-base text-on-surface",
            "bg-surface-container-low",
            "rounded-md",
            "resize-y",
            // No border by default
            "outline-none border-none ring-0",
            // Focus — warm gold
            "focus:ring-2 focus:ring-tertiary focus:ring-offset-0",
            // Placeholder
            "placeholder:text-on-surface-variant/60",
            // Error state
            error && "ring-2 ring-error",
            className,
          )}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={
            error
              ? `${inputId}-error`
              : hint
                ? `${inputId}-hint`
                : undefined
          }
          {...props}
        />
        {error && (
          <p
            id={`${inputId}-error`}
            className="font-body text-sm text-error mt-0.5"
            role="alert"
          >
            {error}
          </p>
        )}
        {hint && !error && (
          <p
            id={`${inputId}-hint`}
            className="font-body text-sm text-on-surface-variant mt-0.5"
          >
            {hint}
          </p>
        )}
      </div>
    );
  },
);
Textarea.displayName = "Textarea";
