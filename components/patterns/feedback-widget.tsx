"use client";

import { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { submitFeedback } from "@/lib/actions/feedback";

type Category = "Bug" | "Suggestion" | "Confusion" | "Other";

const CATEGORIES: Category[] = ["Bug", "Suggestion", "Confusion", "Other"];

// No props needed — identity comes from the server action's session check
export function FeedbackWidget() {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<Category | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  function handleOpen() {
    setOpen((v) => !v);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!category || !message.trim()) return;
    setLoading(true);
    const result = await submitFeedback({
      category,
      message: message.trim(),
      pageUrl: window.location.href,
    });
    setLoading(false);
    if (result.ok) {
      toast.success("Thanks for your feedback");
      setOpen(false);
      setCategory(null);
      setMessage("");
    } else {
      toast.error("Something went wrong — try again");
    }
  }

  const canSubmit = category !== null && message.trim().length > 0 && !loading;

  return (
    <div ref={panelRef} className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Popover panel */}
      {open && (
        <div
          className="w-80 rounded-xl p-5 bg-surface-container shadow-ambient"
        >
          <div className="flex items-center justify-between mb-4">
            <p className="font-display text-sm font-semibold text-on-surface tracking-wide">
              Share feedback
            </p>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close feedback panel"
              className="text-on-surface-variant hover:text-on-surface transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary focus-visible:ring-offset-2 focus-visible:ring-offset-surface-container"
            >
              <X size={16} strokeWidth={1.5} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Category pills */}
            <div className="flex flex-wrap gap-2" role="group" aria-label="Feedback category">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  disabled={loading}
                  aria-pressed={category === cat}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium font-body transition-colors",
                    category === cat
                      ? "bg-primary text-on-primary"
                      : "bg-surface-container-high text-on-surface hover:bg-surface-container-highest",
                    loading && "opacity-50 cursor-not-allowed",
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Message */}
            <Textarea
              placeholder="Tell us what you noticed…"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={1000}
              disabled={loading}
              className="min-h-[96px] text-sm"
              aria-label="Feedback message"
            />

            {/* Submit */}
            <Button
              type="submit"
              size="sm"
              disabled={!canSubmit}
              className="self-end"
            >
              {loading ? (
                <Loader2 size={14} strokeWidth={1.5} className="animate-spin" />
              ) : (
                "Send"
              )}
            </Button>
          </form>
        </div>
      )}

      {/* Trigger button */}
      <button
        onClick={handleOpen}
        aria-label="Open feedback panel"
        aria-expanded={open}
        className={cn(
          "flex items-center gap-2 px-4 py-2.5 rounded-full",
          "bg-primary text-on-primary",
          "font-body text-sm font-medium",
          "transition-all duration-200",
          "hover:shadow-ambient hover:-translate-y-px",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
        )}
      >
        <MessageSquare size={15} strokeWidth={1.5} />
        Feedback
      </button>
    </div>
  );
}
