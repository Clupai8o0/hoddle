"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail } from "lucide-react";
import { AuthShell } from "@/components/layout/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { sendMagicLink } from "@/lib/actions/auth";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  function validateEmail(value: string) {
    if (!value) return "Email is required.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
      return "Enter a valid email address.";
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const error = validateEmail(email);
    if (error) {
      setEmailError(error);
      return;
    }
    setEmailError(null);
    setServerError(null);
    setIsPending(true);

    const result = await sendMagicLink(email);

    setIsPending(false);
    if (!result.ok) {
      setServerError(result.error);
      return;
    }
    setSent(true);
  }

  return (
    <AuthShell
      quote='"Melbourne is big, but Hoddle made it feel like someone had my back from day one."'
      quoteAttribution="— Linh, RMIT University"
    >
      {sent ? (
        <div className="max-w-md">
          <div className="w-12 h-12 rounded-full bg-secondary-container flex items-center justify-center mb-8">
            <Mail
              size={20}
              strokeWidth={1.5}
              className="text-secondary"
              aria-hidden="true"
            />
          </div>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-primary mb-3">
            Check your inbox.
          </h1>
          <p className="font-body text-on-surface-variant text-base sm:text-lg leading-relaxed">
            We sent a secure link to{" "}
            <span className="text-on-surface font-medium">{email}</span>. Click
            it to finish creating your account.
          </p>
          <p className="mt-6 font-body text-sm text-on-surface-variant">
            Can&apos;t find it? Check your spam folder, or{" "}
            <button
              onClick={() => {
                setSent(false);
                setServerError(null);
              }}
              className="text-primary underline underline-offset-2 hover:text-primary/80 transition-colors"
            >
              try a different email
            </button>
            .
          </p>
        </div>
      ) : (
        <div className="max-w-md w-full">
          <h1 className="font-display font-bold text-3xl sm:text-4xl text-primary mb-2">
            Your Melbourne story starts here.
          </h1>
          <p className="font-body text-on-surface-variant text-base sm:text-lg mb-8 sm:mb-10 leading-relaxed">
            Connect with mentors who&apos;ve walked the same path — the same
            trams, laneways, and lecture halls.
          </p>

          <form onSubmit={handleSubmit} noValidate className="space-y-6">
            <Input
              type="email"
              label="Email address"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailError) setEmailError(null);
              }}
              error={emailError ?? undefined}
              autoComplete="email"
              autoFocus
            />

            {serverError && (
              <p className="font-body text-sm text-error" role="alert">
                {serverError}
              </p>
            )}

            <Button
              type="submit"
              variant="hero"
              size="lg"
              className="w-full"
              disabled={isPending}
            >
              {isPending ? "Sending…" : "Get started"}
            </Button>
          </form>

          <p className="mt-3 font-body text-xs text-on-surface-variant leading-relaxed">
            By continuing, you agree to Hoddle&apos;s{" "}
            <Link
              href="/terms"
              className="underline underline-offset-2 hover:text-on-surface transition-colors"
            >
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link
              href="/privacy"
              className="underline underline-offset-2 hover:text-on-surface transition-colors"
            >
              Privacy Policy
            </Link>
            .
          </p>

          <p className="mt-8 font-body text-sm text-on-surface-variant">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-primary underline underline-offset-2 hover:text-primary/80 transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      )}
    </AuthShell>
  );
}
