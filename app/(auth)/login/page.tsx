"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Mail } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthShell } from "@/components/layout/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { OAuthButtons } from "@/components/ui/oauth-buttons";
import { sendMagicLink } from "@/lib/actions/auth";
import { createClient } from "@/lib/supabase/browser";
import { acceptMentorInvite } from "@/lib/actions/mentor-invites";

function LoginPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState<string | null>(
    searchParams.get("error") === "oauth_failed"
      ? "Google sign-in failed. Please try again or use your email below."
      : null,
  );
  const hashHandled = useRef(false);

  // Handle implicit-flow magic link — access_token lands in the URL hash.
  // This fires whenever the user ends up here after clicking a magic link,
  // regardless of which redirect_to was set in the original email.
  useEffect(() => {
    if (hashHandled.current) return;
    const hash = window.location.hash;
    if (!hash.includes("access_token=")) return;

    hashHandled.current = true;

    const params = new URLSearchParams(hash.slice(1));
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");

    if (!accessToken || !refreshToken) return;

    const supabase = createClient();

    supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
      .then(async ({ error }) => {
        if (error) {
          setServerError("Sign-in failed. Please request a new link.");
          return;
        }

        // Check if this is a mentor invite flow
        const mentorToken = sessionStorage.getItem("pendingMentorToken");
        sessionStorage.removeItem("pendingMentorToken");

        if (mentorToken) {
          const result = await acceptMentorInvite(mentorToken);
          if (!result.ok) {
            setServerError(result.error);
            return;
          }
        }

        router.replace("/dashboard");
      });
  }, [router]);

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
      quote='"The right mentor can save you months of figuring things out alone."'
      quoteAttribution="— Priya, Monash University"
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
            it to sign in — no password needed.
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
            Welcome back.
          </h1>
          <p className="font-body text-on-surface-variant text-base sm:text-lg mb-8 sm:mb-10">
            Enter your email and we&apos;ll send you a secure sign-in link.
          </p>

          <OAuthButtons />

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
              variant="primary"
              size="lg"
              className="w-full"
              disabled={isPending}
            >
              {isPending ? "Sending…" : "Send me a link"}
            </Button>
          </form>

          <p className="mt-8 font-body text-sm text-on-surface-variant">
            New to Hoddle?{" "}
            <Link
              href="/signup"
              className="text-primary underline underline-offset-2 hover:text-primary/80 transition-colors"
            >
              Create an account
            </Link>
          </p>
        </div>
      )}
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginPageInner />
    </Suspense>
  );
}
