"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import { markConversationRead } from "@/lib/actions/messages";
import type { ChatParticipant, Message, MessageWithSender } from "@/lib/types/messages";
import { MessageThread } from "./message-thread";
import { ComposeInput } from "./compose-input";

export interface ConversationClientProps {
  conversationId: string;
  initialMessages: MessageWithSender[];
  initialHasMore: boolean;
  currentUserId: string;
  currentUserProfile: ChatParticipant;
  otherParticipant: ChatParticipant;
}

export function ConversationClient({
  conversationId,
  initialMessages,
  initialHasMore,
  currentUserId,
  currentUserProfile,
  otherParticipant,
}: ConversationClientProps) {
  const [messages, setMessages] = useState<MessageWithSender[]>(initialMessages);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const supabase = useRef(createClient()).current;

  // Mark read on mount
  useEffect(() => {
    markConversationRead({ conversationId });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  // Realtime subscription — handles messages from the other participant
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
        (payload) => {
          const raw = payload.new as Message;
          setMessages((prev) => {
            // Dedup: own messages are already added optimistically by addMessage()
            if (prev.some((m) => m.id === raw.id)) return prev;
            const sender =
              raw.sender_id === currentUserId ? currentUserProfile : otherParticipant;
            return [...prev, { ...raw, sender }];
          });
          if (raw.sender_id !== currentUserId) {
            markConversationRead({ conversationId });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, conversationId, currentUserId, currentUserProfile, otherParticipant]);

  // Called by ComposeInput immediately after sendMessage succeeds
  function addMessage(msg: MessageWithSender) {
    setMessages((prev) => {
      if (prev.some((m) => m.id === msg.id)) return prev;
      return [...prev, msg];
    });
  }

  return (
    <>
      <MessageThread
        messages={messages}
        hasMore={hasMore}
        onHasMoreChange={setHasMore}
        conversationId={conversationId}
        currentUserId={currentUserId}
        otherParticipant={otherParticipant}
        onMessagesLoaded={(older) =>
          setMessages((prev) => [...older, ...prev])
        }
      />
      <ComposeInput
        conversationId={conversationId}
        currentUserProfile={currentUserProfile}
        onMessageSent={addMessage}
      />
    </>
  );
}
