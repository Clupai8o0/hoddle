import { cn } from "@/lib/utils/cn";

export interface ProgressPillProps {
  value: number; // 0–100
  label?: string;
  className?: string;
}

export function ProgressPill({ value, label, className }: ProgressPillProps) {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div className={cn("flex flex-col gap-1.5 w-full", className)}>
      {label && (
        <div className="flex items-center justify-between">
          <span className="font-body text-sm text-on-surface-variant">
            {label}
          </span>
          <span className="font-body text-sm font-medium text-secondary">
            {clamped}%
          </span>
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ?? "Progress"}
        className="w-full h-[11px] bg-secondary-container rounded-full overflow-hidden"
      >
        <div
          className="h-full bg-secondary rounded-full transition-all duration-500 ease-out"
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
