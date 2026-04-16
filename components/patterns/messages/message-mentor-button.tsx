"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare } from "lucide-react";
import { getOrCreateConversation } from "@/lib/actions/messages";

interface MessageMentorButtonProps {
  mentorProfileId: string;
  mentorName: string;
}

export function MessageMentorButton({
  mentorProfileId,
  mentorName,
}: MessageMentorButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    setError(null);
    startTransition(async () => {
      const result = await getOrCreateConversation({ otherProfileId: mentorProfileId });
      if (result.ok) {
        router.push(`/messages/${result.data.id}`);
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        aria-label={`Send ${mentorName} a message`}
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-body text-sm font-semibold bg-surface-container text-on-surface hover:bg-surface-container-high transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-60"
      >
        <MessageSquare size={15} strokeWidth={1.5} aria-hidden="true" />
        {isPending ? "Opening…" : "Message"}
      </button>
      {error && (
        <p className="font-body text-xs text-on-surface-variant">{error}</p>
      )}
    </div>
  );
}
