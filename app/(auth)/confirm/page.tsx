"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";
import { acceptMentorInvite } from "@/lib/actions/mentor-invites";

// Handles the implicit-flow redirect from Supabase magic links generated
// via admin.auth.admin.generateLink(). The access_token arrives in the
// URL hash fragment (#), which servers never see, so we process it here
// on the client and then redirect to the right destination.

export default function ConfirmPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const supabase = createClient();

    // onAuthStateChange fires once the browser client parses the hash fragment
    // and exchanges the implicit tokens for a session stored in cookies.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        subscription.unsubscribe();

        if (!session) {
          router.replace("/login?error=auth_failed");
          return;
        }

        const mentorToken = searchParams.get("token");

        if (mentorToken) {
          // Mentor invite flow — accept invite then go to dashboard
          const result = await acceptMentorInvite(mentorToken);
          if (!result.ok) {
            router.replace(`/login?error=${encodeURIComponent(result.error)}`);
          } else {
            router.replace("/dashboard");
          }
        } else {
          // Student login — middleware handles onboarding redirect if needed
          router.replace("/dashboard");
        }
      },
    );

    // Trigger session detection if onAuthStateChange doesn't fire on its own
    supabase.auth.getSession();
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center">
      <p className="font-body text-on-surface-variant text-sm">Signing you in…</p>
    </div>
  );
}
