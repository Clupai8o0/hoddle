"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface GlassNavProps {
  /** Left slot — wordmark or logo */
  brand?: ReactNode;
  /** Centre/right slot — nav links */
  links?: ReactNode;
  /** Right slot — CTA or user menu */
  actions?: ReactNode;
  /**
   * Additional actions to show only inside the mobile menu panel, below the
   * links. For example, a sign-out form or a user identity block that would
   * be too wide for the mobile top bar.
   */
  mobileMenuFooter?: ReactNode;
  className?: string;
}

/**
 * Top navigation using the Hoddle glass recipe:
 * surface at 70% opacity + backdrop-blur-xl.
 * Warm photography bleeds through the cool-blue nav — the brand's
 * signature tension.
 *
 * Below `md` (768px) the horizontal link row collapses into a hamburger
 * button that toggles a full-width dropdown panel. The `actions` slot keeps
 * a compact presence in the top bar; `mobileMenuFooter` provides space for
 * extra controls that only make sense once the menu is expanded.
 */
export function GlassNav({
  brand,
  links,
  actions,
  mobileMenuFooter,
  className,
}: GlassNavProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close menu on Escape
  useEffect(() => {
    if (!mobileOpen) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setMobileOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  // Prevent body scroll while the mobile panel is open
  useEffect(() => {
    if (!mobileOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [mobileOpen]);

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
        className="mx-auto max-w-[1280px] px-4 sm:px-10 lg:px-16"
        aria-label="Main navigation"
      >
        <div className="flex h-16 items-center justify-between gap-3 sm:gap-6">
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
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {actions}
            </div>
          )}

          {/* Mobile menu toggle */}
          {links && (
            <button
              type="button"
              className="md:hidden flex items-center justify-center w-9 h-9 -mr-1 rounded-sm text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary"
              aria-expanded={mobileOpen}
              aria-controls="mobile-nav-panel"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              onClick={() => setMobileOpen((open) => !open)}
            >
              {mobileOpen ? (
                <X size={20} strokeWidth={1.5} />
              ) : (
                <Menu size={20} strokeWidth={1.5} />
              )}
            </button>
          )}
        </div>

        {/* Mobile dropdown panel */}
        {links && mobileOpen && (
          <div
            id="mobile-nav-panel"
            className="md:hidden absolute inset-x-0 top-16 max-h-[calc(100vh-4rem)] overflow-y-auto bg-surface/95 backdrop-blur-xl border-b border-outline-variant shadow-ambient"
          >
            <div
              className="flex flex-col gap-1 px-4 py-4"
              onClick={(event) => {
                const target = event.target as HTMLElement;
                if (target.closest("a")) {
                  setMobileOpen(false);
                }
              }}
            >
              {links}
            </div>
            {mobileMenuFooter && (
              <div className="px-4 py-4 border-t border-outline-variant">
                {mobileMenuFooter}
              </div>
            )}
          </div>
        )}
      </nav>
    </header>
  );
}

/**
 * Individual nav link with Hoddle active state:
 * primary colour text + 2px underline in primary, no background fill.
 *
 * Renders as a full-width row inside the mobile dropdown (wider tap target)
 * and as an inline underline link on desktop.
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
        "relative font-body text-sm font-medium transition-colors duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary rounded-sm",
        // Mobile: block row with generous tap target
        "block px-3 py-3",
        // Desktop: inline with the underlined active state
        "md:inline-block md:py-1.5",
        active
          ? "text-primary md:after:absolute md:after:bottom-0 md:after:left-3 md:after:right-3 md:after:h-0.5 md:after:bg-primary md:after:rounded-full"
          : "text-on-surface-variant hover:text-on-surface",
        className,
      )}
      aria-current={active ? "page" : undefined}
    >
      {children}
    </a>
  );
}
