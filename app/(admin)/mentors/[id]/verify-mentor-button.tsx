"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { verifyMentor, unverifyMentor } from "@/lib/actions/mentor-invites";

interface VerifyMentorButtonProps {
  profileId: string;
  currentlyVerified: boolean;
}

export function VerifyMentorButton({
  profileId,
  currentlyVerified,
}: VerifyMentorButtonProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setIsPending(true);
    setError(null);

    const result = currentlyVerified
      ? await unverifyMentor(profileId)
      : await verifyMentor(profileId);

    setIsPending(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    router.refresh();
  }

  return (
    <div className="space-y-3">
      <Button
        variant={currentlyVerified ? "secondary" : "primary"}
        className="w-full"
        onClick={handleClick}
        disabled={isPending}
      >
        {isPending
          ? currentlyVerified
            ? "Revoking…"
            : "Verifying…"
          : currentlyVerified
            ? "Revoke verification"
            : "Verify mentor"}
      </Button>
      {error && (
        <p className="font-body text-xs text-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
