import { cn } from "@/lib/utils/cn";

type AvatarSize = "sm" | "md" | "lg";

export interface AvatarProps {
  name: string;
  src?: string;
  size?: AvatarSize;
  className?: string;
}

const sizes: Record<AvatarSize, { container: string; text: string }> = {
  sm: { container: "h-8 w-8", text: "text-xs" },
  md: { container: "h-10 w-10", text: "text-sm" },
  lg: { container: "h-14 w-14", text: "text-base" },
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function Avatar({ name, src, size = "md", className }: AvatarProps) {
  const { container, text } = sizes[size];

  return (
    <div
      className={cn(
        "relative inline-flex items-center justify-center",
        "rounded-full overflow-hidden shrink-0",
        "bg-surface-container-high",
        container,
        className,
      )}
      aria-label={name}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={name}
          className="h-full w-full object-cover"
        />
      ) : (
        <span
          className={cn(
            "font-body font-medium text-primary select-none",
            text,
          )}
        >
          {getInitials(name)}
        </span>
      )}
    </div>
  );
}
