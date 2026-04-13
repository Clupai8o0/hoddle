import { type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export interface GlassNavProps {
  /** Left slot — wordmark or logo */
  brand?: ReactNode;
  /** Centre/right slot — nav links */
  links?: ReactNode;
  /** Right slot — CTA or user menu */
  actions?: ReactNode;
  className?: string;
}

/**
 * Top navigation using the Hoddle glass recipe:
 * surface at 70% opacity + backdrop-blur-xl.
 * Warm photography bleeds through the cool-blue nav — the brand's
 * signature tension.
 */
export function GlassNav({ brand, links, actions, className }: GlassNavProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full",
        // Glass recipe from design.md §2
        "bg-surface/70 backdrop-blur-xl",
        // Subtle bottom separator — tonal, never a hard line
        "border-b border-outline-variant",
        className,
      )}
    >
      <nav
        className="mx-auto max-w-[1280px] px-5 sm:px-10 lg:px-16"
        aria-label="Main navigation"
      >
        <div className="flex h-16 items-center justify-between gap-6">
          {/* Brand / wordmark */}
          {brand && <div className="shrink-0">{brand}</div>}

          {/* Nav links — active state handled by consuming component */}
          {links && (
            <div className="hidden md:flex items-center gap-1 flex-1 justify-center">
              {links}
            </div>
          )}

          {/* Actions */}
          {actions && (
            <div className="flex items-center gap-3 shrink-0">{actions}</div>
          )}
        </div>
      </nav>
    </header>
  );
}

/**
 * Individual nav link with Hoddle active state:
 * primary colour text + 2px underline in primary, no background fill.
 */
export interface NavLinkProps {
  href: string;
  active?: boolean;
  children: ReactNode;
  className?: string;
}

export function NavLink({ href, active = false, children, className }: NavLinkProps) {
  return (
    <a
      href={href}
      className={cn(
        "relative px-3 py-1.5",
        "font-body text-sm font-medium",
        "transition-colors duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary rounded-sm",
        active
          ? "text-primary after:absolute after:bottom-0 after:left-3 after:right-3 after:h-0.5 after:bg-primary after:rounded-full"
          : "text-on-surface-variant hover:text-on-surface",
        className,
      )}
      aria-current={active ? "page" : undefined}
    >
      {children}
    </a>
  );
}
