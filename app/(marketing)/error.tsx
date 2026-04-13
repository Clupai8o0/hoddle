"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function MarketingError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Phase 2: log to error reporting service (e.g. Sentry)
    console.error(error);
  }, [error]);

  return (
    <main className="min-h-screen bg-surface flex flex-col items-center justify-center px-5">
      <div className="max-w-md w-full text-center">
        <Link
          href="/"
          className="font-display font-bold text-xl text-primary block mb-12"
        >
          Hoddle
        </Link>
        <span className="font-body text-xs font-medium uppercase tracking-[0.18em] text-on-surface-variant block mb-6">
          Something went wrong
        </span>
        <h1 className="font-display font-extrabold text-4xl text-primary leading-tight mb-4">
          This didn&apos;t load correctly.
        </h1>
        <p className="font-body text-base text-on-surface-variant leading-relaxed mb-10">
          Give it another try — it usually clears itself up.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={reset} variant="primary">
            <RefreshCw strokeWidth={1.5} className="mr-2 h-4 w-4" />
            Try again
          </Button>
          <Button asChild variant="secondary">
            <Link href="/">Back to home</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
