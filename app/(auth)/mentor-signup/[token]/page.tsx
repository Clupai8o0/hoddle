import { redirect } from "next/navigation";
import { MentorSignupForm } from "./mentor-signup-form";
import { AuthShell } from "@/components/layout/auth-shell";
import { createClient } from "@/lib/supabase/server";

interface PageProps {
  params: Promise<{ token: string }>;
}

export const metadata = { title: "Mentor Signup — Hoddle" };

export default async function MentorSignupPage({ params }: PageProps) {
  const { token } = await params;
  const supabase = await createClient();

  // Validate token server-side before rendering the form
  const now = new Date().toISOString();
  const { data: invite } = await supabase
    .from("mentor_invites")
    .select("email, accepted_at, expires_at")
    .eq("token", token)
    .maybeSingle();

  if (!invite) {
    redirect("/login?error=invalid_invite");
  }

  if (invite.accepted_at) {
    redirect("/login?error=invite_used");
  }

  if (invite.expires_at < now) {
    redirect("/login?error=invite_expired");
  }

  // If user is already authenticated with the correct email, redirect to
  // the accept callback directly
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user && user.email?.toLowerCase() === invite.email.toLowerCase()) {
    redirect(`/api/auth/mentor-callback?token=${encodeURIComponent(token)}`);
  }

  return (
    <AuthShell
      quote='"Your story is exactly what the next generation needs to hear."'
      quoteAttribution="— Hoddle team"
    >
      <MentorSignupForm token={token} inviteEmail={invite.email} />
    </AuthShell>
  );
}
