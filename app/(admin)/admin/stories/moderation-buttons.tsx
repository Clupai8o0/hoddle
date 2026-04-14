"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { moderateStory } from "@/lib/actions/success-stories";
import { Button } from "@/components/ui/button";

export function ModerationButtons({ storyId }: { storyId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handle(action: "approve" | "reject") {
    setError(null);
    startTransition(async () => {
      const result = await moderateStory({ id: storyId, action });
      if (!result.ok) {
        setError(result.error);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <Button
        size="sm"
        onClick={() => handle("approve")}
        disabled={isPending}
        aria-label="Approve story"
      >
        {isPending ? "…" : "Approve"}
      </Button>
      <Button
        size="sm"
        variant="secondary"
        onClick={() => handle("reject")}
        disabled={isPending}
        aria-label="Reject story"
      >
        Reject
      </Button>
      {error && (
        <p className="text-xs text-error font-body" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
