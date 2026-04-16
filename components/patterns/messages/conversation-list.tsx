"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/browser";
import type { ConversationWithMeta, Message } from "@/lib/types/messages";

export interface ConversationListProps {
  initialConversations: ConversationWithMeta[];
  currentUserId: string;
  activeConversationId?: string;
}

function getInitials(name: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function relativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "short",
    timeZone: "Australia/Melbourne",
  }).format(new Date(isoString));
}

export function ConversationList({
  initialConversations,
  currentUserId,
  activeConversationId,
}: ConversationListProps) {
  const [conversations, setConversations] =
    useState<ConversationWithMeta[]>(initialConversations);
  const supabase = useRef(createClient()).current;

  // When active conversation changes, reset its unread count
  useEffect(() => {
    if (!activeConversationId) return;
    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeConversationId ? { ...c, unread_count: 0 } : c
      )
    );
  }, [activeConversationId]);

  // Realtime — subscribe to all new messages (RLS limits delivery to own convos)
  useEffect(() => {
    const channel = supabase
      .channel("user-messages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const newMsg = payload.new as Message;
          setConversations((prev) => {
            const idx = prev.findIndex((c) => c.id === newMsg.conversation_id);
            if (idx === -1) return prev;
            const updated = [...prev];
            const conv: ConversationWithMeta = {
              ...updated[idx],
              last_message: {
                id: newMsg.id,
                body: newMsg.body,
                sender_id: newMsg.sender_id,
                created_at: newMsg.created_at,
              },
              updated_at: newMsg.created_at,
            };
            // Only increment unread if it's from someone else AND not the active convo
            if (
              newMsg.sender_id !== currentUserId &&
              newMsg.conversation_id !== activeConversationId
            ) {
              conv.unread_count = (updated[idx].unread_count ?? 0) + 1;
            }
            updated.splice(idx, 1);
            updated.unshift(conv);
            return updated;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, currentUserId, activeConversationId]);

  return (
    <nav aria-label="Conversations" className="flex flex-col h-full">
      <div className="flex flex-col flex-1 overflow-y-auto">
        {conversations.length === 0 && (
          <p className="font-body text-sm text-on-surface-variant px-4 py-6 text-center">
            No conversations yet
          </p>
        )}
        <ul className="flex flex-col">
          {conversations.map((conv) => {
            const isActive = conv.id === activeConversationId;
            const name = conv.other_participant.full_name ?? "Participant";
            const initials = getInitials(conv.other_participant.full_name);
            const preview = conv.last_message
              ? conv.last_message.body.slice(0, 60) +
                (conv.last_message.body.length > 60 ? "…" : "")
              : "No messages yet";
            const time = conv.last_message
              ? relativeTime(conv.last_message.created_at)
              : relativeTime(conv.updated_at);
            const hasUnread = conv.unread_count > 0;

            return (
              <li key={conv.id}>
                <Link
                  href={`/messages/${conv.id}`}
                  className={`flex items-center gap-3 px-4 py-3 h-[72px] w-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-inset ${
                    isActive
                      ? "bg-surface-container-high"
                      : "bg-surface hover:bg-surface-container-low"
                  }`}
                  aria-current={isActive ? "page" : undefined}
                >
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center overflow-hidden">
                      {conv.other_participant.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={conv.other_participant.avatar_url}
                          alt={name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="font-display text-sm font-bold text-on-surface-variant select-none">
                          {initials}
                        </span>
                      )}
                    </div>
                    {hasUnread && (
                      <span
                        aria-label={`${conv.unread_count} unread`}
                        className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-primary text-on-primary rounded-full font-body font-bold text-[10px] flex items-center justify-center px-1"
                      >
                        {conv.unread_count > 99 ? "99+" : conv.unread_count}
                      </span>
                    )}
                  </div>

                  {/* Text */}
                  <div className="flex flex-col flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <span
                        className={`font-body text-sm font-semibold truncate ${
                          hasUnread ? "text-on-surface" : "text-on-surface"
                        }`}
                      >
                        {name}
                      </span>
                      <span className="font-body text-xs text-on-surface-variant shrink-0">
                        {time}
                      </span>
                    </div>
                    <span
                      className={`font-body text-xs truncate ${
                        hasUnread
                          ? "text-on-surface font-medium"
                          : "text-on-surface-variant"
                      }`}
                    >
                      {preview}
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      {/* New conversation CTA */}
      <div className="px-4 py-4 shrink-0">
        <Link
          href="/messages/new"
          className="block w-full text-center font-body text-sm font-semibold text-on-primary bg-primary rounded-xl px-4 py-2.5 hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          New conversation
        </Link>
      </div>
    </nav>
  );
}
