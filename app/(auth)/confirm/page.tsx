"use client";

import { Suspense, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";
import { acceptMentorInvite } from "@/lib/actions/mentor-invites";

function ConfirmInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const hash = window.location.hash;
    if (!hash.includes("access_token=")) {
      router.replace("/login?error=auth_failed");
      return;
    }

    const params = new URLSearchParams(hash.slice(1));
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");

    if (!accessToken || !refreshToken) {
      router.replace("/login?error=auth_failed");
      return;
    }

    const supabase = createClient();
    supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
      .then(async ({ error }) => {
        if (error) {
          router.replace("/login?error=auth_failed");
          return;
        }

        const mentorToken =
          searchParams.get("token") ?? sessionStorage.getItem("pendingMentorToken");
        sessionStorage.removeItem("pendingMentorToken");

        if (mentorToken) {
          const result = await acceptMentorInvite(mentorToken);
          if (!result.ok) {
            router.replace(`/login?error=${encodeURIComponent(result.error)}`);
            return;
          }
        }

        router.replace("/dashboard");
      });
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center">
      <p className="font-body text-on-surface-variant text-sm">Signing you in…</p>
    </div>
  );
}

export default function ConfirmPage() {
  return (
    <Suspense>
      <ConfirmInner />
    </Suspense>
  );
}
