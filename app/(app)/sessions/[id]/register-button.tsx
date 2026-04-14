"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { registerForSession, unregisterFromSession } from "@/lib/actions/sessions";
import { Button } from "@/components/ui/button";

interface RegisterButtonProps {
  sessionId: string;
  isRegistered: boolean;
  isFull: boolean;
}

export function RegisterButton({
  sessionId,
  isRegistered,
  isFull,
}: RegisterButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function toggle() {
    startTransition(async () => {
      if (isRegistered) {
        await unregisterFromSession(sessionId);
      } else {
        await registerForSession(sessionId);
      }
      router.refresh();
    });
  }

  if (isFull && !isRegistered) {
    return (
      <Button size="lg" disabled>
        Session full
      </Button>
    );
  }

  return (
    <Button
      size="lg"
      variant={isRegistered ? "secondary" : "primary"}
      onClick={toggle}
      disabled={isPending}
    >
      {isPending
        ? "…"
        : isRegistered
          ? "Cancel registration"
          : "Register for this session"}
    </Button>
  );
}
