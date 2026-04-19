"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { deleteReview } from "@/lib/actions/admin-reviews";

export function DeleteReviewButton({ id, authorName }: { id: string; authorName: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      const result = await deleteReview(id);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => { setConfirming(true); setError(null); }}
        className="font-body text-sm text-on-surface-variant hover:text-error inline-flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary rounded-sm"
        aria-label={`Delete review by ${authorName}`}
      >
        <Trash2 size={14} strokeWidth={1.5} aria-hidden="true" />
        Delete
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={handleDelete}
        disabled={isPending}
        className="font-body text-sm font-semibold text-error hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary rounded-sm disabled:opacity-60"
      >
        {isPending ? "Deleting..." : "Confirm delete"}
      </button>
      <button
        type="button"
        onClick={() => { setConfirming(false); setError(null); }}
        className="font-body text-sm text-on-surface-variant hover:text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary rounded-sm"
      >
        Cancel
      </button>
      {error && (
        <span className="font-body text-xs text-error" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
