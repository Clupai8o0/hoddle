"use client";

import { useState } from "react";
import { Mail } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/browser";

interface MentorSignupFormProps {
  token: string;
  inviteEmail: string;
}

export function MentorSignupForm({ token, inviteEmail }: MentorSignupFormProps) {
  const [email, setEmail] = useState(inviteEmail);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [sent, setSent] = useState(false);

  const siteUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEmailError(null);
    setServerError(null);

    const trimmed = email.trim().toLowerCase();

    if (!trimmed) {
      setEmailError("Email is required.");
      return;
    }
    if (trimmed !== inviteEmail.toLowerCase()) {
      setEmailError(
        "This invite was sent to a different email address. Use the email that received the invite.",
      );
      return;
    }

    setIsPending(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: trimmed,
      options: {
        emailRedirectTo: `${siteUrl}/api/auth/mentor-callback?token=${encodeURIComponent(token)}`,
      },
    });

    setIsPending(false);

    if (error) {
      setServerError(error.message);
      return;
    }

    setSent(true);
  }

  if (sent) {
    return (
      <div className="max-w-md">
        <div className="w-12 h-12 rounded-full bg-secondary-container flex items-center justify-center mb-8">
          <Mail
            size={20}
            strokeWidth={1.5}
            className="text-secondary"
            aria-hidden="true"
          />
        </div>
        <h1 className="font-display font-bold text-3xl text-primary mb-3">
          Check your inbox.
        </h1>
        <p className="font-body text-on-surface-variant text-lg leading-relaxed">
          We sent a secure link to{" "}
          <span className="text-on-surface font-medium">{email}</span>. Click it
          to create your mentor account.
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
            try again
          </button>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-md w-full">
      <h1 className="font-display font-bold text-4xl text-primary mb-2">
        Join as a mentor.
      </h1>
      <p className="font-body text-on-surface-variant text-lg mb-10 leading-relaxed">
        You&apos;ve been invited to mentor first-year international students at
        Hoddle. Confirm your email to get started.
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
          hint="Must match the email this invite was sent to."
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
          {isPending ? "Sending…" : "Send me a magic link"}
        </Button>
      </form>
    </div>
  );
}
