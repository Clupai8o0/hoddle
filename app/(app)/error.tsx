"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RefreshCw, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function AppError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Phase 2: log to error reporting service (e.g. Sentry)
    console.error(error);
  }, [error]);

  return (
    <main className="min-h-screen bg-surface flex flex-col items-center justify-center px-5">
      <div className="max-w-md w-full text-center">
        <span className="font-body text-xs font-medium uppercase tracking-[0.18em] text-on-surface-variant block mb-6">
          Something went wrong
        </span>
        <h1 className="font-display font-extrabold text-4xl text-primary leading-tight mb-4">
          We couldn&apos;t load this page.
        </h1>
        <p className="font-body text-base text-on-surface-variant leading-relaxed mb-10">
          This is almost certainly temporary. Try again, or head back to your
          dashboard.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={reset} variant="primary">
            <RefreshCw strokeWidth={1.5} className="mr-2 h-4 w-4" />
            Try again
          </Button>
          <Button asChild variant="secondary">
            <Link href="/dashboard">
              <ArrowLeft strokeWidth={1.5} className="mr-2 h-4 w-4" />
              Dashboard
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
