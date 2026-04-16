"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/browser";
import { markConversationRead } from "@/lib/actions/messages";
import type {
  ChatParticipant,
  Message,
  MessageWithSender,
} from "@/lib/types/messages";
import { MessageBubble } from "./message-bubble";

export interface MessageThreadProps {
  conversationId: string;
  initialMessages: MessageWithSender[];
  currentUserId: string;
  otherParticipant: ChatParticipant;
  hasMore: boolean;
}

function getInitials(name: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

/** Returns true if two messages are from the same sender and within 5 minutes */
function isSameGroup(a: MessageWithSender, b: MessageWithSender): boolean {
  if (a.sender_id !== b.sender_id) return false;
  const diff =
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  return diff < 5 * 60 * 1000;
}

export function MessageThread({
  conversationId,
  initialMessages,
  currentUserId,
  otherParticipant,
  hasMore: initialHasMore,
}: MessageThreadProps) {
  const [messages, setMessages] = useState<MessageWithSender[]>(initialMessages);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isLoadingMore, startLoadMore] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);
  const supabase = useRef(createClient()).current;

  // Mark read on mount
  useEffect(() => {
    markConversationRead({ conversationId });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          const raw = payload.new as Message;

          setMessages((prev) => {
            if (prev.some((m) => m.id === raw.id)) return prev;
            // Determine sender — if it's the current user we already know their profile,
            // otherwise use otherParticipant (in a 1:1 conversation these are the only two).
            const sender: ChatParticipant =
              raw.sender_id === currentUserId
                ? {
                    id: currentUserId,
                    full_name: null, // not needed for own messages in bubble
                    avatar_url: null,
                    role: "student",
                  }
                : otherParticipant;

            const newMsg: MessageWithSender = { ...raw, sender };
            return [...prev, newMsg];
          });

          if (raw.sender_id !== currentUserId) {
            await markConversationRead({ conversationId });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, conversationId, currentUserId, otherParticipant]);

  function handleLoadMore() {
    if (messages.length === 0) return;
    const cursor = messages[0].created_at;

    startLoadMore(async () => {
      const { getMessages } = await import("@/lib/actions/messages");
      const result = await getMessages({ conversationId, cursor });
      if (!result.ok) return;
      setMessages((prev) => [...result.data.messages, ...prev]);
      setHasMore(result.data.hasMore);
    });
  }

  return (
    <div className="flex flex-col flex-1 overflow-y-auto px-4 py-6 gap-1">
      {hasMore && (
        <div className="flex justify-center pb-4">
          <button
            type="button"
            onClick={handleLoadMore}
            disabled={isLoadingMore}
            className="font-body text-xs text-on-surface-variant hover:text-on-surface transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded px-2 py-1"
          >
            {isLoadingMore ? "Loading…" : "Load earlier messages"}
          </button>
        </div>
      )}

      <div className="flex flex-col gap-1">
        {messages.map((message, idx) => {
          const isOwn = message.sender_id === currentUserId;
          const prev = messages[idx - 1];
          const isGroupStart = !prev || !isSameGroup(prev, message);

          return (
            <div key={message.id} className={`flex flex-col ${isOwn ? "items-end" : "items-start"} ${isGroupStart ? "mt-4" : "mt-0.5"}`}>
              {/* Group header: sender name + avatar for other user */}
              {isGroupStart && !isOwn && (
                <div className="flex items-center gap-2 mb-1 ml-1">
                  <div className="w-7 h-7 rounded-full bg-surface-container-high flex items-center justify-center overflow-hidden shrink-0">
                    {otherParticipant.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={otherParticipant.avatar_url}
                        alt={otherParticipant.full_name ?? "Participant"}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="font-display text-[10px] font-bold text-on-surface-variant select-none">
                        {getInitials(otherParticipant.full_name)}
                      </span>
                    )}
                  </div>
                  <span className="font-body text-xs font-semibold text-on-surface-variant">
                    {otherParticipant.full_name ?? "Participant"}
                  </span>
                </div>
              )}

              <MessageBubble message={message} isOwn={isOwn} />
            </div>
          );
        })}
      </div>

      <div ref={bottomRef} aria-hidden="true" />
    </div>
  );
}
