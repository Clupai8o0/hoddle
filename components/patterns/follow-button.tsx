"use client";

import { useState, useTransition } from "react";
import { UserPlus, UserCheck } from "lucide-react";
import { toggleFollow } from "@/lib/actions/mentor-follows";

interface FollowButtonProps {
  mentorProfileId: string;
  initialFollowing: boolean;
}

export function FollowButton({
  mentorProfileId,
  initialFollowing,
}: FollowButtonProps) {
  const [following, setFollowing] = useState(initialFollowing);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const result = await toggleFollow(mentorProfileId);
      if (result.ok) {
        setFollowing(result.following);
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      aria-pressed={following}
      className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-body text-sm font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-60 ${
        following
          ? "bg-surface-container text-on-surface hover:bg-surface-container-high"
          : "bg-primary text-surface hover:bg-primary/90"
      }`}
    >
      {following ? (
        <>
          <UserCheck size={15} strokeWidth={1.5} aria-hidden="true" />
          Following
        </>
      ) : (
        <>
          <UserPlus size={15} strokeWidth={1.5} aria-hidden="true" />
          Follow
        </>
      )}
    </button>
  );
}
