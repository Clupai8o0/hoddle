"use client";

import { useState, useTransition } from "react";
import { SmilePlus } from "lucide-react";
import { toggleReaction } from "@/lib/actions/forums";
import { REACTION_TYPES, type ReactionType } from "@/lib/validation/forum";

interface ReactionCount {
  reaction: ReactionType;
  count: number;
  userReacted: boolean;
}

interface ReactionButtonsProps {
  postId: string;
  reactions: ReactionCount[];
  threadPath: string;
  /** When true, disables interaction (e.g. viewer not signed in). */
  readOnly?: boolean;
}

type ReactionMeta = { label: string; emoji: string };

const REACTION_META: Record<ReactionType, ReactionMeta> = {
  heart: { label: "Helpful", emoji: "❤️" },
  helpful: { label: "Thanks", emoji: "👍" },
  thanks: { label: "Hugs", emoji: "👋" },
  insightful: { label: "Insightful", emoji: "⭐" },
};

export function ReactionButtons({
  postId,
  reactions,
  threadPath,
  readOnly = false,
}: ReactionButtonsProps) {
  const [optimistic, setOptimistic] = useState<ReactionCount[]>(() =>
    REACTION_TYPES.map(
      (r) =>
        reactions.find((existing) => existing.reaction === r) ?? {
          reaction: r,
          count: 0,
          userReacted: false,
        },
    ),
  );
  const [pickerOpen, setPickerOpen] = useState(false);
  const [, startTransition] = useTransition();

  function handleReact(reaction: ReactionType) {
    if (readOnly) return;
    const current = optimistic.find((r) => r.reaction === reaction);
    if (!current) return;

    setPickerOpen(false);
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
      const result = await toggleReaction(
        { post_id: postId, reaction },
        threadPath,
      );
      if (!result.ok) {
        setOptimistic(
          REACTION_TYPES.map(
            (r) =>
              reactions.find((existing) => existing.reaction === r) ?? {
                reaction: r,
                count: 0,
                userReacted: false,
              },
          ),
        );
      }
    });
  }

  // Show only reactions that have counts OR that the viewer has reacted with.
  // Viewers can pick any reaction via the "+" picker.
  const visible = optimistic.filter(
    (r) => r.count > 0 || r.userReacted,
  );

  if (readOnly && visible.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 mt-6">
      {visible.map(({ reaction, count, userReacted }) => {
        const { label, emoji } = REACTION_META[reaction];
        return (
          <button
            key={reaction}
            type="button"
            onClick={() => handleReact(reaction)}
            disabled={readOnly}
            aria-pressed={userReacted}
            aria-label={`${label} — ${count}`}
            className={[
              "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-body font-medium transition-colors",
              userReacted
                ? "bg-primary/10 text-primary ring-1 ring-primary/20"
                : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high",
              readOnly ? "cursor-default hover:bg-surface-container" : "",
            ].join(" ")}
          >
            <span aria-hidden="true">{emoji}</span>
            <span>{label}</span>
            <span className="text-xs opacity-70">{count}</span>
          </button>
        );
      })}

      {!readOnly && (
        <div className="relative">
          <button
            type="button"
            onClick={() => setPickerOpen((v) => !v)}
            aria-expanded={pickerOpen}
            aria-haspopup="menu"
            aria-label="Add reaction"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-body text-on-surface-variant bg-surface-container hover:bg-surface-container-high transition-colors"
          >
            <SmilePlus strokeWidth={1.5} className="w-4 h-4" />
            <span className="sr-only">Add reaction</span>
          </button>
          {pickerOpen && (
            <div
              role="menu"
              className="absolute left-0 bottom-full mb-2 flex flex-wrap gap-1 p-2 bg-surface-container-lowest rounded-2xl shadow-ambient z-10 min-w-[220px]"
            >
              {REACTION_TYPES.map((r) => {
                const { label, emoji } = REACTION_META[r];
                return (
                  <button
                    key={r}
                    type="button"
                    role="menuitem"
                    onClick={() => handleReact(r)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-body text-on-surface-variant hover:bg-surface-container-high transition-colors"
                  >
                    <span aria-hidden="true">{emoji}</span>
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
