"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { createClient } from "@/lib/supabase/browser";

interface NotificationBellProps {
  userId: string;
  /** Initial unread count passed from the server to avoid a loading flash */
  initialUnreadCount: number;
}

export function NotificationBell({
  userId,
  initialUnreadCount,
}: NotificationBellProps) {
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);

  useEffect(() => {
    const supabase = createClient();

    // Subscribe to new notifications for this user
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `recipient_id=eq.${userId}`,
        },
        () => {
          setUnreadCount((prev) => prev + 1);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `recipient_id=eq.${userId}`,
        },
        (payload) => {
          // If read_at was set, decrement
          if (payload.new.read_at && !payload.old.read_at) {
            setUnreadCount((prev) => Math.max(0, prev - 1));
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return (
    <Link
      href="/inbox"
      className="relative flex items-center justify-center w-8 h-8 text-on-surface-variant hover:text-on-surface transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary rounded-sm"
      aria-label={
        unreadCount > 0
          ? `Inbox — ${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}`
          : "Inbox"
      }
    >
      <Bell size={18} strokeWidth={1.5} />
      {unreadCount > 0 && (
        <span
          aria-hidden="true"
          className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 flex items-center justify-center rounded-full bg-primary text-surface font-body text-[10px] font-bold px-0.5 leading-none"
        >
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </Link>
  );
}
