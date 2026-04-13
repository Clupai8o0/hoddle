import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-surface flex flex-col items-center justify-center px-5">
      <div className="max-w-md w-full text-center">
        <span className="font-body text-xs font-medium uppercase tracking-[0.18em] text-on-surface-variant block mb-6">
          404
        </span>
        <h1 className="font-display font-extrabold text-5xl text-primary leading-tight mb-4">
          This page doesn&apos;t exist yet.
        </h1>
        <p className="font-body text-base text-on-surface-variant leading-relaxed mb-10">
          You may have followed a link that&apos;s moved, or the page is still
          being built. Either way, we&apos;ll get you back on track.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild variant="primary">
            <Link href="/">
              <ArrowLeft strokeWidth={1.5} className="mr-2 h-4 w-4" />
              Back to home
            </Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/dashboard">Go to dashboard</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
