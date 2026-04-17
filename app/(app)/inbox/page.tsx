import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Container } from "@/components/ui/container";
import {
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/actions/notifications";
import type { Database } from "@/lib/supabase/database.types";

export const metadata = { title: "Inbox — Hoddle" };

type NotificationType = Database["public"]["Enums"]["notification_type"];

interface Notification {
  id: string;
  type: NotificationType;
  payload: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
}

// ── Server action wrappers (void return for form actions) ─────────────────────

async function handleMarkAllRead(): Promise<void> {
  "use server";
  await markAllNotificationsRead();
}

async function handleMarkOneRead(formData: FormData): Promise<void> {
  "use server";
  const id = formData.get("id");
  if (typeof id === "string" && id) {
    await markNotificationRead(id);
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function notificationLabel(type: NotificationType): string {
  switch (type) {
    case "forum_reply_to_your_thread":
      return "Forum reply";
    case "success_story_approved":
      return "Story approved";
    case "mentor_replied_to_your_question":
      return "Question answered";
    case "new_content_from_mentor_you_follow":
      return "New content";
    case "session_reminder_24h":
      return "Session tomorrow";
    case "session_starting_soon":
      return "Starting soon";
    case "new_chat_message":
      return "New message";
    default:
      return "Notification";
  }
}

function notificationMessage(n: Notification): string {
  const p = n.payload;
  switch (n.type) {
    case "forum_reply_to_your_thread":
      return `${String(p.replier_name ?? "Someone")} replied to "${String(p.thread_title ?? "your thread")}"`;
    case "success_story_approved":
      return `Your story "${String(p.story_title ?? "your story")}" was approved and is now live.`;
    case "mentor_replied_to_your_question":
      return `${String(p.mentor_name ?? "Your mentor")} answered your question for "${String(p.session_title ?? "a session")}"`;
    case "new_content_from_mentor_you_follow":
      return `${String(p.mentor_name ?? "A mentor")} published "${String(p.content_title ?? "new content")}"`;
    case "session_reminder_24h":
      return `"${String(p.session_title ?? "Your session")}" is tomorrow.`;
    case "session_starting_soon":
      return `"${String(p.session_title ?? "Your session")}" starts in 15 minutes.`;
    case "new_chat_message":
      return `${String(p.sender_name ?? "Someone")} sent you a message: "${String(p.message_preview ?? "").slice(0, 80)}"`;
    default:
      return "You have a new notification.";
  }
}

function notificationHref(n: Notification): string {
  const p = n.payload;
  switch (n.type) {
    case "forum_reply_to_your_thread":
      return p.category_slug && p.thread_slug
        ? `/forums/${String(p.category_slug)}/${String(p.thread_slug)}`
        : "/forums";
    case "success_story_approved":
      return p.story_slug ? `/stories/${String(p.story_slug)}` : "/stories";
    case "mentor_replied_to_your_question":
      return p.session_id ? `/sessions/${String(p.session_id)}` : "/sessions";
    case "new_content_from_mentor_you_follow":
      return p.content_slug ? `/content/${String(p.content_slug)}` : "/content";
    case "session_reminder_24h":
    case "session_starting_soon":
      return p.session_id ? `/sessions/${String(p.session_id)}` : "/sessions";
    case "new_chat_message":
      return p.conversation_id ? `/messages/${String(p.conversation_id)}` : "/messages";
    default:
      return "/inbox";
  }
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString("en-AU", {
    timeZone: "Australia/Melbourne",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function InboxPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: notifications } = await supabase
    .from("notifications")
    .select("id, type, payload, read_at, created_at")
    .eq("recipient_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const items = (notifications ?? []) as Notification[];
  const unread = items.filter((n) => !n.read_at);
  const read = items.filter((n) => n.read_at);

  return (
    <Container className="py-10 sm:py-16 max-w-2xl">
      <div className="flex items-center justify-between mb-8 sm:mb-10 gap-4">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-primary">Inbox</h1>
        {unread.length > 0 && (
          <form action={handleMarkAllRead}>
            <button
              type="submit"
              className="font-body text-sm text-on-surface-variant hover:text-on-surface transition-colors duration-150 underline underline-offset-2"
            >
              Mark all as read
            </button>
          </form>
        )}
      </div>

      {items.length === 0 && (
        <div className="py-16 text-center">
          <p className="font-body text-on-surface-variant">
            You're all caught up — no notifications yet.
          </p>
        </div>
      )}

      {unread.length > 0 && (
        <section className="mb-10">
          <h2 className="font-body text-xs font-semibold text-on-surface-variant uppercase tracking-widest mb-4">
            Unread
          </h2>
          <div className="space-y-2">
            {unread.map((n) => (
              <NotificationRow
                key={n.id}
                notification={n}
                markReadAction={handleMarkOneRead}
              />
            ))}
          </div>
        </section>
      )}

      {read.length > 0 && (
        <section>
          <h2 className="font-body text-xs font-semibold text-on-surface-variant uppercase tracking-widest mb-4">
            Earlier
          </h2>
          <div className="space-y-2">
            {read.map((n) => (
              <NotificationRow
                key={n.id}
                notification={n}
                markReadAction={handleMarkOneRead}
              />
            ))}
          </div>
        </section>
      )}

      <div className="mt-12 pt-8 border-t border-surface-container">
        <Link
          href="/settings/notifications"
          className="font-body text-sm text-on-surface-variant hover:text-on-surface transition-colors duration-150 underline underline-offset-2"
        >
          Notification preferences
        </Link>
      </div>
    </Container>
  );
}

// ── Row component ──────────────────────────────────────────────────────────────

function NotificationRow({
  notification: n,
  markReadAction,
}: {
  notification: Notification;
  markReadAction: (formData: FormData) => Promise<void>;
}) {
  const isUnread = !n.read_at;
  const href = notificationHref(n);

  return (
    <div
      className={`group relative rounded-2xl px-5 py-4 transition-colors duration-150 ${
        isUnread
          ? "bg-surface-container-low"
          : "bg-surface hover:bg-surface-container-low/60"
      }`}
    >
      {/* Unread dot */}
      {isUnread && (
        <span
          aria-hidden="true"
          className="absolute left-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-primary"
        />
      )}

      <div className="flex items-start gap-4 pl-2">
        <div className="flex-1 min-w-0">
          <p className="font-body text-xs text-on-surface-variant mb-1">
            {notificationLabel(n.type)}
          </p>
          <Link
            href={href}
            className="font-body text-sm text-on-surface leading-relaxed hover:text-primary transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary rounded-sm"
          >
            {notificationMessage(n)}
          </Link>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <span className="font-body text-xs text-on-surface-variant whitespace-nowrap">
            {formatTime(n.created_at)}
          </span>
          {isUnread && (
            <form action={markReadAction}>
              <input type="hidden" name="id" value={n.id} />
              <button
                type="submit"
                className="font-body text-xs text-on-surface-variant hover:text-on-surface transition-colors duration-150 underline underline-offset-2"
              >
                Dismiss
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
