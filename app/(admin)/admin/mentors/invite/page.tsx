"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { inviteMentor } from "@/lib/actions/mentor-invites";

export default function InviteMentorPage() {
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [invitedEmail, setInvitedEmail] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEmailError(null);
    setServerError(null);

    if (!email) {
      setEmailError("Email is required.");
      return;
    }

    setIsPending(true);
    const result = await inviteMentor({ email: email.trim(), note: note.trim() || undefined });
    setIsPending(false);

    if (!result.ok) {
      setServerError(result.error);
      return;
    }

    setInvitedEmail(email.trim());
  }

  if (invitedEmail) {
    return (
      <Container className="py-16">
        <div className="max-w-lg">
          <div className="w-12 h-12 rounded-full bg-secondary-container flex items-center justify-center mb-8">
            <CheckCircle
              size={20}
              strokeWidth={1.5}
              className="text-secondary"
              aria-hidden="true"
            />
          </div>
          <h1 className="font-display text-3xl font-bold text-primary mb-3">
            Invite sent.
          </h1>
          <p className="font-body text-on-surface-variant text-lg leading-relaxed">
            A signup link has been sent to{" "}
            <span className="text-on-surface font-medium">{invitedEmail}</span>.
            It expires in 7 days.
          </p>
          <div className="flex gap-3 mt-10">
            <Button
              variant="primary"
              onClick={() => {
                setInvitedEmail(null);
                setEmail("");
                setNote("");
              }}
            >
              Send another invite
            </Button>
            <Button variant="secondary" asChild>
              <Link href="/admin/mentors">View all mentors</Link>
            </Button>
          </div>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-16">
      <div className="max-w-lg">
        <nav className="font-body text-sm text-on-surface-variant mb-3">
          <Link href="/admin" className="hover:text-primary transition-colors">
            Admin
          </Link>
          {" / "}
          <Link
            href="/admin/mentors"
            className="hover:text-primary transition-colors"
          >
            Mentors
          </Link>
          {" / "}
          <span className="text-on-surface">Invite</span>
        </nav>

        <h1 className="font-display text-4xl font-bold text-primary mb-2">
          Invite a mentor
        </h1>
        <p className="font-body text-on-surface-variant text-lg mb-10">
          Send a secure signup link. The mentor must use the same email address
          to create their account.
        </p>

        <form onSubmit={handleSubmit} noValidate className="space-y-6">
          <Input
            type="email"
            label="Email address"
            placeholder="mentor@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (emailError) setEmailError(null);
            }}
            error={emailError ?? undefined}
            autoComplete="email"
            autoFocus
          />

          <div className="flex flex-col gap-1.5 w-full">
            <label
              htmlFor="note"
              className="font-body text-sm font-medium text-on-surface tracking-[0.08em] uppercase"
            >
              Personal note{" "}
              <span className="normal-case tracking-normal font-normal text-on-surface-variant">
                (optional)
              </span>
            </label>
            <textarea
              id="note"
              rows={4}
              placeholder="Add a personal message that will appear in the invite email…"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={500}
              className="w-full px-4 py-3 font-body text-base text-on-surface bg-surface-container-low rounded-md outline-none border-none ring-0 focus:ring-2 focus:ring-tertiary focus:ring-offset-0 placeholder:text-on-surface-variant/60 resize-none"
            />
            <p className="font-body text-xs text-on-surface-variant text-right">
              {note.length}/500
            </p>
          </div>

          {serverError && (
            <p className="font-body text-sm text-error" role="alert">
              {serverError}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="flex-1"
              disabled={isPending}
            >
              {isPending ? "Sending…" : "Send invite"}
            </Button>
            <Button variant="ghost" size="lg" asChild>
              <Link href="/admin/mentors">Cancel</Link>
            </Button>
          </div>
        </form>
      </div>
    </Container>
  );
}
