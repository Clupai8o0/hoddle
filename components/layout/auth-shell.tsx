import type { ReactNode } from "react";
import Image from "next/image";

interface AuthShellProps {
  children: ReactNode;
  /** Overrides the default editorial photo panel on desktop */
  photoPanelContent?: ReactNode;
  /** Quote text for the default photo panel */
  quote?: string;
  /** Attribution for the quote */
  quoteAttribution?: string;
}

const defaultQuote =
  '"Finding a mentor who had been through the same struggles changed everything for me."';
const defaultAttribution = "— Wei, University of Melbourne";

export function AuthShell({
  children,
  photoPanelContent,
  quote = defaultQuote,
  quoteAttribution = defaultAttribution,
}: AuthShellProps) {
  return (
    <div className="min-h-screen bg-surface flex">
      {/* ── Editorial photo panel (desktop only) ── */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col">
        {photoPanelContent ?? (
          <>
            <Image
              src="/images/auth-tram-portrait.webp"
              alt=""
              fill
              className="object-cover"
              priority
            />
            {/* Branded tint overlay — keeps quote legible over photography */}
            <div className="absolute inset-0 bg-[linear-gradient(135deg,color-mix(in_srgb,var(--color-primary)_45%,transparent)_0%,color-mix(in_srgb,var(--color-primary)_10%,transparent)_100%)]" />

            {/* Wordmark */}
            <div className="relative z-10 p-10">
              <span className="font-display font-bold text-xl text-on-primary tracking-tight">
                Hoddle
              </span>
            </div>

            {/* Quote card */}
            <div className="relative z-10 mt-auto p-10 pb-16">
              <blockquote className="text-on-primary/90 italic text-xl font-display font-light leading-relaxed">
                {quote}
              </blockquote>
              <p className="mt-4 text-on-primary/60 font-body text-sm uppercase tracking-[0.15em] not-italic">
                {quoteAttribution}
              </p>
            </div>
          </>
        )}
      </div>

      {/* ── Form panel ── */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Mobile wordmark */}
        <div className="lg:hidden px-8 pt-8">
          <span className="font-display font-bold text-xl text-primary tracking-tight">
            Hoddle
          </span>
        </div>

        <div className="flex-1 flex flex-col justify-center px-8 py-12 sm:px-12 lg:px-16 xl:px-24">
          {children}
        </div>
      </div>
    </div>
  );
}
