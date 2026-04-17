"use client";

import { Quote, AtSign } from "lucide-react";

export const QUOTE_REPLY_EVENT = "hoddle:quote-reply";

export interface QuoteReplyDetail {
  body: string;
  authorName: string | null;
  mode: "quote" | "mention";
}

interface QuoteReplyButtonProps {
  body: string;
  authorName: string | null;
}

/**
 * Dispatches a custom event consumed by the sticky reply form at the
 * bottom of the thread. The form pre-fills its textarea with either a
 * markdown block-quote of the post or an @mention of the author, then
 * focuses and scrolls itself into view.
 */
export function QuoteReplyButton({ body, authorName }: QuoteReplyButtonProps) {
  function dispatch(mode: "quote" | "mention") {
    const detail: QuoteReplyDetail = { body, authorName, mode };
    window.dispatchEvent(new CustomEvent(QUOTE_REPLY_EVENT, { detail }));
  }

  return (
    <div className="flex items-center gap-2 mt-4">
      <button
        type="button"
        onClick={() => dispatch("quote")}
        className="flex items-center gap-1.5 text-xs font-body text-on-surface-variant hover:text-primary transition-colors"
      >
        <Quote strokeWidth={1.5} className="w-3.5 h-3.5" />
        Quote reply
      </button>
      {authorName && (
        <button
          type="button"
          onClick={() => dispatch("mention")}
          className="flex items-center gap-1.5 text-xs font-body text-on-surface-variant hover:text-primary transition-colors"
        >
          <AtSign strokeWidth={1.5} className="w-3.5 h-3.5" />
          Tag {authorName.split(" ")[0]}
        </button>
      )}
    </div>
  );
}
