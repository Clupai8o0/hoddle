"use client";

import { useRef, useState, useTransition, useCallback } from "react";
import { ArrowUp } from "lucide-react";
import { sendMessage } from "@/lib/actions/messages";
import type { ChatParticipant, MessageWithSender } from "@/lib/types/messages";

const MAX_CHARS = 4000;
const WARN_THRESHOLD = 3800;

export interface ComposeInputProps {
  conversationId: string;
  currentUserProfile: ChatParticipant;
  onMessageSent: (msg: MessageWithSender) => void;
}

export function ComposeInput({
  conversationId,
  currentUserProfile,
  onMessageSent,
}: ComposeInputProps) {
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 96)}px`;
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    if (e.target.value.length > MAX_CHARS) return;
    setBody(e.target.value);
    setError(null);
    adjustHeight();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  function submit() {
    const trimmed = body.trim();
    if (!trimmed || isPending) return;

    startTransition(async () => {
      const result = await sendMessage({ conversationId, body: trimmed });
      if (result.ok) {
        // Optimistically append the message immediately — no waiting for Realtime
        onMessageSent({ ...result.data, sender: currentUserProfile });
        setBody("");
        setError(null);
        if (textareaRef.current) {
          textareaRef.current.style.height = "auto";
        }
      } else {
        setError(result.error);
      }
    });
  }

  const showCount = body.length >= WARN_THRESHOLD;
  const remaining = MAX_CHARS - body.length;

  return (
    <div className="bg-surface-container-low border-t border-surface-container px-4 py-3 flex flex-col gap-1.5">
      {error && (
        <p className="font-body text-xs text-on-surface-variant" role="alert">
          {error}
        </p>
      )}
      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={body}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={isPending}
          rows={1}
          placeholder="Write a message…"
          aria-label="Message body"
          className="flex-1 resize-none overflow-y-auto bg-transparent font-body text-sm text-on-surface placeholder:text-on-surface-variant leading-relaxed focus:outline-none disabled:opacity-60 py-1"
          style={{ minHeight: "24px", maxHeight: "96px" }}
        />
        {showCount && (
          <span
            className="font-body text-xs shrink-0 tabular-nums text-on-surface-variant"
            aria-live="polite"
          >
            {body.length} / {MAX_CHARS}
          </span>
        )}
        <button
          type="button"
          onClick={submit}
          disabled={isPending || !body.trim()}
          aria-label="Send message"
          className="shrink-0 w-9 h-9 rounded-full bg-primary text-on-primary flex items-center justify-center transition-opacity disabled:opacity-40 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          <ArrowUp size={16} strokeWidth={1.5} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
