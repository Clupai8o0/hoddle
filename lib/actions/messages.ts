"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkRateLimit } from "@/lib/utils/rate-limit";
import { notify } from "@/lib/actions/notifications";
import {
  sendMessageSchema,
  getOrCreateConversationSchema,
  markConversationReadSchema,
  getConversationsSchema,
  getMessagesSchema,
} from "@/lib/validation/messages";
import type {
  ActionResult,
  ConversationWithMeta,
  MessageWithSender,
  ChatParticipant,
  Message,
} from "@/lib/types/messages";
import type { Database } from "@/lib/supabase/database.types";

/**
 * Escape hatch: cast to an untyped client so we can query tables that exist in
 * the DB but haven't been reflected in database.types.ts yet
 * (conversations, messages, conversation_read_cursors).
 * Remove this once the types are regenerated after migration.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function untyped(client: unknown): SupabaseClient<any> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return client as SupabaseClient<any>;
}

// ── sendMessage ───────────────────────────────────────────────────────────────

/**
 * Insert a message into an existing conversation.
 * Rate-limited to 30 messages per 10 minutes.
 * Fires a debounced new_chat_message notification to the recipient.
 */
export async function sendMessage(
  input: unknown,
): Promise<ActionResult<Message>> {
  const parsed = sendMessageSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
    };
  }

  const { conversationId, body } = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const userId = user.id;

  // Rate limit: 30 messages per 10 minutes
  // The messages table exists in the DB after migration; cast is safe.
  const rateCheck = await checkRateLimit({
    supabase,
    table: "messages" as keyof Database["public"]["Tables"],
    userColumn: "sender_id",
    userId,
    windowMinutes: 10,
    maxCount: 30,
    label: "messages",
  });
  if (!rateCheck.allowed) {
    return { ok: false, error: rateCheck.error };
  }

  // Insert message — RLS enforces sender_id = auth.uid() and participation
  const { data: inserted, error: insertError } = await untyped(supabase)
    .from("messages")
    .insert({ conversation_id: conversationId, sender_id: userId, body })
    .select()
    .single();

  if (insertError || !inserted) {
    return {
      ok: false,
      error: (insertError?.message as string | undefined) ?? "Failed to send message.",
    };
  }

  const insertedMessage = inserted as Message;

  // Determine recipient — fetch conversation to find the other participant
  const { data: convoRow } = await untyped(supabase)
    .from("conversations")
    .select("participant_one, participant_two")
    .eq("id", conversationId)
    .maybeSingle();

  if (!convoRow) {
    // Message inserted but we cannot notify — return success anyway
    return { ok: true, data: insertedMessage };
  }

  const convo = convoRow as { participant_one: string; participant_two: string };
  const recipientId =
    convo.participant_one === userId
      ? convo.participant_two
      : convo.participant_one;

  // Email notification debounce — skip if already notified for this conversation
  // in the last 5 minutes, or if the recipient was active in the last 2 minutes.
  try {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const adminClient = createAdminClient();

    const { count: recentNotifyCount } = await untyped(adminClient)
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("recipient_id", recipientId)
      .eq("type", "new_chat_message")
      .eq("payload->>conversation_id", conversationId)
      .gte("created_at", fiveMinutesAgo);

    const alreadyNotified = (recentNotifyCount ?? 0) > 0;

    if (!alreadyNotified) {
      const twoMinutesAgo = new Date(
        Date.now() - 2 * 60 * 1000,
      ).toISOString();

      const { data: cursorRow } = await untyped(adminClient)
        .from("conversation_read_cursors")
        .select("last_read_at")
        .eq("conversation_id", conversationId)
        .eq("profile_id", recipientId)
        .maybeSingle();

      const lastReadAt =
        (cursorRow as { last_read_at: string } | null)?.last_read_at ?? null;
      const recipientRecentlyActive =
        lastReadAt !== null && lastReadAt >= twoMinutesAgo;

      if (!recipientRecentlyActive) {
        // Fetch sender name for the notification payload
        const { data: senderProfileRow } = await untyped(adminClient)
          .from("profiles")
          .select("full_name")
          .eq("id", userId)
          .maybeSingle();

        const senderName =
          (senderProfileRow as { full_name: string | null } | null)
            ?.full_name ?? "Someone";

        await notify(
          recipientId,
          "new_chat_message" as Parameters<typeof notify>[1],
          {
            conversation_id: conversationId,
            sender_name: senderName,
            sender_id: userId,
            message_preview: body.slice(0, 120),
          },
        );
      }
    }
  } catch (notifyErr) {
    // Notification failure must never block message delivery
    console.error("[sendMessage] Notification error:", notifyErr);
  }

  return { ok: true, data: insertedMessage };
}

// ── getOrCreateConversation ───────────────────────────────────────────────────

/**
 * Find or create a direct conversation between the current user and another profile.
 * At least one participant must be a mentor or admin.
 */
export async function getOrCreateConversation(
  input: unknown,
): Promise<ActionResult<ConversationWithMeta>> {
  const parsed = getOrCreateConversationSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
    };
  }

  const { otherProfileId } = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const userId = user.id;

  if (userId === otherProfileId) {
    return { ok: false, error: "You cannot message yourself." };
  }

  // Eligibility check — at least one participant must be mentor or admin
  const { data: profileRows } = await supabase
    .from("profiles")
    .select("id, role")
    .in("id", [userId, otherProfileId]);

  const profiles = (
    profileRows as { id: string; role: string }[] | null
  ) ?? [];
  const hasMentor = profiles.some(
    (p) => p.role === "mentor" || p.role === "admin",
  );
  if (!hasMentor) {
    return {
      ok: false,
      error: "Chat is only available between students and mentors.",
    };
  }

  // Canonical ordering — ensures uniqueness constraint is consistent
  const p1 = userId < otherProfileId ? userId : otherProfileId;
  const p2 = userId < otherProfileId ? otherProfileId : userId;

  // Look up existing conversation
  const { data: existingRow } = await untyped(supabase)
    .from("conversations")
    .select("*")
    .eq("participant_one", p1)
    .eq("participant_two", p2)
    .maybeSingle();

  let conversationId: string;
  let updatedAt: string;
  let isNew = false;

  if (existingRow) {
    const existing = existingRow as { id: string; updated_at: string };
    conversationId = existing.id;
    updatedAt = existing.updated_at;
  } else {
    const { data: createdRow, error: createError } = await untyped(supabase)
      .from("conversations")
      .insert({ participant_one: p1, participant_two: p2 })
      .select()
      .single();

    if (createError || !createdRow) {
      return {
        ok: false,
        error:
          (createError?.message as string | undefined) ??
          "Failed to create conversation.",
      };
    }

    const created = createdRow as { id: string; updated_at: string };
    conversationId = created.id;
    updatedAt = created.updated_at;
    isNew = true;
  }

  // Fetch the other participant's profile
  const { data: otherProfileRow } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, role")
    .eq("id", otherProfileId)
    .maybeSingle();

  if (!otherProfileRow) {
    return { ok: false, error: "Profile not found." };
  }

  const otherParticipant = otherProfileRow as unknown as ChatParticipant;

  if (isNew) {
    return {
      ok: true,
      data: {
        id: conversationId,
        updated_at: updatedAt,
        other_participant: otherParticipant,
        last_message: null,
        unread_count: 0,
      },
    };
  }

  // Existing conversation — fetch real last_message and unread_count
  const { data: lastMsgRow } = await untyped(supabase)
    .from("messages")
    .select("id, body, sender_id, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const lastMessage = lastMsgRow as {
    id: string;
    body: string;
    sender_id: string;
    created_at: string;
  } | null;

  // Read cursor for current user
  const { data: cursorRow } = await untyped(supabase)
    .from("conversation_read_cursors")
    .select("last_read_at")
    .eq("conversation_id", conversationId)
    .eq("profile_id", userId)
    .maybeSingle();

  const lastReadAt =
    (cursorRow as { last_read_at: string } | null)?.last_read_at ?? null;

  let unreadCount = 0;
  if (lastMessage && lastMessage.sender_id !== userId) {
    const { count } = await untyped(supabase)
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("conversation_id", conversationId)
      .neq("sender_id", userId)
      .gte("created_at", lastReadAt ?? "1970-01-01");
    unreadCount = (count as number | null) ?? 0;
  }

  return {
    ok: true,
    data: {
      id: conversationId,
      updated_at: updatedAt,
      other_participant: otherParticipant,
      last_message: lastMessage,
      unread_count: unreadCount,
    },
  };
}

// ── markConversationRead ──────────────────────────────────────────────────────

/**
 * Upsert the read cursor for the current user in a conversation.
 */
export async function markConversationRead(
  input: unknown,
): Promise<ActionResult<undefined>> {
  const parsed = markConversationReadSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
    };
  }

  const { conversationId } = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await untyped(supabase)
    .from("conversation_read_cursors")
    .upsert(
      {
        conversation_id: conversationId,
        profile_id: user.id,
        last_read_at: new Date().toISOString(),
      },
      { onConflict: "conversation_id,profile_id" },
    );

  if (error) {
    return { ok: false, error: "Failed to mark conversation as read." };
  }

  revalidatePath("/messages");
  return { ok: true, data: undefined };
}

// ── getConversations ──────────────────────────────────────────────────────────

/**
 * Paginated list of conversations for the current user,
 * ordered by most recently updated, with last_message and unread_count.
 */
export async function getConversations(input: unknown): Promise<
  ActionResult<{
    conversations: ConversationWithMeta[];
    hasMore: boolean;
  }>
> {
  const parsed = getConversationsSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
    };
  }

  const { cursor, limit } = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const userId = user.id;

  // Fetch conversations — limit+1 for hasMore detection
  let query = untyped(supabase)
    .from("conversations")
    .select("*")
    .or(`participant_one.eq.${userId},participant_two.eq.${userId}`)
    .order("updated_at", { ascending: false })
    .limit(limit + 1);

  if (cursor) {
    query = query.lt("updated_at", cursor);
  }

  const { data: convoRows, error: convoError } = await query;

  if (convoError) {
    return { ok: false, error: "Failed to load conversations." };
  }

  const rows = (
    convoRows as {
      id: string;
      participant_one: string;
      participant_two: string;
      updated_at: string;
    }[] | null
  ) ?? [];

  const hasMore = rows.length > limit;
  const pageRows = hasMore ? rows.slice(0, limit) : rows;

  if (pageRows.length === 0) {
    return { ok: true, data: { conversations: [], hasMore: false } };
  }

  // Batch-fetch all other participant profiles in a single query
  const otherIds = pageRows.map((r) =>
    r.participant_one === userId ? r.participant_two : r.participant_one,
  );
  const uniqueOtherIds = [...new Set(otherIds)];

  const { data: profileRows } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, role")
    .in("id", uniqueOtherIds);

  const profileMap = new Map<string, ChatParticipant>(
    ((profileRows as unknown as ChatParticipant[]) ?? []).map((p) => [p.id, p]),
  );

  // Assemble each ConversationWithMeta
  const conversations: ConversationWithMeta[] = await Promise.all(
    pageRows.map(async (row) => {
      const otherId =
        row.participant_one === userId
          ? row.participant_two
          : row.participant_one;

      const otherParticipant = profileMap.get(otherId) ?? {
        id: otherId,
        full_name: null,
        avatar_url: null,
        role: "student" as const,
      };

      // Last message
      const { data: lastMsgRow } = await untyped(supabase)
        .from("messages")
        .select("id, body, sender_id, created_at")
        .eq("conversation_id", row.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const lastMessage = lastMsgRow as {
        id: string;
        body: string;
        sender_id: string;
        created_at: string;
      } | null;

      // Read cursor
      const { data: cursorRow } = await untyped(supabase)
        .from("conversation_read_cursors")
        .select("last_read_at")
        .eq("conversation_id", row.id)
        .eq("profile_id", userId)
        .maybeSingle();

      const lastReadAt =
        (cursorRow as { last_read_at: string } | null)?.last_read_at ?? null;

      let unreadCount = 0;
      if (lastMessage && lastMessage.sender_id !== userId) {
        const { count } = await untyped(supabase)
          .from("messages")
          .select("id", { count: "exact", head: true })
          .eq("conversation_id", row.id)
          .neq("sender_id", userId)
          .gte("created_at", lastReadAt ?? "1970-01-01");
        unreadCount = (count as number | null) ?? 0;
      }

      return {
        id: row.id,
        updated_at: row.updated_at,
        other_participant: otherParticipant,
        last_message: lastMessage,
        unread_count: unreadCount,
      };
    }),
  );

  return { ok: true, data: { conversations, hasMore } };
}

// ── getMessages ───────────────────────────────────────────────────────────────

/**
 * Cursor-paginated messages for a conversation (newest-first, reversed for display).
 * Verifies the current user is a participant before fetching.
 */
export async function getMessages(input: unknown): Promise<
  ActionResult<{
    messages: MessageWithSender[];
    hasMore: boolean;
  }>
> {
  const parsed = getMessagesSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
    };
  }

  const { conversationId, cursor, limit } = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const userId = user.id;

  // Verify participant — explicit check for good errors; RLS also enforces this
  const { data: convoRow } = await untyped(supabase)
    .from("conversations")
    .select("participant_one, participant_two")
    .eq("id", conversationId)
    .maybeSingle();

  const convo = convoRow as {
    participant_one: string;
    participant_two: string;
  } | null;

  if (
    !convo ||
    (convo.participant_one !== userId && convo.participant_two !== userId)
  ) {
    return { ok: false, error: "Conversation not found." };
  }

  // Fetch messages newest-first for cursor pagination
  let query = untyped(supabase)
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .limit(limit + 1);

  if (cursor) {
    query = query.lt("created_at", cursor);
  }

  const { data: msgRows, error: msgError } = await query;

  if (msgError) {
    return { ok: false, error: "Failed to load messages." };
  }

  const rows = (msgRows as Message[] | null) ?? [];
  const hasMore = rows.length > limit;
  const pageRows = hasMore ? rows.slice(0, limit) : rows;

  if (pageRows.length === 0) {
    return { ok: true, data: { messages: [], hasMore: false } };
  }

  // Batch-fetch all sender profiles in a single query
  const senderIds = [...new Set(pageRows.map((m) => m.sender_id))];

  const { data: profileRows } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, role")
    .in("id", senderIds);

  const profileMap = new Map<string, ChatParticipant>(
    ((profileRows as unknown as ChatParticipant[]) ?? []).map((p) => [p.id, p]),
  );

  // Map messages to MessageWithSender, then reverse to chronological order
  const messages: MessageWithSender[] = pageRows
    .map((msg) => ({
      ...msg,
      sender: profileMap.get(msg.sender_id) ?? {
        id: msg.sender_id,
        full_name: null,
        avatar_url: null,
        role: "student" as const,
      },
    }))
    .reverse();

  return { ok: true, data: { messages, hasMore } };
}
