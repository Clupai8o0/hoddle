"use client";

import { useState, useTransition } from "react";
import { Heart, ThumbsUp, Smile } from "lucide-react";
import { toggleReaction } from "@/lib/actions/forums";

type ReactionType = "heart" | "thanks" | "helpful";

interface ReactionCount {
  reaction: ReactionType;
  count: number;
  userReacted: boolean;
}

interface ReactionButtonsProps {
  postId: string;
  reactions: ReactionCount[];
  threadPath: string;
}

const REACTION_META: Record<
  ReactionType,
  { label: string; Icon: React.FC<{ className?: string }> }
> = {
  helpful: {
    label: "Helpful",
    Icon: ({ className }) => (
      <ThumbsUp strokeWidth={1.5} className={className} />
    ),
  },
  heart: {
    label: "Thanks",
    Icon: ({ className }) => <Heart strokeWidth={1.5} className={className} />,
  },
  thanks: {
    label: "Same issue",
    Icon: ({ className }) => <Smile strokeWidth={1.5} className={className} />,
  },
};

export function ReactionButtons({
  postId,
  reactions,
  threadPath,
}: ReactionButtonsProps) {
  const [optimistic, setOptimistic] = useState<ReactionCount[]>(reactions);
  const [, startTransition] = useTransition();

  function handleReact(reaction: ReactionType) {
    const current = optimistic.find((r) => r.reaction === reaction);
    if (!current) return;

    // Optimistic update
    setOptimistic((prev) =>
      prev.map((r) =>
        r.reaction === reaction
          ? {
              ...r,
              count: r.userReacted ? r.count - 1 : r.count + 1,
              userReacted: !r.userReacted,
            }
          : r,
      ),
    );

    startTransition(async () => {
      const result = await toggleReaction({ post_id: postId, reaction }, threadPath);
      if (!result.ok) {
        // Revert on error
        setOptimistic(reactions);
      }
    });
  }

  return (
    <div className="flex flex-wrap gap-2 mt-6">
      {optimistic.map(({ reaction, count, userReacted }) => {
        const { label, Icon } = REACTION_META[reaction];
        return (
          <button
            key={reaction}
            onClick={() => handleReact(reaction)}
            className={[
              "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-body font-medium transition-colors",
              userReacted
                ? "bg-primary/10 text-primary"
                : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high",
            ].join(" ")}
          >
            <Icon className="w-4 h-4" />
            <span>{label}</span>
            {count > 0 && (
              <span className="text-xs opacity-70">{count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
